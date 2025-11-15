// barcode-test.js
(function () {
  // --- Références DOM ---
  const preview      = document.getElementById("preview");
  const statusEl     = document.getElementById("status");
  const codeBox      = document.getElementById("codeValueBox");
  const codeLabelEl  = codeBox.querySelector("span");
  const codeValueEl  = document.getElementById("codeValue");
  const startBtn     = document.getElementById("startBtn");
  const stopBtn      = document.getElementById("stopBtn");

  // --- État caméra / scan ---
  let stream          = null;
  let barcodeDetector = null;
  let scanning        = false;
  let lastCode        = null;
  let videoEl         = null;

  // --- Helpers d'affichage ---
  function setStatus(msg, type) {
    statusEl.textContent = msg || "";
    statusEl.classList.remove("ok", "err");
    if (type === "ok")  statusEl.classList.add("ok");
    if (type === "err") statusEl.classList.add("err");
  }

  function ensureVideoElement() {
    if (!videoEl) {
      videoEl = document.createElement("video");
      videoEl.setAttribute("playsinline", "true");
      videoEl.autoplay = true;
      videoEl.muted = true;
      videoEl.style.width = "100%";
      videoEl.style.height = "100%";
      videoEl.style.objectFit = "cover";

      // On vide le container et on met la vidéo dedans
      preview.innerHTML = "";
      preview.appendChild(videoEl);
    }
    return videoEl;
  }

  // --- Caméra ON ---
  async function startScan() {
    if (scanning) return;

    // Vérifie si l'API est dispo (iPhone récent / Android)
    if (!("BarcodeDetector" in window)) {
      setStatus(
        "❌ Ce téléphone ne supporte pas encore le scanner moderne (pas de BarcodeDetector).",
        "err"
      );
      return;
    }

    try {
      stopCamera(); // sécurité

      const video = ensureVideoElement();

      // Demande la caméra arrière
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });

      video.srcObject = stream;
      await video.play();

      // Prépare le détecteur
      barcodeDetector = new BarcodeDetector({
        formats: ["ean_13", "ean_8", "upc_a", "code_128"]
      });

      lastCode = null;
      scanning = true;
      codeLabelEl.textContent = "Aucun produit scanné pour le moment.";
      codeValueEl.textContent = "";
      setStatus("📷 Scanner en cours… vise un code-barres net.", "ok");

      detectLoop();
    } catch (err) {
      console.error("Erreur getUserMedia:", err);
      setStatus(
        "❌ Impossible de démarrer la caméra. Ferme puis rouvre la page.",
        "err"
      );
      stopCamera();
    }
  }

  // --- Caméra OFF ---
  function stopCamera() {
    scanning = false;

    if (stream) {
      try {
        stream.getTracks().forEach((t) => t.stop());
      } catch {}
      stream = null;
    }

    if (videoEl) {
      videoEl.srcObject = null;
    }
  }

  function stopScan() {
    stopCamera();
    setStatus("⏹️ Scan arrêté. Clique sur Démarrer pour relancer.", "");
  }

  // --- Boucle de détection ---
  async function detectLoop() {
    const video = videoEl;
    if (!video || !barcodeDetector) return;

    while (scanning) {
      try {
        const barcodes = await barcodeDetector.detect(video);

        if (barcodes && barcodes.length > 0) {
          const raw = barcodes[0].rawValue || "";
          if (raw && raw !== lastCode) {
            lastCode = raw;
            onDetected(raw);
          }
        }
      } catch (err) {
        console.error("Erreur detect:", err);
      }

      // Petite pause pour ne pas surcharger
      await new Promise((r) => setTimeout(r, 120));
    }
  }

  // --- Quand un code est détecté ---
  async function onDetected(code) {
    if (navigator.vibrate) navigator.vibrate(60);

    codeLabelEl.textContent = "Code détecté :";
    codeValueEl.textContent = code;
    setStatus("✅ Code détecté : " + code, "ok");

    try {
      const url =
        "https://api.philomeneia.com/barcode?code=" + encodeURIComponent(code);
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
      console.error("Erreur appel API /barcode:", e);
      codeLabelEl.textContent =
        "Code lu mais problème de connexion à l’API.";
    }
  }

  // --- Événements boutons ---
  startBtn.addEventListener("click", startScan);
  stopBtn.addEventListener("click", stopScan);

  // Message de départ
  setStatus("⏱️ Initialisation du scanner…", "");
})();
