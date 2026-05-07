// server.js
// Backend Philomène I.A. + Coach IA
// - /ask            : Philomène (conversation générale)
// - /coach          : Coach IA (assistant football par club)
// - /analyze-image  : analyse d’image
// - /config         : infos publiques paiement
// - /               : healthcheck

import express from “express”;
import cors from “cors”;
import fetch from “node-fetch”;
import multer from “multer”;

const app = express();

// ===========================
// CONFIG
// ===========================
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || “”;
const OPENAI_MODEL_TEXT = “gpt-4o-mini”;
const OPENAI_MODEL_VISION = “gpt-4o-mini”;

const {
FREE_ANON = “2000”,
FREE_AFTER_SIGNUP = “3000”,
PAYMENT_ENABLED,
PAYMENTS_ENABLED,
PAYPAL_CLIENT_ID = “”,
PAYPAL_MODE = “sandbox”,
} = process.env;

const envTrue = (v) => String(v ?? “”).trim().toLowerCase() === “true”;

app.use(cors({
origin: “*”,
methods: [“POST”, “GET”, “OPTIONS”],
allowedHeaders: [“Content-Type”, “Authorization”]
}));

app.use(express.json({ limit: “10mb” }));

const upload = multer({ storage: multer.memoryStorage() });

// ===========================
// CLUBS — Clés d’accès
// ===========================
// Pour ajouter un club  : ajoute une ligne ici
// Pour couper un club   : mets active: false
// maxUsers              : nombre max d’appareils
// ===========================
const CLUBS = {
“DEMO-CLUB-0000”: { nom: “Club Démo”, maxUsers: 3, active: true },
// “FC-TOURCOING-X7K2”: { nom: “FC Tourcoing”, maxUsers: 10, active: true },
// “AS-MOUSCRON-A3B9”:  { nom: “AS Mouscron”,  maxUsers: 15, active: true },
};

const clubDevices = {};

function checkClubAccess(clubKey, deviceId) {
const club = CLUBS[clubKey];
if (!club) return { ok: false, reason: “Clé club invalide.” };
if (!club.active) return { ok: false, reason: “Abonnement expiré. Contactez votre administrateur.” };
if (!clubDevices[clubKey]) clubDevices[clubKey] = new Set();
const devices = clubDevices[clubKey];
if (devices.has(deviceId)) return { ok: true, club };
if (devices.size >= club.maxUsers) {
return { ok: false, reason: `Limite de ${club.maxUsers} utilisateurs atteinte. Contactez votre administrateur.` };
}
devices.add(deviceId);
console.log(`✅ Nouvel appareil — ${club.nom} (${devices.size}/${club.maxUsers})`);
return { ok: true, club };
}

// ===========================
// MÉMOIRE DE CONVERSATION
// ===========================
const conversations = {};

function getConversationHistory(userId) {
if (!conversations[userId]) {
conversations[userId] = [{
role: “system”,
content:
“Tu es Philomène I.A., une assistante personnelle française. “ +
“Tu es claire, utile, concrète. Tu peux être chaleureuse mais tu évites le blabla inutile.”
}];
}
return conversations[userId];
}

function pushToConversation(userId, role, content) {
const history = getConversationHistory(userId);
history.push({ role, content });
const MAX_TURNS = 30;
if (history.length > MAX_TURNS) {
const sys = history[0];
conversations[userId] = [sys, …history.slice(-MAX_TURNS + 1)];
}
}

// ===========================
// PROMPTS COACH IA
// ===========================
function getCoachPrompt(categorie) {
return `Tu es Coach IA, un assistant personnel pour entraîneurs de football amateur français et belge.
Catégorie active : ${categorie || “toutes catégories”}.

RÈGLES PAR CATÉGORIE :

- U6/U7 → jeux simples, plaisir, pas de tactique, courtes durées
- U8/U9 → bases dribble, passe, petit terrain, exercices fun
- U10/U11 → début tactique, positions, foot à 8, schémas simples
- U12/U13 → tactique collective, pressing, transitions
- U14/U15 → schémas tactiques, phases de jeu, physique
- Seniors → tout niveau tactique et physique

POUR CHAQUE SÉANCE :

1. Échauffement avec durée
1. 2 ou 3 exercices principaux détaillés
1. Match final
1. Pour chaque exercice : joueurs, matériel, durée, objectif, consignes simples à lire aux joueurs

CONSIGNES : courtes, en langage parlé, max 4 lignes, comme si tu parlais directement aux joueurs.

TU PEUX AUSSI :

- Rédiger des messages WhatsApp pour les parents
- Conseils en cas de blessure légère
- Exercices physiques adaptés à l’âge
- Variantes si exercice trop facile ou difficile

TU NE RÉPONDS PAS aux questions sans rapport avec le football ou le coaching.`;
}

// ===========================
// APPELS OPENAI
// ===========================
async function askOpenAI(messages) {
const resp = await fetch(“https://api.openai.com/v1/chat/completions”, {
method: “POST”,
headers: {
Authorization: `Bearer ${OPENAI_API_KEY}`,
“Content-Type”: “application/json”
},
body: JSON.stringify({ model: OPENAI_MODEL_TEXT, messages, temperature: 0.7 })
});
if (!resp.ok) {
const txt = await resp.text();
console.error(“OpenAI error:”, resp.status, txt);
throw new Error(“Erreur API OpenAI”);
}
const data = await resp.json();
return data.choices?.[0]?.message?.content?.trim() || “Pas de réponse.”;
}

