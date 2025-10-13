// server/index.js
import dotenv from "dotenv";
dotenv.config();

console.log("🧪 Testing dotenv...");
console.log("🔑 GOOGLE_API_KEY:", process.env.GOOGLE_API_KEY);

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

    // Generate response from Gemini
    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    console.log("Gemini response:", text);
    res.json({ reply: text });
  } catch (error) {
    console.error("❌ Server error:", error);
    res.status(500).json({
      error: error.message || "Server error occurred",
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
console.log("🔑 Gemini API Key Loaded:", process.env.GOOGLE_API_KEY ? "Yes" : "No");