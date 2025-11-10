// --- Vérification initiale ---
const statusEl = document.getElementById("status");
const preview = document.getElementById("preview");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const productInfoEl = document.getElementById("productInfo");

let stream = null;
let detector = null;
let scanning = false;
let lastCode = null;

// --- Fonctions d'affichage ---
function setStatusOk(msg) {
  statusEl.classList.remove("err");
  statusEl.classList.add("ok");
  statusEl.textContent = msg;
}
function setStatusErr(msg) {
  statusEl.classList.remove("ok");
  statusEl.classList.add("err");
  statusEl.textContent = msg;
}
function showProductLoading(code) {
  productInfoEl.innerHTML = `
    <div>📦 Code détecté : <strong>${code}</strong><br>
    <span class="small">Recherche du produit dans OpenFoodFacts...</span></div>
  `;
}
function showProductNotFound(code) {
  productInfoEl.innerHTML = `
    <div>❔ Aucun produit trouvé pour <strong>${code}</strong>.</div>
  `;
}
function renderProduct(data, code) {
  const p = data.product;
  const name = p.product_name_fr || p.product_name || "Nom inconnu";
  const brand = (p.brands || "").split(",")[0] || "Marque inconnue";
  const img = p.image_front_small_url || p.image_url || "";
  const nutri = p.nutriscore_grade
    ? p.nutriscore_grade.toUpperCase()
    : "Inconnu";
  const kcal = p.nutriments?.["energy-kcal_100g"]
    ? Math.round(p.nutriments["energy-kcal_100g"]) + " kcal / 100g"
    : "Infos calories non dispo";

  productInfoEl.innerHTML = `
    <h2>${name}</h2>
    <div class="product-row">
      ${img ? `<img src="${img}" alt="Produit">` : ""}
      <div>
        <div>Marque : <strong>${brand}</strong></div>
        <div class="nutri">NutriScore : <strong>${nutri}</strong></div>
        <div class="small">${kcal}</div>
        <div class="small">Source : OpenFoodFacts • ${code}</div>
      </div>
    </div>
  `;
}

// --- OpenFoodFacts ---
async function fetchProductFromOpenFoodFacts(code) {
  try {
    showProductLoading(code);
    const urls = [
      `https://world.openfoodfacts.org/api/v2/product/${code}.json`,
      `https://world.openfoodfacts.org/api/v0/product/${code}.json`
    ];

    let data = null;
    for (const url of urls) {
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json && json.product) {
          data = json;
          break;
        }
      }
    }

    if (!data) return showProductNotFound(code);
    renderProduct(data, code);
  } catch (err) {
    console.error(err);
    productInfoEl.innerHTML = `<div>⚠️ Erreur lors de la récupération.</div>`;
  }
}

// --- Scan caméra ---
async function startScan() {
  if (scanning) return;

  if (!("BarcodeDetector" in window)) {
    setStatusErr("Ton navigateur ne supporte pas BarcodeDetector.");
    return;
  }

  try {
    detector = new BarcodeDetector({
      formats: ["ean_13", "ean_8", "code_128", "upc_a", "upc_e"]
    });

    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false
    });

    const video = document.createElement("video");
    video.autoplay = true;
    video.playsInline = true;
    video.srcObject = stream;
    preview.innerHTML = "";
    preview.appendChild(video);

    scanning = true;
    lastCode = null;
    setStatusOk("📷 Scan en cours… vise un code-barres.");

    const loop = async () => {
      if (!scanning) return;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        try {
          const barcodes = await detector.detect(canvas);
          if (barcodes.length > 0) {
            const code = barcodes[0].rawValue.trim();
            if (code && code !== lastCode) {
              lastCode = code;
              setStatusOk("✅ Code détecté : " + code);
              fetchProductFromOpenFoodFacts(code);
            }
          }
        } catch (e) {
          console.warn("Erreur détection :", e);
        }
      }
      requestAnimationFrame(loop);
    };
    loop();
  } catch (err) {
    console.error(err);
    setStatusErr("❌ Erreur d'accès à la caméra.");
  }
}

function stopScan() {
  scanning = false;
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
  preview.innerHTML = "";
  setStatusErr("Scan arrêté. Clique sur Démarrer pour relancer.");
}

// --- Boutons ---
startBtn.addEventListener("click", startScan);
stopBtn.addEventListener("click", stopScan);

setStatusErr("⚡ Prêt. Clique sur Démarrer pour tester le scanner.");
