import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

console.log("Testing Gemini API Key...");
console.log(
  "API Key:",
  process.env.GEMINI_API_KEY
    ? `${process.env.GEMINI_API_KEY.substring(0, 20)}...`
    : "NOT SET",
);

if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is not set in .env file");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

async function testAPI() {
  try {
    console.log("\n🧪 Testing API with a simple prompt...");
    const result = await model.generateContent(
      "Say 'API key is working!' in JSON format: {message: '...'}",
    );
    const response = await result.response;
    const text = response.text();
    console.log("✅ API Response:", text);
    console.log("\n✅ SUCCESS! Your Gemini API key is valid and working.");
  } catch (error) {
    console.error("\n❌ FAILED! API Key Error:");
    console.error("Error:", error.message);
    if (error.message.includes("API key not valid")) {
      console.error("\n🔑 Your API key is INVALID. Please:");
      console.error("1. Go to https://aistudio.google.com/app/apikey");
      console.error("2. Create a NEW API key");
      console.error("3. Update the GEMINI_API_KEY in backend/.env file");
    }
  }
}

testAPI();
