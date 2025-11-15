// barcode-pro.js – Scanner Pro avec ZXing
(function () {
  const video        = document.getElementById("preview");
  const statusEl     = document.getElementById("status");
  const codeBox      = document.getElementById("codeValueBox");
  const codeLabelEl  = codeBox.querySelector("span");
  const codeValueEl  = document.getElementById("codeValue");
  const startBtn     = document.getElementById("startBtn");
  const stopBtn      = document.getElementById("stopBtn");

  // Lecteur ZXing
  const codeReader = new ZXing.BrowserMultiFormatReader();
  let currentDeviceId = null;
  let scanning = false;
  let lastCode = null;

  function setStatus(msg, type) {
    statusEl.textContent = msg || "";
    statusEl.classList.remove("ok", "err");
    if (type === "ok")  statusEl.classList.add("ok");
    if (type === "err") statusEl.classList.add("err");
  }

  async function chooseCamera() {
    const devices = await ZXing.BrowserMultiFormatReader.listVideoInputDevices();
    if (!devices.length) throw new Error("Aucune caméra détectée.");

    // Caméra arrière si possible
    const back = devices.find(d =>
      /back|rear|arrière|environment/i.test(d.label)
    );
    return (back || devices[0]).deviceId;
  }

  async function startScan() {
    if (scanning) return;

    try {
      setStatus("Initialisation du scanner…");

      if (!currentDeviceId) {
        currentDeviceId = await chooseCamera();
      }

      lastCode = null;
      scanning = true;
      codeLabelEl.textContent = "Aucun produit scanné pour le moment.";
      codeValueEl.textContent = "";

      // Démarrage ZXing
      codeReader.decodeFromVideoDevice(
        currentDeviceId,
        video,
        (result, err) => {
          if (!scanning) return;

          if (result) {
            const code = result.getText();
            if (!code || code === lastCode) return;
            lastCode = code;
            onCodeDetected(code);
          }
          // err est souvent juste "NotFoundException" entre deux scans → on ignore
        }
      );

      setStatus("📷 Scanner en cours… vise un code-barres net.", "ok");
    } catch (e) {
      console.error("Erreur démarrage ZXing:", e);
      setStatus("❌ Impossible de démarrer la caméra.", "err");
      scanning = false;
    }
  }

  function stopScan() {
    if (!scanning) return;
    scanning = false;

    try {
      codeReader.reset();     // Arrêt du flux vidéo
    } catch (e) {
      console.warn("Erreur reset ZXing:", e);
    }

    // On coupe proprement le flux dans l’élément <video>
    if (video.srcObject) {
      try {
        video.srcObject.getTracks().forEach(t => t.stop());
      } catch {}
      video.srcObject = null;
    }

    setStatus("🛑 Scan arrêté. Clique sur Démarrer pour relancer.");
  }

  async function onCodeDetected(code) {
    if (navigator.vibrate) navigator.vibrate(80);

    codeLabelEl.textContent = "Code détecté :";
    codeValueEl.textContent = code;
    setStatus("✅ Code détecté : " + code, "ok");

    try {
      const url = "https://api.philomeneia.com/barcode?code=" + encodeURIComponent(code);
      const resp = await fetch(url);

      if (!resp.ok) {
        codeLabelEl.textContent =
          "Code lu. Impossible de récupérer les infos produit (erreur serveur).";
        return;
      }

      const data = await resp.json();

      if (data && data.found) {
        const name  = data.name || "Produit";
        const brand = data.brand ? ` • ${data.brand}` : "";
        const qte   = data.quantity ? ` • ${data.quantity}` : "";
        const ns    = data.nutriscore
          ? ` • NutriScore : ${String(data.nutriscore).toUpperCase()}`
          : "";
        const nova  = data.nova ? ` • Nova : ${data.nova}` : "";

        codeLabelEl.textContent = `${name}${brand}${qte}${ns}${nova}`;
      } else {
        codeLabelEl.textContent =
          "Code lu mais produit non trouvé dans la base. (Lecture OK ✅)";
      }
    } catch (e) {
      console.error("Erreur appel API barcode:", e);
      codeLabelEl.textContent =
        "Code lu mais problème de connexion à l’API.";
    }
  }

  startBtn.addEventListener("click", startScan);
  stopBtn.addEventListener("click", stopScan);

  setStatus("⏱️ Scanner Pro prêt. Clique sur Démarrer pour tester.");
})();
