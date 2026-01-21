const OpenAI = require("openai");
require("dotenv").config();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Main Amy Chat Completion API
 * POST → /api/amy
 * Body:
 * {
 *   "message": "Who are you?",
 *   "context": "optional document text"
 * }
 */
async function amyCompletions(req, res) {
  try {
    const { message, context } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ error: "Message is required" });
    }

    // ✅ USE ONE OF THESE:
    // If you have a fine-tuned model:
    // const modelName = "ftjob-9nzY5a13yBSwQTpl91tHKd6Y";

    // If NOT (recommended):
    const modelName = "ft:gpt-3.5-turbo-1106:datronix::D0NQMaOS";

    const messages = [
      {
        role: "system",
        content: `
You are Amy AI, a helpful, friendly assistant.
Answer clearly and concisely.
If you don't know something, say you don't know.
`
      }
    ];

    // ✅ Proper RAG injection
    if (context && context.trim() !== "") {
      messages.push({
        role: "system",
        content: `Use ONLY the following information to answer:\n${context}`
      });
    }

    messages.push({
      role: "user",
      content: message
    });

    const response = await client.chat.completions.create({
      model: modelName,
      messages,
      temperature: 0.3
    });

    return res.status(200).json({
      success: true,
      reply: response.choices[0].message.content
    });

  } catch (err) {
    console.error("Amy API Error:", err);
    return res.status(500).json({
      error: "AI error",
      details: err.message
    });
  }
}

module.exports = {
  amyCompletions,
};
