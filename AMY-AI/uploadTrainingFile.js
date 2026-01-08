const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const filePath = path.join(__dirname, "amy-training.jsonl");

async function uploadFile() {
  try {
    const file = await client.files.create({
      file: fs.createReadStream(filePath),
      purpose: "fine-tune"
    });

    console.log("✅ File uploaded successfully");
    console.log("📄 File ID:", file.id);
  } catch (err) {
    console.error("❌ Upload error:", err);
  }
}

uploadFile();
