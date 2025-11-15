// scanner-iphone.js
(function () {
  const video        = document.getElementById("video");
  const statusEl     = document.getElementById("status");
  const codeBox      = document.getElementById("codeValueBox");
  const codeLabelEl  = codeBox.querySelector("span");
  const codeValueEl  = document.getElementById("codeValue");
  const startBtn     = document.getElementById("startBtn");
  const stopBtn      = document.getElementById("stopBtn");

  let detector      = null;
  let stream        = null;
  let isRunning     = false;
  let lastCode      = null;
  let lastDetectTs  = 0;
  let rafId         = null;

  // -----------------------------
  // Helpers UI
  // -----------------------------
  function setStatus(msg, type) {
    statusEl.textContent = msg || "";
    statusEl.classList.remove("ok", "err");
    if (type === "ok")  statusEl.classList.add("ok");
    if (type === "err") statusEl.classList.add("err");
  }

  // -----------------------------
  // Initialisation BarcodeDetector
  // -----------------------------
  async function initDetector() {
    if (detector) return;

    if (!("BarcodeDetector" in window)) {
      setStatus("❌ Ce téléphone ne supporte pas encore le scanner moderne. (Pas de BarcodeDetector)", "err");
      throw new Error("BarcodeDetector non supporté");
    }

    const supported = await BarcodeDetector.getSupportedFormats();
    const wanted = [
      "ean_13", "ean_8",
      "upc_a", "upc_e",
      "code_128"
    ];
    const formats = wanted.filter(f => supported.includes(f));

    if (!formats.length) {
      setStatus("❌ Aucun format de code-barres supporté sur ce navigateur.", "err");
      throw new Error("Formats non supportés");
    }

    detector = new BarcodeDetector({ formats });
    setStatus("✅ Scanner prêt. Clique sur Démarrer.", "ok");
  }

  // -----------------------------
  // Démarrer la caméra + boucle de scan
  // -----------------------------
  async function startScan() {
    if (isRunning) return;

    try {
      await initDetector();
    } catch (e) {
      console.error(e);
      return;
    }

    lastCode = null;
    codeLabelEl.textContent = "Aucun produit scanné pour le moment.";
    codeValueEl.textContent = "";

    try {
      // Demande la caméra arrière
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
    } catch (err) {
      console.error("Erreur getUserMedia:", err);
      setStatus("❌ Impossible d'accéder à la caméra.", "err");
      return;
    }

    video.srcObject = stream;
    await video.play().catch(() => {});

    isRunning = true;
    setStatus("📷 Scanner en cours… vise un code-barres net.", "ok");

    scanLoop();
  }

  // Boucle de scan
  async function scanLoop() {
    if (!isRunning || !detector) return;

    try {
      const now = performance.now();

      // Petit cooldown pour éviter trop de scans
      if (now - lastDetectTs > 80) {
        lastDetectTs = now;

        const barcodes = await detector.detect(video);
        if (barcodes && barcodes.length) {
          const rawValue = barcodes[0].rawValue || "";
          handleDetectedCode(rawValue);
        }
      }
    } catch (err) {
      console.warn("Erreur detection:", err);
    }

    rafId = requestAnimationFrame(scanLoop);
  }

  // -----------------------------
  // Arrêter le scan
  // -----------------------------
  function stopScan() {
    if (!isRunning) return;

    isRunning = false;

    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }

    video.srcObject = null;
    setStatus("⏹️ Scan arrêté. Clique sur Démarrer pour relancer.", "");
  }

  // -----------------------------
  // Quand un code est détecté
  // -----------------------------
  async function handleDetectedCode(code) {
    if (!code) return;

    // Si c'est le même que le dernier, on ignore
    if (code === lastCode) return;
    lastCode = code;

    if (navigator.vibrate) navigator.vibrate(80);

    codeLabelEl.textContent = "Code détecté :";
    codeValueEl.textContent = code;
    setStatus("✅ Code détecté : " + code, "ok");

    // 🔗 Appel à ton API pour récupérer NutriScore & co
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

  // -----------------------------
  // Boutons
  // -----------------------------
  startBtn.addEventListener("click", startScan);
  stopBtn.addEventListener("click", stopScan);

  // Message de départ
  setStatus("⏱️ Initialisation du scanner…", "");
})();
