const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Safely parses AI JSON output
 * Removes ```json ``` fences if present
 */
function safeJSONParse(text) {
  if (!text || typeof text !== "string") {
    throw new Error("AI returned empty response");
  }

  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error(
      "AI returned invalid JSON.\n\nRAW OUTPUT:\n" + text
    );
  }
}

/**
 * AI Query Planner
 * Converts user question → execution plan
 */
async function aiPlanner(schema, userQuery) {
  const prompt = `
You are an AI database query planner.

Database schema:
${JSON.stringify(schema, null, 2)}

User question:
"${userQuery}"

Rules:
- Return ONLY valid JSON
- Do NOT use markdown
- Do NOT add explanations
- Do NOT add comments

Required JSON format:
{
  "entity": "table_or_model_name",
  "action": "list | count | sum | chart",
  "filters": {},
  "dateRange": {
    "type": "today | last_days | null",
    "value": null
  },
  "metric": null,
  "groupBy": null,
  "chart": null
}
`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "user", content: prompt }
    ]
  });

  const rawOutput = response.choices[0].message.content;

  return safeJSONParse(rawOutput);
}

module.exports = aiPlanner;
