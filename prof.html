import express from "express";
import multer from "multer";
import OpenAI from "openai";
import fs from "fs";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// --------------------------------------------------
// OpenAI CONFIG
// --------------------------------------------------
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --------------------------------------------------
// SYSTEM PROMPT (clean version)
// --------------------------------------------------
const SYSTEM_PROMPT = `
Tu es Philomène – Prof privé, un professeur particulier patient et clair.
Ta mission : aider l'élève à comprendre et réussir ses exercices sans juste donner la réponse, mais en expliquant étape par étape.

Niveaux compatibles :
- Belgique (tous niveaux)
- France (école primaire, collège, lycée)

Méthode de réponse :
1. Reformule l'exercice pour être sûr de l'avoir compris.
2. Explique la méthode simplement.
3. Donne les étapes une par une.
4. Montre la réponse finale.
5. Fournis un mini-exercice similaire (avec solution).

Règles absolues :
- Ne jamais inventer des valeurs manquantes.
- Si l'énoncé est incomplet : demander les informations manquantes.
- Si une photo est fournie : analyser le texte et les équations.
- Toujours être bienveillant, clair et structuré.
`;

// --------------------------------------------------
// ROUTE : POST /prof
// --------------------------------------------------
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const userExercise = req.body.exercise || "";
    let imageBuffer = null;

    if (req.file) {
      imageBuffer = fs.readFileSync(req.file.path);
      fs.unlinkSync(req.file.path);
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userExercise }
    ];

    const input = [
      {
        role: "user",
        content: [
          { type: "text", text: userExercise },
          ...(imageBuffer
            ? [{ type: "input_image", image: imageBuffer }]
            : [])
        ]
      }
    ];

    const response = await client.chat.completions.create({
      model: "gpt-4.1",
      max_tokens: 800,
      messages: messages,
      input: input,
    });

    const output =
      response.choices?.[0]?.message?.content ||
      "Désolé, une erreur est survenue.";

    res.json({
      success: true,
      result: output,
    });

  } catch (error) {
    console.error("Erreur prof :", error);
    res.json({
      success: false,
      error: "Erreur pendant la génération",
    });
  }
});

export default router;
