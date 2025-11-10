(function () {
  const previewEl = document.getElementById("preview");
  const statusEl = document.getElementById("status");
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");
  const codeValueBox = document.getElementById("codeValueBox");
  const codeValueEl = document.getElementById("codeValue");

  let scanning = false;
  let lastCode = null;

  function setStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = "";
    if (type === "ok") statusEl.classList.add("ok");
    if (type === "err") statusEl.classList.add("err");
  }

  function setMessage(html) {
    codeValueBox.firstElementChild.innerHTML = html;
  }

  function resetMessage() {
    setMessage("Aucun produit scanné pour le moment.");
    codeValueEl.textContent = "";
  }

  startBtn.addEventListener("click", requestCameraThenStart);
  stopBtn.addEventListener("click", stopScanner);

  setStatus("Prêt. Clique sur Démarrer et autorise la caméra.", "ok");
  resetMessage();

  async function requestCameraThenStart() {
    try {
      setStatus("📷 Vérification de l'accès caméra…", null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      stream.getTracks().forEach((t) => t.stop());
      console.log("✅ Caméra autorisée par l'utilisateur.");
      setStatus("Caméra autorisée. Initialisation du scanner…", "ok");
      startScanner();
    } catch (err) {
      console.error("🚫 Caméra refusée :", err);
      setStatus("⚠️ Accès caméra refusé. Vérifie dans les réglages Safari.", "err");
    }
  }

  function startScanner() {
    if (scanning) return;
    scanning = true;
    lastCode = null;
    resetMessage();
    setStatus("📷 Initialisation du scanner…", null);

    Quagga.init(
      {
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: previewEl,
          constraints: {
            facingMode: "environment",
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        },
        decoder: {
          readers: [
            "ean_reader",
            "ean_13_reader",
            "ean_8_reader",
            "upc_reader",
            "upc_e_reader"
          ]
        },
        locate: true,
        numOfWorkers: 1
      },
      (err) => {
        if (err) {
          console.error("Erreur Quagga init:", err);
          setStatus("❌ Erreur d'accès à la caméra.", "err");
          scanning = false;
          return;
        }
        Quagga.start();
        setStatus("📷 Scanner en cours… vise un code-barres net.", "ok");
        Quagga.offDetected(onDetected);
        Quagga.onDetected(onDetected);
      }
    );
  }

  function stopScanner() {
    if (!scanning) return;
    scanning = false;
    try {
      Quagga.stop();
    } catch {}
    setStatus("Scan arrêté. Clique sur Démarrer pour relancer.", null);
  }

  async function onDetected(result) {
    const code = result?.codeResult?.code?.trim();
    if (!code || code === lastCode) return;
    lastCode = code;

    console.log("✅ Code détecté :", code);
    codeValueEl.textContent = code;
    setStatus("✅ Code détecté : " + code, "ok");
    setMessage("Je regarde ce que je trouve pour ce produit…");

    try {
      const resp = await fetch(`/barcode?code=${encodeURIComponent(code)}`);
      const data = await resp.json();

      if (!data.found) {
        setMessage(`Code <strong>${code}</strong> détecté, produit non trouvé.`);
        return;
      }

      const infos = [
        data.name,
        data.brand,
        data.quantity,
        data.nutriscore ? `Nutri-Score ${data.nutriscore.toUpperCase()}` : null,
        data.nova ? `NOVA ${data.nova}` : null
      ].filter(Boolean);

      setMessage(
        `✅ <strong>${infos.join(" • ")}</strong><br><small>Code ${code}</small><br><br><em>Analyse test par Philomène.</em>`
      );
    } catch (err) {
      console.error("Erreur produit :", err);
      setStatus("⚠️ Erreur en récupérant le produit.", "err");
    }
  }
})();
