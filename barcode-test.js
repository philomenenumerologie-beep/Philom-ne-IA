// barcode-test.js
(function () {
  const preview      = document.getElementById("preview");
  const statusEl     = document.getElementById("status");
  const codeBox      = document.getElementById("codeValueBox");
  const codeLabelEl  = codeBox.querySelector("span");
  const codeValueEl  = document.getElementById("codeValue");
  const startBtn     = document.getElementById("startBtn");
  const stopBtn      = document.getElementById("stopBtn");

  let isInit = false;
  let isRunning = false;
  let lastCode = null;
  let detectCount = {}; // compteur par code

  function setStatus(msg, type) {
    statusEl.textContent = msg || "";
    statusEl.classList.remove("ok", "err");
    if (type === "ok") statusEl.classList.add("ok");
    if (type === "err") statusEl.classList.add("err");
  }

  function initQuagga() {
    return new Promise((resolve, reject) => {
      if (isInit) return resolve();

      if (!window.Quagga) {
        setStatus("❌ QuaggaJS introuvable.", "err");
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
              width: 1280,
              height: 720
            }
          },

          locator: {
            patchSize: "large", // 🔥 beaucoup plus fiable
            halfSample: false
          },

          decoder: {
            readers: [
              "ean_reader",       // EAN-13
              "ean_8_reader",
              "upc_reader",
              "upc_e_reader",
              "code_128_reader"
            ]
          },

          frequency: 10, // 🔥 augmente la précision
          locate: true,
          numOfWorkers: 4
        },

        (err) => {
          if (err) {
            console.error(err);
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
    detectCount = {};
    isRunning = true;

    codeLabelEl.textContent = "Aucun produit scanné.";
    codeValueEl.textContent = "";
    setStatus("📷 Scanner en cours…", "ok");

    try {
      Quagga.start();
    } catch (e) {
      console.error(e);
      setStatus("❌ Impossible de démarrer la caméra.", "err");
      isRunning = false;
    }
  }

  function stopScan() {
    if (!isRunning) return;
    try { Quagga.stop(); } catch {}
    isRunning = false;
    setStatus("⏹️ Scan arrêté.", "");
  }

  async function onDetected(result) {
    const code = result?.codeResult?.code;
    if (!code) return;

    // 🔥 Nouvelle logique : code accepté seulement après 3 détections identiques
    detectCount[code] = (detectCount[code] || 0) + 1;

    if (detectCount[code] < 3) return; // attend confirmation
    if (code === lastCode) return; 
    lastCode = code;

    if (navigator.vibrate) navigator.vibrate(80);

    codeLabelEl.textContent = "Code détecté :";
    codeValueEl.textContent = code;
    setStatus("✅ Code détecté : " + code, "ok");

    try {
      const resp = await fetch(
        "https://api.philomeneia.com/barcode?code=" + encodeURIComponent(code)
      );

      if (!resp.ok) {
        codeLabelEl.textContent = "🟡 Code lu, mais erreur serveur.";
        return;
      }

      const data = await resp.json();

      if (data && data.found) {
        codeLabelEl.textContent =
          `${data.name || "Produit"} • ${data.brand || ""} • ${data.quantity || ""} • NutriScore: ${data.nutriscore?.toUpperCase() || "?"}`;
      } else {
        codeLabelEl.textContent = "Aucun produit trouvé (base OFF).";
      }
    } catch (e) {
      console.error(e);
      codeLabelEl.textContent = "Erreur API.";
    }
  }

  startBtn.addEventListener("click", startScan);
  stopBtn.addEventListener("click", stopScan);

  setStatus("⏱️ Initialisation du scanner…", "");
})();
