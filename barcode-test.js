let quaggaRunning = false;

function setStatus(msg, ok = null) {
  const el = document.getElementById("status");
  el.textContent = msg;
  el.className = "";
  if (ok === true) el.classList.add("ok");
  if (ok === false) el.classList.add("err");
}

function resetVideoElement() {
  const preview = document.getElementById("preview");
  const newVideo = preview.cloneNode(true);
  preview.parentNode.replaceChild(newVideo, preview);
}

async function startScanner() {
  if (quaggaRunning) return;

  setStatus("Initialisation…");

  resetVideoElement(); // IMPORTANT POUR SAFARI

  Quagga.init({
    inputStream: {
      name: "Live",
      type: "LiveStream",
      target: document.querySelector("#preview"),
      constraints: {
        facingMode: "environment",
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    },
    locator: { patchSize: "medium", halfSample: true },
    numOfWorkers: navigator.hardwareConcurrency || 2,
    decoder: {
      readers: ["ean_reader"]  // EAN13
    }
  }, err => {
    if (err) {
      console.error(err);
      setStatus("Impossible de démarrer la caméra.", false);
      quaggaRunning = false;
      return;
    }

    Quagga.start();
    quaggaRunning = true;
    setStatus("📷 Scanner en cours…");
  });

  Quagga.onDetected(onCodeDetected);
}

async function stopScanner() {
  if (!quaggaRunning) return;
  quaggaRunning = false;

  Quagga.stop();

  // Libérer complètement la caméra (fix Safari)
  const tracks = (await navigator.mediaDevices.getUserMedia({ video: true })).getVideoTracks();
  tracks.forEach(t => t.stop());

  setStatus("🛑 Scan arrêté. Clique sur Démarrer pour relancer.");
}

function onCodeDetected(result) {
  if (!result || !result.codeResult) return;

  let code = result.codeResult.code;

  // Si Quagga renvoie 8 chiffres → tentative de correction EAN13
  if (code.length === 8) {
    console.log("Code EAN8 détecté → non supporté par OFF.");
    displayProductError(code);
    return;
  }

  fetchProductData(code);
}

async function fetchProductData(code) {
  setStatus(`Code détecté : ${code}`, true);

  try {
    const res = await fetch(`https://api.philomeneia.com/scan/${code}`);
    const data = await res.json();

    const box = document.getElementById("codeValueBox");

    if (!data.found) {
      box.innerHTML = `<p>Code lu, mais introuvable dans la base.</p><div id="codeValue">${code}</div>`;
      return;
    }

    box.innerHTML = `
      <p>${data.name} • ${data.brand} • ${data.quantity} • NutriScore : ${data.nutriscore} • Nova : ${data.nova}</p>
      <div id="codeValue">${code}</div>
    `;
  } catch (e) {
    console.error("Erreur serveur", e);
    displayProductError(code);
  }
}

function displayProductError(code) {
  document.getElementById("codeValueBox").innerHTML = `
    <p>Code lu. Impossible de récupérer les infos produit (erreur serveur).</p>
    <div id="codeValue">${code}</div>
  `;
}

// Boutons
document.getElementById("startBtn").addEventListener("click", startScanner);
document.getElementById("stopBtn").addEventListener("click", stopScanner);
