// server/index.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(cors());
app.use(bodyParser.json());

console.log("🔑 Gemini API Key Loaded:", process.env.GOOGLE_API_KEY ? "Yes" : "No");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // ✅ updated model

// Root route
app.get("/", (req, res) => {
  res.send("✅ Gemini API is live!");
});

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    console.log("Incoming message:", message);

    // Generate response from Gemini with simple retry on overload/too many requests
    const generateWithRetry = async (input, maxRetries = 3) => {
      let attempt = 0;
      let lastErr;
      while (attempt <= maxRetries) {
        try {
          const result = await model.generateContent(input);
          const response = await result.response;
          return response.text();
        } catch (err) {
          lastErr = err;
          const status = err?.status || err?.response?.status;
          const isRetryable =
            status === 429 ||
            status === 503 ||
            /overload|unavailable|quota|rate/i.test(err?.message || "");
          if (!isRetryable || attempt === maxRetries) break;
          const backoffMs = 500 * Math.pow(2, attempt); // 500, 1000, 2000
          await new Promise((r) => setTimeout(r, backoffMs));
          attempt += 1;
        }
      }
      throw lastErr;
    };

    const text = await generateWithRetry(message);

    console.log("Gemini response:", text);
    res.json({ reply: text });
  } catch (error) {
    console.error("❌ Server error:", error);
    const status = error?.status || error?.response?.status;
    const overload =
      status === 429 ||
      status === 503 ||
      /overload|unavailable|quota|rate/i.test(error?.message || "");
    res.status(overload ? 503 : 500).json({
      error: overload
        ? "The model is overloaded. Please try again shortly."
        : error.message || "Server error occurred",
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));