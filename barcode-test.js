// barcode-test.js
// Utilise Quagga pour scanner un code-barres
// et demande les infos produit à ton backend /barcode

const API_BASE = "https://api.philomeneia.com";

const previewEl   = document.getElementById("preview");
const statusEl    = document.getElementById("status");
const startBtn    = document.getElementById("startBtn");
const stopBtn     = document.getElementById("stopBtn");
const codeBox     = document.getElementById("codeValueBox");
const codeValueEl = document.getElementById("codeValue");

let lastCode = null;
let isRunning = false;

// ------ Helpers UI ------
function setStatus(msg, type = "") {
  if (!statusEl) return;
  statusEl.textContent = msg;
  statusEl.classList.remove("ok", "err");
  if (type === "ok") statusEl.classList.add("ok");
  if (type === "err") statusEl.classList.add("err");
}
function showCode(code) {
  if (!codeValueEl || !codeBox) return;
  if (!code) {
    codeBox.querySelector("span").textContent =
      "Aucun produit scanné pour le moment.";
    codeValueEl.textContent = "";
    return;
  }
  codeBox.querySelector("span").textContent = "Code détecté :";
  codeValueEl.textContent = code;
}

// ------ Init ------
if (!window.Quagga) {
  setStatus("❌ Librairie Quagga introuvable.", "err");
} else if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
  setStatus("❌ Caméra non supportée sur cet appareil.", "err");
} else {
  setStatus("✅ Prêt. Clique sur Démarrer pour scanner.", "ok");
}

startBtn.addEventListener("click", startScan);
stopBtn.addEventListener("click", stopScan);

// ------ Start ------
function startScan() {
  if (isRunning || !window.Quagga) return;

  setStatus("📷 Demande l'accès à la caméra…");

  Quagga.init(
    {
      inputStream: {
        type: "LiveStream",
        target: previewEl,
        constraints: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      },
      decoder: {
        readers: [
          "ean_reader",
