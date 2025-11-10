// barcode-test.js
// Scan code-barres + infos produit via ton backend Philomène
// Backend : https://api.philomeneia.com/barcode?code=XXXXX

const API_BASE = "https://api.philomeneia.com";

// Éléments HTML (à avoir dans barcode-test.html)
const videoEl     = document.getElementById("barcodeVideo");
const statusEl    = document.getElementById("barcodeStatus");
const lastCodeEl  = document.getElementById("barcodeLastCode");
const resultEl    = document.getElementById("barcodeResult");
const startBtn    = document.getElementById("btnStart");
const stopBtn     = document.getElementById("btnStop");

let stream = null;
let detector = null;
let scanning = false;
let lastCode = null;

// --- Vérif support navigateur ---
(function init() {
  if (!("mediaDevices" in navigator) || !("getUserMedia" in navigator.mediaDevices)) {
    setStatus("❌ Ton appareil ne permet pas d'accéder à la caméra.", true);
    disableStart();
    return;
  }

  if (!("BarcodeDetector" in window)) {
    setStatus("❌ Ton navigateur ne supporte pas BarcodeDetector.", true);
    disableStart();
    return;
  }

  try {
    detector = new BarcodeDetector({
      formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"]
    });
    setStatus("✅ Prêt. Clique sur Démarrer pour scanner.");
  } catch (err) {
    console.error(err);
    setStatus("❌ Erreur initialisation scanner.", true);
    disableStart();
  }
})();

// --- Boutons ---
startBtn.addEventListener("click", startScan);
stopBtn.addEventListener("click", stopScan);

// --- Fonctions UI ---
function setStatus(text, isError = false) {
  if (!statusEl) return;
  statusEl.textContent = text;
  statusEl.style.background = isError ? "#4b0000" : "transparent";
}

function showCode(code) {
  if (lastCodeEl) {
    lastCodeEl.textContent = code ? String(code) : "Aucun produit scanné pour le moment.";
  }
}

function showResult(data, code) {
  if (!resultEl) return;

  if (!data || data.found !== true) {
    resultEl.innerHTML = `
      <div style="color:#ff5c5c">
        ❌ Produit introuvable pour le code <strong>${code}</strong>.
      </div>`;
    return;
  }

  const {
    name,
    brand,
    quantity,
    nutriscore,
    nova,
    eco_score,
    image
  } = data;

  const nutri = nutriscore ? nutriscore.toString().toUpperCase() : "?";

  resultEl.innerHTML = `
    <div style="padding:10px;border-radius:10px;background:#0b1b26;">
      <div style="font-size:16px;font-weight:600;margin-bottom:4px;">
        ✅ ${name || "Produit détecté"}
      </div>
      <div style="opacity:0.9;margin-bottom:4px;">
        Marque : <strong>${brand || "?"}</strong>
        ${quantity ? ` • ${quantity}` : ""}
      </div>
      <div style="margin-bottom:4px;">
        Nutri-Score : <strong>${nutri}</strong>
        ${Number.isFinite(nova) ? ` • NOVA : <strong>${nova}</strong>` : ""}
        ${eco_score ? ` • Éco-score : <strong>${eco_score}</strong>` : ""}
      </div>
      ${
        image
          ? `<div style="margin-top:6px;">
               <img src="${image}" alt="Produit" style="max-width:120px;border-radius:6px;border:1px solid #1f3340;">
             </div>`
          : ""
      }
      <div style="margin-top:6px;font-size:11px;opacity:0.6;">
        Données OpenFoodFacts via Philomène I.A.
      </div>
    </div>
  `;
}

function disableStart() {
  if (startBtn) {
    startBtn.disabled = true;
    startBtn.style.opacity = 0.4;
  }
}

// --- Scan caméra ---
async function startScan() {
  if (scanning) return;
  if (!detector) {
    setStatus("❌ Scanner indisponible.", true);
    return;
  }

  try {
    // Caméra arrière si possible
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });

    videoEl.srcObject = stream;
    await videoEl.play();

    scanning = true;
    lastCode = null;
    showCode("");
    resultEl.innerHTML = "";
    setStatus("📷 Scanner en cours... Vise un code-barres.");

    requestAnimationFrame(scanLoop);
  } catch (err) {
    console.error("getUserMedia error:", err);
    setStatus("❌ Accès caméra refusé ou impossible.", true);
  }
}

function stopScan() {
  scanning = false;
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
  videoEl.srcObject = null;
  setStatus("🛑 Scan arrêté. Clique sur Démarrer pour relancer.");
}

// Boucle de détection
async function scanLoop() {
  if (!scanning || !detector) return;

  if (videoEl.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA) {
    try {
      const barcodes = await detector.detect(videoEl);

      if (Array.isArray(barcodes) && barcodes.length > 0) {
        const code = barcodes[0].rawValue?.trim();
        if (code && code !== lastCode) {
          lastCode = code;
          showCode(code);
          fetchProductInfo(code);
        }
      }
    } catch (err) {
      console.error("Detection error:", err);
      setStatus("❌ Erreur de lecture du code-barres.", true);
      // On ne stoppe pas tout de suite, on laisse relancer.
      scanning = false;
      return;
    }
  }

  if (scanning) {
    requestAnimationFrame(scanLoop);
  }
}

// --- Appel à ton backend /barcode ---
async function fetchProductInfo(code) {
  setStatus(`🔎 Recherche du produit pour ${code}...`);

  try {
    const resp = await fetch(`${API_BASE}/barcode?code=${encodeURIComponent(code)}`, {
      method: "GET"
    });

    if (!resp.ok) {
      throw new Error("HTTP " + resp.status);
    }

    const data = await resp.json();
    showResult(data, code);
    setStatus("✅ Produit détecté.");
  } catch (err) {
    console.error("fetch /barcode error:", err);
    setStatus("❌ Erreur lors de la récupération du produit.", true);
  }
}
