// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();

// CORS: autoriser le front officiel à appeler l'API
app.use(cors({
  origin: [
    "https://philomeneia.com",
    "https://www.philomeneia.com"
  ],
  methods: ["POST"],
  allowedHeaders: ["Content-Type"]
}));

// lire le JSON envoyé par le front
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = "gpt-4o-mini";

// route qui reçoit la conversation complète et renvoie la réponse IA
app.post("/ask", async (req, res) => {
  try {
    const { conversation } = req.body;
    // conversation attendu: [{ role: "system"|"user"|"assistant", content: "..." }, ...]

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: conversation.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (!data || !data.choices || !data.choices[0]) {
      console.error("Réponse OpenAI inattendue:", data);
      return res.status(500).json({ error: "Réponse invalide d'OpenAI." });
    }

    const answer = data.choices[0].message.content;
    res.json({ answer });

  } catch (err) {
    console.error("Erreur /ask:", err);
    res.status(500).json({ error: "Une erreur est survenue côté serveur." });
  }
});

// port Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Philomène API en ligne sur le port " + PORT);
});
