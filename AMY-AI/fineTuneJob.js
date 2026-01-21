const OpenAI = require("openai");
require("dotenv").config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 👇 PASTE THE REAL FILE ID FROM UPLOAD STEP
const trainingFileId = "file-Psij9RFpqeJkBeyKXiWVqK";

async function createFineTune() {
  try {
    const job = await client.fineTuning.jobs.create({
      training_file: trainingFileId,
      model: "gpt-3.5-turbo-1106"
    });

    console.log("✅ Fine-tuning started");
    console.log("🆔 Job ID:", job.id);
  } catch (err) {
    console.error("❌ Fine-tune error:", err);
  }
}

async function getModelName() {
  const job = await client.fineTuning.jobs.retrieve(
    "ftjob-9nzY5a13yBSwQTpl91tHKd6Y"
  );

  console.log("Status:", job.status);
  console.log("Model:", job.fine_tuned_model);
}

createFineTune();
getModelName();
