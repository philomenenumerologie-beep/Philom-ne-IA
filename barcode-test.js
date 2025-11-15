let stream = null;
let barcodeDetector = null;
let scanning = false;

async function startCamera() {
    try {
        stopCamera(); // sécurité pour éviter doublon

        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "environment"
            }
        });

        const video = document.getElementById("video");
        video.srcObject = stream;
        await video.play();

        scanning = true;
        detectLoop();

    } catch (error) {
        console.error("Camera Error:", error);
        showError("Impossible de démarrer la caméra. Ferme puis rouvre la page.");
    }
}

function stopCamera() {
    scanning = false;

    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }

    const video = document.getElementById("video");
    video.srcObject = null;
}

async function detectLoop() {
    const video = document.getElementById("video");

    barcodeDetector = new BarcodeDetector({
        formats: ["ean_13", "ean_8", "code_128"]
    });

    while (scanning) {
        try {
            const codes = await barcodeDetector.detect(video);
            if (codes.length > 0) {
                handleDetected(codes[0].rawValue);
                stopCamera(); // ← essentiel pour iPhone
                break;
            }
        } catch (err) {
            console.error("Detect error:", err);
        }

        await new Promise(r => setTimeout(r, 100));
    }
}

function handleDetected(code) {
    document.getElementById("result").innerText = code;
}

function showError(msg) {
    document.getElementById("error").innerText = msg;
}
