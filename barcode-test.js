// barcode-test.js
// Test simple : lire un code-barres avec la caméra et l'afficher.

const video = document.getElementById("video");
const resultBox = document.getElementById("result");
const stopBtn = document.getElementById("stopBtn");

let codeReader = null;
let activeStream = null;

async function startScanner() {
  try {
    codeReader = new ZXing.BrowserMultiFormatReader();

    const devices = await ZXing.BrowserMultiFormatReader.listVideoInputDevices();
    const deviceId = (devices[0] && devices[0].deviceId) || null;

    const constraints = {
      video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: "environment" }
    };

    activeStream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = activeStream;

    codeReader.decodeFromVideoDevice(deviceId, video, (result, err) => {
      if (result) {
        const text = result.getText();
        resultBox.textContent = `✅ Code détecté : ${text}`;
        console.log("Barcode:", text);
      }
      // err silencieux = pas de code sur cette frame, normal
    });
  } catch (err) {
    console.error(err);
    resultBox.textContent = "❌ Erreur accès caméra ou scanner.";
  }
}

function stopScanner() {
  if (codeReader) {
    codeReader.reset();
    codeReader = null;
  }
  if (activeStream) {
    activeStream.getTracks().forEach(t => t.stop());
    activeStream = null;
  }
  resultBox.textContent = "Scan arrêté.";
}

stopBtn.addEventListener("click", stopScanner);

if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  startScanner();
} else {
  resultBox.textContent = "❌ Caméra non supportée sur ce navigateur.";
}
