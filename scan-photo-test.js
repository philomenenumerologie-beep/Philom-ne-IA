let barcodeDetector = null;

if ('BarcodeDetector' in window) {
    barcodeDetector = new BarcodeDetector({
        formats: ['ean_8', 'ean_13', 'code_128', 'upc_a']
    });
} else {
    alert("❌ Ce téléphone ne supporte pas BarcodeDetector.");
}

const input = document.getElementById("photoInput");
const preview = document.getElementById("preview");
const resultBox = document.getElementById("resultBox");

input.addEventListener("change", async () => {
    const file = input.files[0];
    if (!file) return;

    const imgUrl = URL.createObjectURL(file);
    preview.src = imgUrl;
    preview.style.display = "block";

    resultBox.innerHTML = "🔎 Analyse de la photo…";

    await new Promise(r => setTimeout(r, 300)); // petit temps pour afficher l'image

    try {
        const codes = await barcodeDetector.detect(preview);

        if (codes.length === 0) {
            resultBox.innerHTML = "❌ Aucun code-barres détecté.";
            return;
        }

        const code = codes[0].rawValue;

        resultBox.innerHTML = `
            ✅ Code détecté : <span class="barcode">${code}</span><br>
            ⏳ Récupération des infos produit…
        `;

        // --- Récupération produit sur ton serveur ---
        try {
            const res = await fetch(`https://api.philomeneia.com/barcode?code=${code}`);
            const data = await res.json();

            resultBox.innerHTML += `<br><br>📦 Produit : <br>${JSON.stringify(data, null, 2)}`;
        }
        catch (e) {
            resultBox.innerHTML += "<br>⚠️ Impossible de récupérer les infos produit.";
        }

    } catch (err) {
        resultBox.innerHTML = "❌ Erreur lors du scan.";
        console.error(err);
    }
});
