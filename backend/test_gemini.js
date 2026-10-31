const path = require("path");
// Try backend/.env first, then frontend/.env
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
if (!process.env.GEMINI_API_KEY) {
    require("dotenv").config({ path: path.resolve(__dirname, "../frontend/.env") });
}

const { GoogleGenAI } = require("@google/genai");

async function testGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("Testing Gemini API with key:", apiKey ? apiKey.substring(0, 10) + "..." : "NOT FOUND");

    if (!apiKey) {
        console.error("ERROR: GEMINI_API_KEY is missing from .env");
        process.exit(1);
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        
        // Models to try in order
        const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
        let successModel = null;

        for (const model of models) {
            try {
                console.log(`Pinging model '${model}'...`);
                const response = await ai.models.generateContent({
                    model: model,
                    contents: "You are DB-Surgeon. Reply with: 'Gemini Online: Ready for Autonomous DBA'."
                });
                console.log(`\nSUCCESS with ${model}!\nResponse:`, response.text);
                successModel = model;
                break;
            } catch (err) {
                console.warn(`Model ${model} failed: ${err.message}`);
            }
        }

        if (!successModel) {
            console.error("All Gemini models failed. Please check the API key permissions.");
        }
    } catch (error) {
        console.error("Gemini initialization error:", error.message);
    }
}

testGemini();
