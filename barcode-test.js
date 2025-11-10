// Scanner code-barres avec QuaggaJS (gratuit, tout côté navigateur)

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
  if (!code || code === lastCode) return;
  lastCode = code;

  setStatus("✅ Code détecté : " + code, "ok");
  codeValueEl.textContent = code;
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

  Quagga.init(
    {
      inputStream: {
        type: "LiveStream",
        target: previewEl,
        constraints: {
          facingMode: "environment", // caméra arrière
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      },
      decoder: {
        readers: ["ean_reader", "upc_reader", "code_128_reader"]
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

if (typeof Quagga === "undefined") {
  setStatus("❌ Erreur de chargement de QuaggaJS.", "err");
}
