import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    console.log("📋 Fetching available Gemini models...\n");

    // Try to list models
    const models = await genAI.listModels();

    console.log("Available models:");
    for (const model of models) {
      console.log(`- ${model.name}`);
      console.log(`  Display name: ${model.displayName}`);
      console.log(
        `  Supported methods: ${model.supportedGenerationMethods?.join(", ")}\n`,
      );
    }
  } catch (error) {
    console.error("Error listing models:", error.message);
    console.log(
      "\n💡 Trying alternative approach with common model names...\n",
    );

    const commonModels = [
      "gemini-pro",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
      "gemini-1.5-pro-latest",
      "gemini-1.5-flash-001",
      "gemini-1.5-flash-002",
    ];

    for (const modelName of commonModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello");
        await result.response;
        console.log(`✅ Model "${modelName}" works!`);
        return modelName;
      } catch (err) {
        console.log(`❌ Model "${modelName}" failed:`);
        console.log(`   ${err.message}`);
      }
    }
  }
}

listModels();
