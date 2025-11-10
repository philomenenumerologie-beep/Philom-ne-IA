// barcode-test.js
// Test scanner + réponse produit façon Philomène.

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
    // zone texte principale dans le bloc du bas
    codeValueBox.firstElementChild.innerHTML = html;
  }

  function resetMessage() {
    setMessage("Aucun produit scanné pour le moment.");
    codeValueEl.textContent = "";
  }

  // --- Vérif Quagga ---
  if (typeof Quagga === "undefined") {
    setStatus("❌ QuaggaJS introuvable (librairie non chargée).", "err");
    console.error("QuaggaJS non chargé !");
    return;
  }

  // Boutons
  startBtn.addEventListener("click", startScanner);
  stopBtn.addEventListener("click", stopScanner);

  setStatus("Prêt. Clique sur Démarrer et autorise la caméra.", "ok");
  resetMessage();

  // --- Start ---
  function startScanner() {
    if (scanning) return;
    scanning = true;
    lastCode = null;
    resetMessage();
    setStatus("📷 Demande l'accès à la caméra…", null);

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
        locator: { patchSize: "medium", halfSample: true },
        locate: true,
        numOfWorkers: 1
      },
      function (err) {
        if (err) {
          console.error("Erreur Quagga init:", err);
          scanning = false;
          setStatus("❌ Erreur d'accès caméra. Vérifie les permissions.", "err");
          return;
        }
        Quagga.start();
        setStatus("📷 Scanner en cours… vise un code-barres.", "ok");
      }
    );

    Quagga.offDetected(onDetected);
    Quagga.onDetected(onDetected);
  }

  // --- Stop ---
  function stopScanner() {
    if (!scanning) return;
    scanning = false;
    try {
      Quagga.stop();
    } catch (e) {
      console.warn("Erreur à l'arrêt du scanner:", e);
    }
    setStatus("Scan arrêté. Clique sur Démarrer pour relancer.", null);
  }

  // --- Quand un code est trouvé ---
  async function onDetected(result) {
    if (!result || !result.codeResult || !result.codeResult.code) return;
    const code = (result.codeResult.code || "").trim();
    if (!code || code === lastCode) return;
    lastCode = code;

    console.log("✅ Code détecté :", code);

    codeValueEl.textContent = code;
    setStatus("✅ Code détecté : " + code, "ok");
    setMessage("Je regarde ce que je trouve pour ce produit…");

    try {
      const resp = await fetch(`/barcode?code=${encodeURIComponent(code)}`);
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      const data = await resp.json();

      // Pas trouvé
      if (!data.found) {
        setMessage(
          `Code <strong>${code}</strong> détecté, ` +
            `mais je n’ai pas trouvé ce produit dans la base.`
        );
        return;
      }

      // Construit une "réponse Philomène"
      const name = data.name || "Produit inconnu";
      const brand = data.brand ? ` (${data.brand})` : "";
      const qty = data.quantity ? ` — ${data.quantity}` : "";
      const nutri =
        data.nutriscore
          ? `Nutri-Score : <strong>${String(
              data.nutriscore
            ).toUpperCase()}</strong>`
          : null;
      const nova = data.nova ? `NOVA : <strong>${data.nova}</strong>` : null;
      const eco = data.eco_score
        ? `Éco-score : <strong>${String(
            data.eco_score
          ).toUpperCase()}</strong>`
        : null;

      // Phrase principale
      let html =
        `✅ <strong>${name}</strong>${brand}${qty}<br>` +
        `<small>Code-barres : ${code}</small>`;

      const details = [nutri, nova, eco].filter(Boolean);
      if (details.length) {
        html += `<br>${details.join(" • ")}`;
      }

      // Style "Philomène"
      html += `<br><br><em>Analyse test par Philomène. Dans la vraie app, je pourrai te dire si c’est un bon choix pour ta santé, ton budget, etc.</em>`;

      setMessage(html);
    } catch (err) {
      console.error("Erreur /barcode :", err);
      setStatus(
        "⚠️ Code lu, mais erreur en récupérant les infos produit.",
        "err"
      );
      setMessage(
        `Code détecté : <strong>${code}</strong>, mais je n’ai pas réussi à joindre le serveur produit.`
      );
    }
  }

  // Petit check silencieux des permissions (debug)
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        console.log("✅ Caméra accessible (test rapide).");
        stream.getTracks().forEach((t) => t.stop());
      })
      .catch((err) => {
        console.warn("🚫 Caméra bloquée (test rapide):", err.name);
      });
  }
})();
