import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini
  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Routes
  app.post("/api/ai/process", async (req, res) => {
    try {
      const { text, action } = req.body;
      
      let prompt = "";
      if (action === "simplify") {
        prompt = `Simplify the following text to make it easier to read for someone with ADHD or cognitive fatigue. Use clear, simple language and shorter sentences. Keep the core meaning:\n\n${text}`;
      } else if (action === "summarize") {
        prompt = `Summarize the following text into concise bullet points that are easy to scan. Focus on key information and takeaways:\n\n${text}`;
      } else if (action === "explain") {
        prompt = `Explain any complex terms or concepts in the following text in very simple words:\n\n${text}`;
      } else if (action === "transform") {
        prompt = `You are an advanced neurodivergent-friendly reading transformation engine.
Your goal is to reduce cognitive load, improve focus, guide eye movement, and increase readability for users with ADHD, dyslexia, reading fatigue, or attention difficulties.

Transform text into an adaptive reading format using these principles:

CORE RULES:
1. Apply intelligent fixation points instead of uniform bolding.
2. Prioritize meaningful words (nouns, verbs, adjectives).
3. Reduce emphasis on filler words (the, and, of, in, is, to).
4. Avoid visual clutter.
5. Preserve natural reading rhythm.
6. Maintain punctuation and sentence flow.
7. Break large paragraphs into smaller readable chunks.
8. Use spacing to improve visual comfort.
9. Make the output feel calm, clean, and easy to scan.
10. The result should feel supportive, not aggressive or overstimulating.

FIXATION RULES:
- Short words (1–3 chars): minimal or no emphasis
- Medium words (4–6 chars): emphasize 1–2 meaningful segments
- Long words (7+ chars): emphasize key recognition points only
- Never bold entire words unless necessary
- Avoid repetitive visual patterns

READING OPTIMIZATION:
- Create natural visual anchors for the eyes
- Reduce dense text walls
- Preserve comprehension flow
- Add subtle breathing room between ideas
- Optimize for sustained attention

OUTPUT STYLE:
- Use markdown bold formatting (**text**) for emphasis
- Preserve readability over aesthetics
- Keep formatting subtle and intelligent
- Avoid over-formatting

Transform the following text:\n\n${text}`;
      } else {
        return res.status(400).json({ error: "Invalid action" });
      }

      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });

        const result = response.text || '';
        res.json({ result });
      } catch (aiError: any) {
        // Fallback if Gemini API fails
        console.error("Gemini API Error:", aiError);
        res.status(500).json({
          error: "AI service temporarily unavailable. Please try again or use local text processing.",
          code: 'AI_UNAVAILABLE'
        });
      }
    } catch (error: any) {
      console.error("Request Processing Error:", error);
      res.status(500).json({ error: error.message || "Failed to process request" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NeuroLens Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
