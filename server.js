// server.js
// Backend Philomène I.A.
// - /ask : conversation texte
// - /analyze-image : analyse d'image
// - mémoire de conversation par utilisateur
//
// Dépendances attendues dans ton package.json :
//   "express", "cors", "node-fetch", "multer"
// et Node lancé en mode module ("type": "module")

import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import multer from "multer";

const app = express();

// ===========================
// CONFIG GÉNÉRALE
// ===========================
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "TON_API_KEY_ICI";
const OPENAI_MODEL_TEXT = "gpt-4o-mini"; // pour texte pur
const OPENAI_MODEL_VISION = "gpt-4o-mini"; // vision multimodale

// Les origines autorisées (mets ton domaine prod ici)
app.use(
  cors({
    origin: [
      "https://philomeneia.com",
      "https://www.philomeneia.com",
      "http://localhost:3000",
      "http://localhost:5173"
    ],
    methods: ["POST", "GET", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// lire le JSON envoyé par le front
app.use(express.json({ limit: "10mb" }));

// pour recevoir des fichiers image en multipart/form-data
const upload = multer({ storage: multer.memoryStorage() });

// ===========================
// MÉMOIRE DE CONVERSATION
// ===========================
//
// conversations[userId] = [
//   { role:"system", content:"..." },
//   { role:"user", content:"..." },
//   { role:"assistant", content:"..." },
//   ...
// ]
//
const conversations = {};

function getConversationHistory(userId) {
  if (!conversations[userId]) {
    conversations[userId] = [
      {
        role: "system",
        content:
          "Tu es Philomène I.A., une assistante personnelle française. " +
          "Tu es claire, utile, concrète. Tu peux être chaleureuse mais tu évites le blabla inutile."
      }
    ];
  }
  return conversations[userId];
}

function pushToConversation(userId, role, content) {
  const history = getConversationHistory(userId);
  history.push({ role, content });

  // petite limite mémoire pour pas exploser
  const MAX_TURNS = 30;
  if (history.length > MAX_TURNS) {
    const systemMsg = history[0];
    const last = history.slice(-MAX_TURNS + 1);
    conversations[userId] = [systemMsg, ...last];
  }
}

// ===========================
// FONCTION : appel OpenAI / chat texte
// ===========================
async function askOpenAI(messages) {
  // messages = tableau [{role, content}, ...]

  const body = {
    model: OPENAI_MODEL_TEXT,
    messages,
    temperature: 0.7
  };

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    console.error("OpenAI error status:", resp.status);
    const txt = await resp.text();
    console.error("OpenAI error body:", txt);
    throw new Error("Erreur API OpenAI (texte)");
  }

  const data = await resp.json();
  const answer =
    data.choices?.[0]?.message?.content?.trim() ||
    "Je suis désolée, je n'ai pas pu générer de réponse.";

  return answer;
}

// ===========================
// FONCTION : appel OpenAI / vision
// ===========================
//
// ICI : on envoie un message 'user' avec un contenu mixte texte + image.
// On encode l'image reçue sous forme data URL (base64).
async function askOpenAIVision({ question, dataUrl }) {
  const visionMessages = [
    {
      role: "system",
      content:
        "Tu es Philomène I.A., une assistante personnelle française. " +
        "Tu regardes l'image fournie par l'utilisateur. " +
        "Tu expliques clairement ce qu'il y a dessus, de façon concrète. " +
        "Si tu n'es pas sûre, tu le dis."
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text:
            question ||
            "Analyse l'image : dis-moi ce que tu vois et à quoi ça sert."
        },
        {
          type: "image_url",
          image_url: dataUrl // data URL base64
        }
      ]
    }
  ];

  const body = {
    model: OPENAI_MODEL_VISION,
    messages: visionMessages,
    temperature: 0.4
  };

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    console.error("OpenAI Vision error status:", resp.status);
    const txt = await resp.text();
    console.error("OpenAI Vision error body:", txt);
    throw new Error("Erreur API OpenAI (vision)");
  }

  const data = await resp.json();
  const answer =
    data.choices?.[0]?.message?.content?.trim() ||
    "J'ai reçu l'image, mais je n'ai pas pu l'analyser.";

  return answer;
}

