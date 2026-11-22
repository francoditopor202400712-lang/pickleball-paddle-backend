import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const chatWithAI = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        message: "Please provide a message.",
      });
    }

    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Message must not exceed 2000 characters.",
      });
    }

    const safeHistory = Array.isArray(history)
      ? history.slice(-10).filter(
          (item) =>
            ["user", "model"].includes(item.role) &&
            typeof item.text === "string"
        )
      : [];

    const conversation = [
      ...safeHistory.map((item) => ({
        role: item.role,
        parts: [{ text: item.text.slice(0, 2000) }],
      })),
      {
        role: "user",
        parts: [{ text: message }],
      },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: conversation,
      config: {
        systemInstruction: `
You are the Pickleball Paddle Shop AI Assistant.

Your responsibilities:
- Help customers understand pickleball paddles.
- Explain paddle materials, weight, grip, control, and power.
- Recommend paddles based on customer needs and budget.
- Explain pickleball rules and beginner techniques.
- Be friendly, clear, and professional.

Important rules:
- Do not invent product names, prices, stock quantities, or discounts.
- If you do not have verified store inventory information, tell the customer to check the Products page.
- Never claim that an order or payment was completed.
- Keep answers easy to understand.
- Focus on pickleball and the store.
        `,
      },
    });

    return res.status(200).json({
      success: true,
      reply: response.text,
    });
  } catch (error) {
    console.error("Gemini AI error:", error);

    return res.status(500).json({
      success: false,
      message: "The AI assistant is temporarily unavailable.",
    });
  }
};