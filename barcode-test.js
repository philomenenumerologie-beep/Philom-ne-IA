// barcode-test.js
(function () {
  const preview        = document.getElementById("preview");
  const previewWrapper = document.getElementById("previewWrapper");
  const statusEl       = document.getElementById("status");
  const codeBox        = document.getElementById("codeValueBox");
  const codeLabelEl    = codeBox.querySelector("span");
  const codeValueEl    = document.getElementById("codeValue");
  const startBtn       = document.getElementById("startBtn");
  const stopBtn        = document.getElementById("stopBtn");

  let isInit    = false;
  let isRunning = false;
  let lastCode  = null;

  function setStatus(msg, type) {
    statusEl.textContent = msg || "";
    statusEl.classList.remove("ok", "err");
    if (type === "ok")  statusEl.classList.add("ok");
    if (type === "err") statusEl.classList.add("err");
  }

  function setScanningUI(on) {
    if (!previewWrapper) return;
    if (on) {
      previewWrapper.classList.add("is-scanning");
      startBtn.classList.add("disabled");
    } else {
      previewWrapper.classList.remove("is-scanning");
      startBtn.classList.remove("disabled");
    }
  }

  function initQuagga() {
    return new Promise((resolve, reject) => {
      if (isInit) return resolve();

      if (!window.Quagga) {
        setStatus("QuaggaJS introuvable (CDN).", "err");
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
              height: { min: 480 }
            }
          },
          locator: { patchSize: "medium", halfSample: true },
          decoder: {
            readers: [
              "ean_reader",
              "ean_8_reader",
              "upc_reader",
              "upc_e_reader",
              "code_128_reader"
            ]
          },
          locate: true,
          numOfWorkers: navigator.hardwareConcurrency || 2
        },
        (err) => {
          if (err) {
            console.error("Quagga init error:", err);
            setStatus("Erreur d'initialisation du scanner.", "err");
            return reject(err);
          }
          isInit = true;
          setStatus("Scanner prêt. Clique sur « Démarrer » pour lancer la caméra.", "ok");
          Quagga.onDetected(onDetected);
          resolve();
        }
      );
    });
  }

  async function startScan() {
    if (isRunning) return;

    // si Safari a bloqué la caméra avant, on garde le message clair
    try {
      await initQuagga();
    } catch {
      return;
    }

    lastCode = null;
    isRunning = true;
    codeLabelEl.textContent = "Scanner en cours… vise un code-barres net.";
    codeValueEl.textContent = "";
    setStatus("Caméra en cours d’activation…", "ok");
    setScanningUI(true);

    try {
      Quagga.start();
      setStatus("Scanner en cours… vise un code-barres net.", "ok");
    } catch (e) {
      console.error("Quagga start error:", e);
      isRunning = false;
      setScanningUI(false);
      setStatus(
        "Impossible de démarrer la caméra. Ferme puis rouvre la page (ou vérifie l’autorisation caméra).",
        "err"
      );
    }
  }

  function stopScan() {
    if (!isRunning) return;
    try {
      Quagga.stop();
    } catch (e) {
      console.warn("Erreur Quagga.stop()", e);
    }
    isRunning = false;
    setScanningUI(false);
    setStatus("Scan arrêté. Clique sur « Démarrer » pour relancer.", "");
  }

  async function onDetected(result) {
    const code = result?.codeResult?.code;
    if (!code || code === lastCode) return;
    lastCode = code;

    if (navigator.vibrate) navigator.vibrate(60);

    codeLabelEl.textContent = "Code détecté :";
    codeValueEl.textContent = code;
    setStatus("Code détecté, récupération des infos produit…", "ok");

    try {
      const url  = "https://api.philomeneia.com/barcode?code=" + encodeURIComponent(code);
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

        // Mise en forme "premium"
        codeLabelEl.innerHTML = `
          <span class="product-line-main">${name}${brand}${qte}${ns}${nova}</span>
        `;
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

  // message initial
  setStatus("Initialisation du scanner…", "");
})();
