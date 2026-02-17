
import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read API Key from .env.local
const envPath = path.resolve(__dirname, '.env.local');
if (!fs.existsSync(envPath)) {
    console.error(".env.local not found at", envPath);
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const match = envContent.match(/VITE_GEMINI_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : '';

if (!apiKey) {
    console.error("API Key not found in .env.local");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function testModel(modelName) {
    console.log(`\n--- Testing with ${modelName} ---`);
    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: [
                {
                    role: "user",
                    parts: [{ text: "Busca las últimas 5 noticias relevantes sobre el sector eléctrico en Chile." }]
                }
            ],
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        console.log("Response received.");
        const candidate = response.candidates?.[0];
        if (candidate) {
            if (candidate.groundingMetadata) {
                console.log("Grounding Metadata found.");
                const chunks = candidate.groundingMetadata.groundingChunks;
                if (chunks && chunks.length > 0) {
                    console.log(`Found ${chunks.length} chunks.`);
                } else {
                    console.log("Grounding Metadata present but no chunks.");
                }
            } else {
                console.log("No Grounding Metadata found.");
            }
        } else {
            console.log("No candidates found.");
        }

    } catch (error) {
        // console.error(`Error with ${modelName}:`, error);
        console.error(`Error with ${modelName}: ${error.message || error}`);
        if (error.status) console.error("Status:", error.status);
    }
}

async function run() {
    await testModel("gemini-flash-latest");
    await testModel("gemini-2.0-flash-lite-001");
}

run();
