import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for generating AI report based on feedback
  app.post("/api/generate-report", async (req, res) => {
    try {
      const { sessionName, currentReport, newAnswers, formStructure } = req.body;
      
      const prompt = `
        You are an expert trainer evaluator. I will provide you with the name of a training session, its current feedback report, the questions asked, and the newly submitted answers.
        Update or generate a concise summary report of the feedback so far.

        Session Name: ${sessionName}
        Form Structure (Questions): ${JSON.stringify(formStructure)}
        Newly Submitted Answers: ${JSON.stringify(newAnswers)}
        Current Report State (if any): ${JSON.stringify(currentReport)}
        
        Generate a JSON object with:
        - actionableInsight (string): A short, actionable takeaway for the trainer.
        - strengths (array of strings): 2-3 main strengths mentioned or implied by the answers.
        - areasForImprovement (array of strings): 1-2 areas for improvement.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              actionableInsight: { type: Type.STRING },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              areasForImprovement: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["actionableInsight", "strengths", "areasForImprovement"]
          }
        }
      });

      let jsonStr = response.text?.trim() || "{}";
      const report = JSON.parse(jsonStr);
      res.json(report);
    } catch (error: any) {
      console.error("Error generating report:", error);
      res.status(500).json({ error: error.message });
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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
