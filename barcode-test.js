// barcode-test.js
// Scanner code-barres avec QuaggaJS (gratuit, 100% côté navigateur)

const previewEl = document.getElementById("preview");
const statusEl = document.getElementById("status");
const codeValueEl = document.getElementById("codeValue");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");

let isRunning = false;
let lastCode = null;

function setStatus(text, type = "info") {
  statusEl.textContent = text;
  statusEl.className = type;
}

function onDetected(result) {
  const code = result?.codeResult?.code;
  if (!code) return;

  // Évite de spammer le même code 50x
  if (code === lastCode) return;
  lastCode = code;

  setStatus("✅ Code détecté", "ok");
  codeValueEl.textContent = code;

  // Ici plus tard : requête NutriScore / OpenFoodFacts avec ce code
  // pour afficher les infos produit dans Philomène.
}

function startScanner() {
  if (isRunning) return;
  lastCode = null;
  codeValueEl.textContent = "";
  setStatus("⏳ Demande l'accès à la caméra...", "info");

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setStatus("❌ Ton navigateur ne supporte pas la caméra (getUserMedia).", "err");
    return;
  }

  // Config Quagga
  Quagga.init(
    {
      inputStream: {
        type: "LiveStream",
        target: previewEl,
        constraints: {
          facingMode: "environment", // caméra arrière
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      },
      decoder: {
        readers: [
          "ean_reader",
          "ean_8_reader",
          "upc_reader",
          "upc_e_reader",
          "code_128_reader"
        ]
      },
      locate: true
    },
    function (err) {
      if (err) {
        console.error(err);
        setStatus("❌ Erreur d'initialisation caméra / scanner.", "err");
        return;
      }
      Quagga.start();
      isRunning = true;
      setStatus("📷 Scanner en cours... Vise un code-barres.", "info");
    }
  );

  Quagga.offDetected(onDetected);
  Quagga.onDetected(onDetected);
}

function stopScanner() {
  if (!isRunning) {
    setStatus("Scan arrêté. Clique sur Démarrer pour relancer.", "info");
    return;
  }
  Quagga.stop();
  isRunning = false;
  setStatus("Scan arrêté. Clique sur Démarrer pour relancer.", "info");
}

startBtn.addEventListener("click", startScanner);
stopBtn.addEventListener("click", stopScanner);

// Petit message si Quagga ne charge pas
if (typeof Quagga === "undefined") {
  setStatus("❌ QuaggaJS n'a pas été chargé (vérifie le script dans le HTML).", "err");
}
