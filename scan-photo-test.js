// barcode-test.js
// Scanner code-barres pour Philomène (version stable)
// - Utilise l’API BarcodeDetector quand dispo
// - Ferme proprement la caméra quand on quitte la page
// - Évite les faux messages "téléphone non supporté"

(function () {
  const previewContainer = document.getElementById("preview");
  const statusEl = document.getElementById("status");
  const codeBox = document.getElementById("codeValueBox");
  const codeLabelEl = codeBox ? codeBox.querySelector("span") : null;
  const codeValueEl = document.getElementById("codeValue");
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");

  // État interne
  let videoEl = null;
  let stream = null;
  let barcodeDetector = null;
  let scanning = false;
  let frameId = null;
  let lastCode = null;

  // --------------------------------------------------
  // Helpers UI
  // --------------------------------------------------
  function setStatus(msg, type) {
    if (!statusEl) return;
    statusEl.textContent = msg || "";
    statusEl.classList.remove("ok", "err", "info");
    if (type === "ok") statusEl.classList.add("ok");
    else if (type === "err") statusEl.classList.add("err");
    else statusEl.classList.add("info");
  }

  function setCodeText(label, code) {
    if (codeLabelEl) codeLabelEl.textContent = label || "";
    if (codeValueEl) codeValueEl.textContent = code || "";
  }

  // Crée / récupère l'élément <video> qui affichera la caméra
  function ensureVideoElement() {
    if (videoEl && videoEl.tagName === "VIDEO") return videoEl;

    // Si #preview EST déjà une vidéo
    if (previewContainer && previewContainer.tagName === "VIDEO") {
      videoEl = previewContainer;
      return videoEl;
    }

    // Sinon on crée un <video> dedans
    if (previewContainer) {
      const v = document.createElement("video");
      v.setAttribute("playsinline", "");
      v.setAttribute("autoplay", "");
      v.setAttribute("muted", "");
      v.style.width = "100%";
      v.style.height = "100%";
      v.style.objectFit = "cover";

      previewContainer.innerHTML = "";
      previewContainer.appendChild(v);
      videoEl = v;
      return videoEl;
    }

    return null;
  }

  // --------------------------------------------------
  // Caméra
  // --------------------------------------------------
  async function startCamera() {
    // Ferme tout flux éventuel encore ouvert (sécurité)
    stopCamera();

    const vid = ensureVideoElement();
    if (!vid) {
      setStatus("❌ Impossible d'initialiser l’affichage vidéo.", "err");
      throw new Error("No video element");
    }

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      vid.srcObject = stream;
      await vid.play();
    } catch (err) {
      console.error("Erreur getUserMedia:", err);
      setStatus(
        "❌ Impossible de démarrer la caméra. Ferme puis rouvre la page.",
        "err"
      );
      throw err;
    }
  }

  function stopCamera() {
    if (frameId) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }

    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
    if (videoEl) {
      videoEl.srcObject = null;
    }
    scanning = false;
  }

  // --------------------------------------------------
  // Détection code-barres
  // --------------------------------------------------
  async function detectLoop() {
    if (!scanning || !barcodeDetector || !videoEl || videoEl.readyState < 2) {
      // Pas encore prêt / arrêté
      frameId = requestAnimationFrame(detectLoop);
      return;
    }

    try {
      const barcodes = await barcodeDetector.detect(videoEl);
      if (barcodes && barcodes.length > 0) {
        const raw = barcodes[0].rawValue || "";
        handleDetectedCode(raw.trim());
      }
    } catch (err) {
      console.error("Erreur detection:", err);
      // On ne casse pas tout pour une erreur ponctuelle
    }

    frameId = requestAnimationFrame(detectLoop);
  }

  async function handleDetectedCode(code) {
    if (!code || code === lastCode) return;
    lastCode = code;

    if (navigator.vibrate) navigator.vibrate(80);

    setCodeText("Code détecté :", code);
    setStatus("✅ Code détecté : " + code, "ok");

    try {
      const url =
        "https://api.philomeneia.com/barcode?code=" +
        encodeURIComponent(code);
      const resp = await fetch(url);

      if (!resp.ok) {
        console.error("Erreur HTTP /barcode:", resp.status);
        setCodeText(
          "Code lu. Impossible de récupérer les infos produit (erreur serveur).",
          code
        );
        return;
      }

      const data = await resp.json();
      if (data && data.found) {
        const name = data.name || "Produit";
        const brand = data.brand ? ` • ${data.brand}` : "";
        const qte = data.quantity ? ` • ${data.quantity}` : "";
        const ns = data.nutriscore
          ? ` • NutriScore : ${String(data.nutriscore).toUpperCase()}`
          : " • NutriScore : UNKNOWN";
        const nova = data.nova ? ` • Nova : ${data.nova}` : "";

        setCodeText(`${name}${brand}${qte}${ns}${nova}`, code);
      } else {
        setCodeText(
          "Code lu mais produit non trouvé dans la base. (Lecture OK ✅)",
          code
        );
      }
    } catch (err) {
      console.error("Erreur appel API /barcode:", err);
      setCodeText(
        "Code lu mais problème de connexion à l’API.",
        code
      );
    }
  }

  // --------------------------------------------------
  // Start / Stop
  // --------------------------------------------------
  async function startScan() {
    if (scanning) return;

    // Vérif support
    if (!("BarcodeDetector" in window)) {
      setStatus(
        "❌ Ce téléphone ne supporte pas encore le scanner moderne (pas de BarcodeDetector).",
        "err"
      );
      return;
    }

    try {
      // Instancie le détecteur une seule fois
      if (!barcodeDetector) {
        barcodeDetector = new BarcodeDetector({
          formats: [
            "ean_13",
            "ean_8",
            "upc_a",
            "upc_e",
            "code_128"
          ]
        });
      }

      setStatus("⏱️ Initialisation du scanner…", "info");
      lastCode = null;
      setCodeText("Aucun produit scanné pour le moment.", "");

      await startCamera();

      scanning = true;
      setStatus("📷 Scanner en cours… vise un code-barres net.", "ok");
      detectLoop();
    } catch (err) {
      // L’erreur a déjà été affichée dans startCamera
      console.error("startScan error:", err);
    }
  }

  function stopScan() {
    if (!scanning && !stream) {
      setStatus("⏹️ Scan arrêté. Clique sur Démarrer pour relancer.", "info");
      return;
    }
    stopCamera();
    setStatus("⏹️ Scan arrêté. Clique sur Démarrer pour relancer.", "info");
  }

  // --------------------------------------------------
  // Événements
  // --------------------------------------------------
  if (startBtn) startBtn.addEventListener("click", startScan);
  if (stopBtn) stopBtn.addEventListener("click", stopScan);

  // Quand on quitte / met l’onglet en arrière-plan → on coupe la caméra
  window.addEventListener("pagehide", stopCamera);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopCamera();
      setStatus(
        "⏹️ Scan mis en pause (onglet en arrière-plan). Clique sur Démarrer pour relancer.",
        "info"
      );
    }
  });

  // Message initial
  setStatus("ℹ️ Initialisation du scanner…", "info");
  setCodeText("Aucun produit scanné pour le moment.", "");
})();
