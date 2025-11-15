// barcode-test.js
// Test scanner code-barres + appel API Philomène
// - Lecture EAN-13 / EAN-8 (avec vérification du chiffre de contrôle)
// - Gestion propre du START / STOP pour iOS Safari

(function () {
  const preview      = document.getElementById("preview");
  const statusEl     = document.getElementById("status");
  const codeBox      = document.getElementById("codeValueBox");
  const codeLabelEl  = codeBox.querySelector("span");
  const codeValueEl  = document.getElementById("codeValue");
  const startBtn     = document.getElementById("startBtn");
  const stopBtn      = document.getElementById("stopBtn");

  let isInit    = false;
  let isRunning = false;
  let lastCode  = null;

  // -------------------------------
  // Helpers affichage
  // -------------------------------
  function setStatus(msg, type) {
    statusEl.textContent = msg || "";
    statusEl.classList.remove("ok", "err");
    if (type === "ok")  statusEl.classList.add("ok");
    if (type === "err") statusEl.classList.add("err");
  }

  // -------------------------------
  // Vérification EAN (anti faux positifs)
  // -------------------------------
  function isValidEAN13(code) {
    if (!/^\d{13}$/.test(code)) return false;
    const digits = code.split("").map((c) => parseInt(c, 10));
    let sum = 0;
    // 12 premiers chiffres
    for (let i = 0; i < 12; i++) {
      sum += digits[i] * (i % 2 === 0 ? 1 : 3);
    }
    const check = (10 - (sum % 10)) % 10;
    return check === digits[12];
  }

  function isValidEAN8(code) {
    if (!/^\d{8}$/.test(code)) return false;
    const digits = code.split("").map((c) => parseInt(c, 10));
    let sum = 0;
    // 7 premiers chiffres
    for (let i = 0; i < 7; i++) {
      sum += digits[i] * (i % 2 === 0 ? 3 : 1);
    }
    const check = (10 - (sum % 10)) % 10;
    return check === digits[7];
  }

  function isValidBarcode(code) {
    if (!code) return false;
    if (/^\d{13}$/.test(code)) return isValidEAN13(code);
    if (/^\d{8}$/.test(code))  return isValidEAN8(code);
    return false; // on ignore les autres longueurs
  }

  // -------------------------------
  // Fix iOS Safari : reset caméra
  // -------------------------------
  function forceCameraReset() {
    // Track actif géré par Quagga
    try {
      const track =
        window?.Quagga?.cameraAccess?.getActiveTrack?.() ||
        window?.Quagga?._cameraAccess?.getActiveTrack?.();
      if (track) {
        try { track.stop(); } catch (e) {}
      }
    } catch (e) {
      console.warn("Erreur forceCameraReset (track):", e);
    }

    // Flux vidéo dans le DOM (Safari garde parfois un stream zombie)
    try {
      const video = preview.querySelector("video");
      if (video && video.srcObject) {
        try {
          video.srcObject.getTracks().forEach((t) => t.stop());
        } catch (e) {}
        video.srcObject = null;
      }
    } catch (e) {
      console.warn("Erreur forceCameraReset (video):", e);
    }
  }

  // -------------------------------
  // Initialisation Quagga
  // -------------------------------
  function initQuagga() {
    return new Promise((resolve, reject) => {
      if (isInit) return resolve();

      if (!window.Quagga) {
        setStatus("❌ QuaggaJS introuvable (CDN).", "err");
        return reject(new Error("Quagga manquant"));
      }

      Quagga.init(
        {
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: preview,
            constraints: {
              facingMode: "environment",
              width: { min: 640 },
              height: { min: 480 },
            },
          },
          locator: { patchSize: "medium", halfSample: true },
          decoder: {
            readers: [
              "ean_reader",     // EAN-13 (codes produits Europe)
              "ean_8_reader",   // EAN-8
              // on garde les autres en commentaire pour le moment
              // "upc_reader",
              // "upc_e_reader",
              // "code_128_reader"
            ],
          },
          locate: true,
          numOfWorkers: navigator.hardwareConcurrency || 2,
        },
        (err) => {
          if (err) {
            console.error("Quagga init error:", err);
            setStatus("❌ Erreur d'initialisation du scanner.", "err");
            return reject(err);
          }
          isInit = true;
          setStatus("✅ Scanner prêt. Clique sur Démarrer.", "ok");
          Quagga.onDetected(onDetected);
          resolve();
        }
      );
    });
  }

  // -------------------------------
  // Démarrer le scan
  // -------------------------------
  async function startScan() {
    if (isRunning) return;

    // IMPORTANT : corrige le bug iOS quand on relance après un stop
    forceCameraReset();

    try {
      await initQuagga();
    } catch {
      return;
    }

    lastCode   = null;
    isRunning  = true;
    codeLabelEl.textContent = "Aucun produit scanné pour le moment.";
    codeValueEl.textContent = "";
    setStatus("📷 Scanner en cours… vise un code-barres net.", "ok");

    try {
      Quagga.start();
    } catch (e) {
      console.error("Quagga start error:", e);
      setStatus("❌ Impossible de démarrer la caméra.", "err");
      isRunning = false;
    }
  }

  // -------------------------------
  // Arrêter le scan
  // -------------------------------
  function stopScan() {
    if (!isRunning) return;

    try {
      Quagga.stop();
    } catch (e) {
      console.warn("Quagga stop error:", e);
    }

    // On s'assure que la caméra est bien libérée
    forceCameraReset();

    isRunning = false;
    setStatus("⏹️ Scan arrêté. Clique sur Démarrer pour relancer.", "");
  }

  // -------------------------------
  // Quand un code est détecté
  // -------------------------------
  async function onDetected(result) {
    const rawCode = result?.codeResult?.code;
    if (!rawCode) return;

    // Nettoyage basique
    const code = String(rawCode).trim();

    // Anti-spam : même code répété en boucle → on ignore
    if (code === lastCode) return;

    // Filtre anti faux positifs : uniquement EAN-13 / EAN-8 valides
    if (!isValidBarcode(code)) {
      console.log("Code rejeté (non EAN valide) :", code);
      return;
    }

    lastCode = code;

    if (navigator.vibrate) navigator.vibrate(80);

    codeLabelEl.textContent = "Code détecté :";
    codeValueEl.textContent = code;
    setStatus("✅ Code détecté : " + code, "ok");

    // Appel de ton backend Philomène
    try {
      const url =
        "https://api.philomeneia.com/barcode?code=" +
        encodeURIComponent(code);

      const resp = await fetch(url);

      if (!resp.ok) {
        console.error("Erreur HTTP API /barcode:", resp.status);
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

  // -------------------------------
  // Events boutons
  // -------------------------------
  startBtn.addEventListener("click", startScan);
  stopBtn.addEventListener("click", stopScan);

  // Message initial
  setStatus("⏱️ Initialisation du scanner…", "");
})();
