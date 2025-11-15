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
  let pendingCode = null;
  let confirmCount = 0;

  function setStatus(msg, type) {
    statusEl.textContent = msg || "";
    statusEl.classList.remove("ok", "err");
    if (type === "ok")  statusEl.classList.add("ok");
    if (type === "err") statusEl.classList.add("err");
  }

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
              width: { ideal: 1280 },
              height: { ideal: 720 },
              aspectRatio: { ideal: 1.777 },
              focusMode: "continuous",
            }
          },

          locator: { 
            patchSize: "large", 
            halfSample: false 
          },

          decoder: {
            readers: [
              "ean_reader",
              "ean_8_reader",
              "upc_reader",
              "upc_e_reader",
              "code_128_reader",
            ]
          },

          locate: true,
          numOfWorkers: navigator.hardwareConcurrency || 4,
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

  async function startScan() {
    if (isRunning) return;
    try { await initQuagga(); } catch { return; }

    lastCode = null;
    pendingCode = null;
    confirmCount = 0;

    isRunning = true;
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

  function stopScan() {
    if (!isRunning) return;
    try { Quagga.stop(); } catch {}
    isRunning = false;
    setStatus("⏹️ Scan arrêté. Clique sur Démarrer pour relancer.", "");
  }

  async function onDetected(result) {
    const code = result?.codeResult?.code;
    if (!code) return;

    // Double validation = fiabilité ++
    if (pendingCode !== code) {
      pendingCode = code;
      confirmCount = 1;
      return;
    }

    confirmCount++;
    if (confirmCount < 2) return;

    // Validé
    if (code === lastCode) return;
    lastCode = code;

    if (navigator.vibrate) navigator.vibrate(80);

    codeLabelEl.textContent = "Code détecté :";
    codeValueEl.textContent = code;
    setStatus("✅ Code détecté : " + code, "ok");

    // Appel API
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

  setStatus("⏱️ Initialisation du scanner…", "");
})();
