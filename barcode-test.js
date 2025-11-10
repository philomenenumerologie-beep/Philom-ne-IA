// barcode-test.js
// Test scanner code-barres avec QuaggaJS + API /barcode de ton backend

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

  function setCode(msg) {
    codeValueBox.firstElementChild.textContent =
      msg || "Aucun produit scanné pour le moment.";
  }

  // Vérif chargement Quagga
  if (typeof Quagga === "undefined") {
    setStatus(
      "❌ QuaggaJS introuvable. Vérifie le <script> dans barcode-test.html.",
      "err"
    );
    return;
  }

  // Init des boutons
  startBtn.addEventListener("click", startScanner);
  stopBtn.addEventListener("click", stopScanner);

  setStatus("Prêt. Clique sur Démarrer et autorise la caméra.", "ok");
  setCode("");

  function startScanner() {
    if (scanning) return;
    scanning = true;
    lastCode = null;
    codeValueEl.textContent = "";
    setCode("Aucun produit scanné pour le moment.");
    setStatus("📷 Demande l'accès à la caméra…", null);

    Quagga.init(
      {
        inputStream: {
          type: "LiveStream",
          target: previewEl,
          constraints: {
            facingMode: "environment", // caméra arrière
            aspectRatio: { min: 1.3, max: 2.0 },
          },
        },
        locator: {
          halfSample: true,
          patchSize: "medium",
        },
        decoder: {
          readers: [
            "ean_reader",
            "ean_13_reader",
            "ean_8_reader",
            "upc_reader",
            "upc_e_reader",
          ],
        },
        locate: true,
        numOfWorkers: 2,
      },
      function (err) {
        if (err) {
          console.error(err);
          scanning = false;
          setStatus(
            "❌ Erreur accès caméra ou initialisation du scanner.",
            "err"
          );
          return;
        }

        Quagga.start();
        setStatus(
          "📷 Scanner en cours… Vise un code-barres bien net.",
          "ok"
        );
      }
    );

    Quagga.offDetected(onDetected);
    Quagga.onDetected(onDetected);
  }

  function stopScanner() {
    if (!scanning) return;
    scanning = false;
    try {
      Quagga.stop();
    } catch (e) {}
    setStatus("Scan arrêté. Clique sur Démarrer pour relancer.", null);
  }

  async function onDetected(result) {
    if (!result || !result.codeResult || !result.codeResult.code) return;

    const code = (result.codeResult.code || "").trim();
    if (!code || code === lastCode) return;
    lastCode = code;

    console.log("Code détecté:", code);
    codeValueEl.textContent = code;
    setStatus("✅ Code détecté : " + code, "ok");
    setCode("Recherche du produit…");

    try {
      // Appelle ton backend (même domaine que la page) : /barcode?code=xxx
      const resp = await fetch(`/barcode?code=${encodeURIComponent(code)}`);
      if (!resp.ok) throw new Error("Réponse HTTP " + resp.status);
      const data = await resp.json();

      if (!data.found) {
        setCode(`Code détecté : ${code} (produit non trouvé).`);
        return;
      }

      // Affichage simple
      const parts = [];
      if (data.name) parts.push(data.name);
      if (data.brand) parts.push(data.brand);
      if (data.quantity) parts.push(data.quantity);
      if (data.nutriscore)
        parts.push(`Nutri-Score : ${String(data.nutriscore).toUpperCase()}`);
      if (data.nova) parts.push(`NOVA : ${data.nova}`);
      if (data.eco_score)
        parts.push(`Éco-score : ${String(data.eco_score).toUpperCase()}`);

      setCode(
        `Code ${code} → ` +
          (parts.length ? parts.join(" • ") : "infos limitées.")
      );
    } catch (err) {
      console.error("Erreur /barcode :", err);
      setStatus(
        "⚠️ Code lu, mais erreur lors de la récupération des infos produit.",
        "err"
      );
      setCode(`Code détecté : ${code}`);
    }
  }
})();
