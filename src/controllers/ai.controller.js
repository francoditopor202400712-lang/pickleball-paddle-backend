
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

const ai = apiKey
  ? new GoogleGenAI({ apiKey })
  : null;

export const chatWithAI = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing from environment.");
      return res.status(500).json({
        success: false,
        message: "Gemini API key is not configured on the server."
      });
    }

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid message."
      });
    }

    const safeHistory = Array.isArray(history)
      ? history.slice(-10).filter(
          item =>
            ["user", "model"].includes(item.role) &&
            typeof item.text === "string"
        )
      : [];

    const contents = [
      ...safeHistory.map(item => ({
        role: item.role,
        parts: [{ text: item.text.slice(0, 2000) }]
      })),
      {
        role: "user",
        parts: [{ text: message.slice(0, 2000) }]
      }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction:
          "You are a helpful Pickleball Paddle Shop AI assistant. " +
          "Answer pickleball questions clearly. Never invent store prices, " +
          "product availability, or order information."
      }
    });

    return res.status(200).json({
      success: true,
      reply: response.text
    });

  } catch (error) {
    console.error("GEMINI ERROR MESSAGE:", error?.message);
    console.error("GEMINI ERROR STATUS:", error?.status);
    console.error("GEMINI ERROR CODE:", error?.code);
    console.error("GEMINI ERROR DETAILS:", error?.errorDetails);

    return res.status(500).json({
      success: false,
      message: "The AI assistant is temporarily unavailable.",
      errorCode: error?.status || error?.code || "UNKNOWN"
    });
  }
};
