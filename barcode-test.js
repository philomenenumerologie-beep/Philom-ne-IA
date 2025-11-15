// barcode-test.js
// Version avec filtre EAN-13 + plusieurs lectures consécutives

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

  // Pour filtrer les faux positifs :
  let pendingCode  = null;
  let pendingCount = 0;
  const REQUIRED_SAME_READS = 3; // nb de lectures identiques avant validation

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
              width: { min: 640 },
              height: { min: 480 }
            }
          },
          locator: { patchSize: "medium", halfSample: true },
          decoder: {
            // 🔒 On se concentre sur les codes EAN-13 de supermarché
            readers: ["ean_reader"]
          },
          locate: true,
          numOfWorkers: navigator.hardwareConcurrency || 2
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
    pendingCount = 0;

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

    // 1️⃣ On ne garde que les codes composés uniquement de chiffres
    if (!/^\d+$/.test(code)) return;

    // 2️⃣ On ignore les codes trop courts (souvent des faux positifs)
    if (code.length < 12 || code.length > 14) return;

    // 3️⃣ On attend plusieurs lectures identiques avant de valider
    if (code !== pendingCode) {
      pendingCode  = code;
      pendingCount = 1;
      return; // on attend encore
    } else {
      pendingCount++;
      if (pendingCount < REQUIRED_SAME_READS) {
        return; // pas encore assez de confirmations
      }
      // assez de confirmations : on “valide” le code
      pendingCount = 0;
    }

    // Normalisation simple : on garde tel quel (OpenFoodFacts accepte)
    const finalCode = code;

    if (finalCode === lastCode) return;
    lastCode = finalCode;

    if (navigator.vibrate) navigator.vibrate(80);

    codeLabelEl.textContent = "Code détecté :";
    codeValueEl.textContent = finalCode;
    setStatus("✅ Code détecté : " + finalCode, "ok");

    try {
      const url = "https://api.philomeneia.com/barcode?code=" + encodeURIComponent(finalCode);
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