async function askOpenAIVision({ question, dataUrl }) {
const messages = [
{
role: “system”,
content: “Tu es Philomène I.A., une assistante personnelle française. Tu regardes l’image et expliques clairement ce qu’il y a dessus.”
},
{
role: “user”,
content: [
{ type: “text”, text: question || “Analyse l’image.” },
{ type: “image_url”, image_url: dataUrl }
]
}
];
const resp = await fetch(“https://api.openai.com/v1/chat/completions”, {
method: “POST”,
headers: {
Authorization: `Bearer ${OPENAI_API_KEY}`,
“Content-Type”: “application/json”
},
body: JSON.stringify({ model: OPENAI_MODEL_VISION, messages, temperature: 0.4 })
});
if (!resp.ok) throw new Error(“Erreur API OpenAI vision”);
const data = await resp.json();
return data.choices?.[0]?.message?.content?.trim() || “Impossible d’analyser l’image.”;
}

// ===========================
// ROUTES
// ===========================

// Philomène — /ask
app.post(”/ask”, async (req, res) => {
try {
const { conversation, userId, tokens } = req.body || {};
const uid = userId || “guest”;

```
let lastUserMessage = null;
if (Array.isArray(conversation)) {
  for (let i = conversation.length - 1; i >= 0; i--) {
    if (conversation[i].role === "user") {
      lastUserMessage = conversation[i].content;
      break;
    }
  }
}
if (!lastUserMessage?.trim()) {
  return res.status(400).json({ error: "Pas de message utilisateur fourni." });
}

pushToConversation(uid, "user", lastUserMessage);
const fullHistory = getConversationHistory(uid);
const answer = await askOpenAI(fullHistory);
pushToConversation(uid, "assistant", answer);

res.json({ answer, tokensLeft: tokens });
```

} catch (err) {
console.error(“Erreur /ask:”, err);
res.status(500).json({ error: “Erreur interne /ask.” });
}
});

// Coach IA — /coach
app.post(”/coach”, async (req, res) => {
try {
const { message, userId, categorie, clubKey, deviceId } = req.body || {};

```
if (!clubKey || !deviceId) {
  return res.status(401).json({ error: "Clé club ou identifiant appareil manquant." });
}

const access = checkClubAccess(clubKey, deviceId);
if (!access.ok) {
  return res.status(403).json({ error: access.reason });
}

if (!message?.trim()) {
  return res.status(400).json({ error: "Pas de message." });
}

const uid = `coach_${userId || "guest"}`;
const systemPrompt = getCoachPrompt(categorie);

if (!conversations[uid]) {
  conversations[uid] = [{ role: "system", content: systemPrompt }];
} else {
  conversations[uid][0] = { role: "system", content: systemPrompt };
}

pushToConversation(uid, "user", message.trim());
const answer = await askOpenAI(conversations[uid]);
pushToConversation(uid, "assistant", answer);

res.json({ answer, club: access.club.nom });
```

} catch (err) {
console.error(“Erreur /coach:”, err);
res.status(500).json({ error: “Erreur interne /coach.” });
}
});

// Analyse image — /analyze-image
app.post(”/analyze-image”, upload.single(“image”), async (req, res) => {
try {
const uid = req.body.userId || “guest”;
const userPrompt = req.body.prompt || “Décris-moi précisément l’image et dis-moi à quoi elle sert.”;

```
if (!req.file) return res.status(400).json({ error: "Aucune image reçue." });

const mimeType = req.file.mimetype || "image/jpeg";
const base64 = req.file.buffer.toString("base64");
const dataUrl = `data:${mimeType};base64,${base64}`;

pushToConversation(uid, "user", userPrompt + " [image envoyée]");
const visionAnswer = await askOpenAIVision({ question: userPrompt, dataUrl });
pushToConversation(uid, "assistant", visionAnswer);

res.json({ answer: visionAnswer });
```

} catch (err) {
console.error(“Erreur /analyze-image:”, err);
res.status(500).json({ error: “Erreur interne /analyze-image.” });
}
});

// Config publique — /config
app.get(”/config”, (_req, res) => {
res.set({ “Cache-Control”: “no-store” });
res.json({
paymentsEnabled: envTrue(PAYMENT_ENABLED) || envTrue(PAYMENTS_ENABLED),
paypalClientId: (PAYPAL_CLIENT_ID || “”).trim(),
mode: (PAYPAL_MODE || “sandbox”).trim(),
freeAnon: Number(FREE_ANON) || 0,
freeAfterSignup: Number(FREE_AFTER_SIGNUP) || 0,
});
});

// Healthcheck — /
app.get(”/”, (_req, res) => {
res.json({ ok: true, service: “Philomène I.A. + Coach IA en ligne” });
});

// ===========================
// LANCEMENT
// ===========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
console.log(“🚀 Philomène + Coach IA démarré sur le port “ + PORT);
console.log(“⚽ Clubs configurés:”, Object.keys(CLUBS).join(”, “));
});
