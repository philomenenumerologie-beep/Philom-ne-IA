const statusEl = document.getElementById("status");
const codeValueEl = document.getElementById("codeValue");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const previewEl = document.getElementById("preview");

let isRunning = false;
let lastCode = null;

function setStatus(text, type = "info") {
  statusEl.textContent = text;
  statusEl.className = type === "ok" || type === "err" ? type : "";
}

function onDetected(result) {
  const code = result?.codeResult?.code;
  if (!code || code === lastCode) return;
  lastCode = code;

  setStatus("✅ Code détecté : " + code, "ok");
  codeValueEl.textContent = code;
}

function initScanner(constraints) {
  Quagga.init(
    {
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: previewEl,
        constraints,
      },
      decoder: {
        readers: ["ean_reader", "upc_reader", "code_128_reader"],
      },
      locate: true,
    },
    (err) => {
      if (err) {
        console.error("Erreur Quagga :", err);
        setStatus("❌ Erreur d'initialisation caméra / scanner.", "err");
        return;
      }
      Quagga.start();
      isRunning = true;
      setStatus("📷 Scanner en cours... Vise un code-barres.", "info");
      Quagga.offDetected(onDetected);
      Quagga.onDetected(onDetected);
    }
  );
}

function startScanner() {
  if (isRunning) return;
  lastCode = null;
  codeValueEl.textContent = "";
  setStatus("⏳ Demande l'accès à la caméra...", "info");

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setStatus("❌ Ton navigateur ne supporte pas la caméra.", "err");
    return;
  }

  // Test accès caméra arrière
  navigator.mediaDevices
    .getUserMedia({ video: { facingMode: { ideal: "environment" } } })
    .then((stream) => {
      stream.getTracks().forEach((t) => t.stop());
      initScanner({
        facingMode: { ideal: "environment" },
        width: { ideal: 640 },
        height: { ideal: 480 },
      });
    })
    .catch(() => {
      // Fallback caméra frontale
      setStatus("📱 Caméra arrière indisponible, essai avec la frontale…", "info");
      initScanner({
        facingMode: "user",
        width: { ideal: 640 },
        height: { ideal: 480 },
      });
    });
}

function stopScanner() {
  if (isRunning) {
    Quagga.stop();
    isRunning = false;
  }
  setStatus("Scan arrêté. Clique sur Démarrer pour relancer.", "info");
}

startBtn.addEventListener("click", startScanner);
stopBtn.addEventListener("click", stopScanner);

// Vérif que Quagga est bien chargé
if (typeof Quagga === "undefined") {
  setStatus("❌ Erreur : QuaggaJS ne s'est pas chargé (CDN).", "err");
} else {
  setStatus("✅ Scanner prêt. Clique sur Démarrer.", "ok");
}
