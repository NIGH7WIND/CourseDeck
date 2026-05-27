import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up larger limit in case of huge transcripts
app.use(express.json({ limit: "15mb" }));

// Initialize GoogleGenAI client safely
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing. Please configure it in Settings > Secrets.");
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

/* ==========================================================================
   AI API ENDPOINTS
   ========================================================================== */

/**
 * Health check endpoint
 */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", geminiConfigured: !!process.env.GEMINI_API_KEY });
});

/**
 * Endpoint to ask doubts about a video transcript
 */
app.post("/api/ai/ask", async (req, res) => {
  try {
    const { transcriptSegments, question, chatHistory, videoTitle } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required." });
    }

    if (!transcriptSegments || !Array.isArray(transcriptSegments)) {
      return res.status(400).json({ error: "Transcript segments are required to grounded the answer." });
    }

    const ai = getGeminiClient();

    // Prepare context from transcripts, keeping it compact so it fits nicely
    const formattedTranscript = transcriptSegments
      .map((seg: any) => `[${seg.timestamp}] ${seg.text}`)
      .join("\n");

    const systemInstruction = `You are an expert Study Copilot helping a student understand a YouTube video tutorial/lecture.
Video Title: "${videoTitle || "Untitled Video"}"

You have full access to the video's transcript. Your goal is to:
1. Provide accurate, clear, and context-aware answers to the student's questions, strictly grounded in the transcript context provided.
2. Maintain high teaching standards (simplify complex jargon, provide step-by-step reasoning).
3. Explicitly reference video timestamps (e.g. "02:45" or "12:10") in your answer when mentioning specific moments, so the student can jump back directly. Format timestamps as "[HH:MM:SS]" or "[MM:SS]" so they are easily clickable.
4. Keep the tone encouraging, professional, and clear.`;

    // Incorporate chat history if available
    const historyContext = chatHistory && Array.isArray(chatHistory)
      ? chatHistory.map((m: any) => `${m.role === 'user' ? 'Student' : 'Assistant'}: ${m.text}`).join("\n")
      : "";

    const userPrompt = `Here is the transcript of the video:
---
${formattedTranscript}
---

${historyContext ? `Previous Chat Conversation History:\n${historyContext}\n\n` : ''}
Student's Query: "${question}"

Please provide a highly educational response. Make sure to ground key explanations to appropriate timestamps in the format [MM:SS] or [HH:MM:SS] if those concepts are discussed in those segments.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    res.json({ answer: response.text });
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    res.status(500).json({ 
      error: error.message || "An error occurred while generating response with Gemini AI.",
      isConfigError: !process.env.GEMINI_API_KEY
    });
  }
});

/**
 * Endpoint to auto-generate recommended highlights and study notes based on transcript
 */
app.post("/api/ai/generate-notes", async (req, res) => {
  try {
    const { transcriptSegments, focusTopic, videoTitle } = req.body;

    if (!transcriptSegments || !Array.isArray(transcriptSegments) || transcriptSegments.length === 0) {
      return res.status(400).json({ error: "Transcript segments must be provided to outline study notes." });
    }

    const ai = getGeminiClient();

    // Sample segments down or aggregate them slightly if there are too many to fit in a schema request,
    // although gemini-3.5-flash has plenty of context space. Let's use up to 150 representative lines.
    const cleanSegmentsForAi = transcriptSegments.slice(0, 300).map((seg: any) => ({
      id: seg.id,
      timestamp: seg.timestamp,
      text: seg.text
    }));

    const systemInstruction = `You are an AI Curriculum Designer. Your task is to analyze a video transcript and generate the most valuable study highlights and interactive lesson notes for the student.
Video Title: "${videoTitle || "Untitled Video"}"

Analyze the transcript segments and select between 4 to 8 of the most critical moments or concepts in the video.
For each critical moment:
1. Identify the closest matching transcript segment ID provided.
2. Outline a customized, detailed explanation/annotation about that moment or concept (explaining what it means, why it is important, or a neat summary).
3. Assign a pedagogical colored label:
   - 'yellow' for general core definitions and essential summaries
   - 'green' for advanced formulas, techniques, or code details
   - 'blue' for illustrative examples, anecdotes, or visual references
   - 'purple' for key takeaways, conclusions, or warnings

You MUST return a JSON array conforming exactly to the requested schema.`;

    const topicConstraint = focusTopic 
      ? `Special Focus Request: The student wants to focus specifically on "${focusTopic}". Tailor the selected milestones and notes to highlighting this topic!`
      : `Select the most important overarching themes, methodologies, or definitions spread throughout the entire transcript.`;

    const userPrompt = `Here are the transcript segments:
${JSON.stringify(cleanSegmentsForAi)}

${topicConstraint}

Analyze and generate a list of 4 to 8 highly structured, brilliant study notes. Each note MUST use the active segment ID from the provided data.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              segmentId: {
                type: Type.STRING,
                description: "The EXACT segment id from the provided segments list that this note corresponds to."
              },
              timestamp: {
                type: Type.STRING,
                description: "The segment's timestamp, e.g. '01:23'"
              },
              color: {
                type: Type.STRING,
                enum: ["yellow", "green", "blue", "purple"],
                description: "Pedagogical highlight color code."
              },
              concept: {
                type: Type.STRING,
                description: "Brief concept title (4-8 words), e.g., 'Asymptotic Runtime Bounds' or 'React Hook Dependency Antipatterns'."
              },
              note: {
                type: Type.STRING,
                description: "Deconstructed smart learning summary note answering 'What is discussed here and why is it important?' (1-3 sentences)."
              }
            },
            required: ["segmentId", "color", "concept", "note"]
          }
        },
        temperature: 0.2
      }
    });

    const notes = JSON.parse(response.text || "[]");
    res.json({ notes });
  } catch (error: any) {
    console.error("Error generating highlights with Gemini:", error);
    res.status(500).json({ 
      error: error.message || "An error occurred while generating study notes. Are there too many segments or is GEMINI_API_KEY missing?",
      isConfigError: !process.env.GEMINI_API_KEY
    });
  }
});

/* ==========================================================================
   VITE INTEGRATION / STATIC SERVING MIDDLEWARE
   ========================================================================== */

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Full-Stack Server] Running on http://localhost:${PORT}`);
    console.log(`[Full-Stack Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();