// ===========================
// ROUTE TEXTE : /ask
// ===========================
//
// Le front envoie actuellement : {
//   conversation: [...],
//   userId: "guest" OU l'id Clerk,
//   tokens: <solde local> (optionnel)
// }
//
// On ne fait plus confiance à la 'conversation' du front pour la mémoire.
// On récupère juste le dernier message user, on le stocke, on demande OpenAI
// avec tout l'historique stocké côté serveur, et on renvoie.
app.post("/ask", async (req, res) => {
  try {
    const { conversation, userId, tokens } = req.body || {};
    const uid = userId || "guest";

    // Récupérer le dernier message utilisateur dans ce qui vient du front
    let lastUserMessage = null;
    if (Array.isArray(conversation)) {
      for (let i = conversation.length - 1; i >= 0; i--) {
        if (conversation[i].role === "user") {
          lastUserMessage = conversation[i].content;
          break;
        }
      }
    }

    if (!lastUserMessage || !lastUserMessage.trim()) {
      return res.status(400).json({
        error: "Pas de message utilisateur fourni."
      });
    }

    // stocker ce message utilisateur dans l'historique interne
    pushToConversation(uid, "user", lastUserMessage);

    // récupérer l'historique complet de ce user
    const fullHistory = getConversationHistory(uid);

    // demander la réponse à OpenAI avec cet historique
    const answer = await askOpenAI(fullHistory);

    // stocker la réponse dans la mémoire
    pushToConversation(uid, "assistant", answer);

    // renvoyer
    res.json({
      answer,
      tokensLeft: tokens // tu peux exploiter ça côté front si tu veux
    });
  } catch (err) {
    console.error("Erreur /ask:", err);
    res.status(500).json({
      error: "Erreur interne /ask."
    });
  }
});

// ===========================
// ROUTE IMAGE : /analyze-image
// ===========================
//
// On reçoit un formulaire multipart/form-data
//  - field "image" (le fichier)
//  - field "userId"
//  - field "prompt" (facultatif : "Peux-tu me donner des renseignements sur cette machine ?")
//
// On encode l'image en base64 -> data URL
// On appelle askOpenAIVision()
// On mémorise la question + la réponse dans l'historique du user
//
app.post("/analyze-image", upload.single("image"), async (req, res) => {
  try {
    const uid = req.body.userId || "guest";
    const userPrompt =
      req.body.prompt ||
      "Décris-moi précisément l'image et dis-moi à quoi elle sert.";

    if (!req.file) {
      return res.status(400).json({ error: "Aucune image reçue." });
    }

    // fabriquer une data URL base64
    const mimeType = req.file.mimetype || "image/jpeg";
    const base64 = req.file.buffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // On pousse dans la mémoire du user le fait qu'il a demandé l'analyse d'image
    pushToConversation(uid, "user", userPrompt + " [image envoyée]");

    // On demande au modèle vision
    const visionAnswer = await askOpenAIVision({
      question: userPrompt,
      dataUrl
    });

    // On stocke la réponse de Philomène dans la mémoire
    pushToConversation(uid, "assistant", visionAnswer);

    // on renvoie
    res.json({
      answer: visionAnswer
    });
  } catch (err) {
    console.error("Erreur /analyze-image:", err);
    res.status(500).json({
      error: "Erreur interne /analyze-image."
    });
  }
});

// ===========================
// TEST / HEALTHCHECK
// ===========================
app.get("/", (req, res) => {
  res.json({ ok: true, service: "Philomène backend en ligne" });
});

// ===========================
// LANCEMENT SERVEUR
// ===========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Philomène backend démarré sur le port " + PORT);
});
