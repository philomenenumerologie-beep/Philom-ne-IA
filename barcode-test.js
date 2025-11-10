(() => {
  const video = document.getElementById("preview");
  const statusEl = document.getElementById("status");
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");

  if (!video || !statusEl) {
    console.error("Éléments manquants dans la page.");
    return;
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    statusEl.textContent = "❌ getUserMedia non supporté sur ce navigateur.";
    statusEl.className = "error";
    return;
  }

  const codeReader = new ZXing.BrowserMultiFormatReader();
  let isRunning = false;

  async function startScanner() {
    if (isRunning) return;
    isRunning = true;

    try {
      statusEl.textContent = "Demande l’autorisation de la caméra…";
      statusEl.className = "";

      const devices = await codeReader.listVideoInputDevices();
      if (!devices || devices.length === 0) {
        statusEl.textContent = "❌ Aucune caméra détectée.";
        statusEl.className = "error";
        isRunning = false;
        return;
      }

      const deviceId = devices[0].deviceId;

      await codeReader.decodeFromVideoDevice(
        deviceId,
        video,
        (result, err) => {
          if (result) {
            const text = result.getText();
            statusEl.innerHTML =
              `✅ Code détecté : <span class="code">${text}</span>`;
            statusEl.className = "ok";
            console.log("Code-barres:", text);
          } else if (err && !(err instanceof ZXing.NotFoundException)) {
            console.warn("Erreur scan", err);
          }
        }
      );

      statusEl.textContent = "📷 Scanne un code-barres devant la caméra…";
      statusEl.className = "";
    } catch (e) {
      console.error(e);
      statusEl.textContent = "❌ Erreur : " + (e.message || e.name || e);
      statusEl.className = "error";
      isRunning = false;
      codeReader.reset();
    }
  }

  function stopScanner() {
    if (!isRunning) return;
    codeReader.reset();
    isRunning = false;
    statusEl.textContent = "Arrêté. Clique sur Démarrer pour relancer.";
    statusEl.className = "";
  }

  startBtn.addEventListener("click", startScanner);
  stopBtn.addEventListener("click", stopScanner);

  // Lance automatiquement au chargement
  window.addEventListener("load", startScanner);
  window.addEventListener("pagehide", stopScanner);
})();
