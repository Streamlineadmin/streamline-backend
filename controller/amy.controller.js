const OpenAI = require("openai");
require("dotenv").config();
const cache = require('../AMY_REPORTING/cache');
const SEMANTIC = require('../AMY_REPORTING/semantic');
const { Op, Sequelize } = require('sequelize');
const extractSchema = require("../AMY_REPORTING/schemaExtractor");
const aiPlanner = require("../AMY_REPORTING/aiPlanner");
const validatePlan = require("../AMY_REPORTING/planValidator");
const executePlan = require("../AMY_REPORTING/queryExecutor");
const formatResponse = require("../AMY_REPORTING/responseFormatter");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Parse ranges like today, 7_days, last_N_days
function parseRange(range) {
  if (!range) return 7;
  if (range === 'today') return 1;

  const match = range.match(/last_(\d+)_days/);
  if (match) return parseInt(match[1]);

  if (range === '7_days') return 7;
  if (range === '30_days') return 30;

  return 7;
}




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

// -------------------- API Handler --------------------
// controllers/amyReport.js
const createEngine = require('../AMY_REPORTING'); // engine folder
const db = require('../models'); // sequelize instance

// initialize ONCE (important for performance)
const engine = createEngine(db.sequelize.models);


async function amyReport(req, res) {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ success:false, error:'Query required' });

    const result = await engine(query);
    res.json(result);
  } catch(err) {
    res.status(500).json({ success:false, error: err.message });
  }
}


module.exports = amyReport;



module.exports = {
  amyCompletions,
  amyReport
};
