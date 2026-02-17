
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';
// Fix for pdf-parse "no default export"
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
import mammoth from 'mammoth';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '../.env.local');

// Debug: Print raw file content
try {
    const rawContent = fs.readFileSync(envPath, 'utf-8');
    console.log("Raw .env.local content length:", rawContent.length);
    console.log("First 100 chars:", rawContent.substring(0, 100));
    console.log("Last 100 chars:", rawContent.substring(Math.max(0, rawContent.length - 100)));
} catch (e) {
    console.error("Error reading .env.local:", e);
}

const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error("Error loading .env.local:", result.error);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;

console.log("Debug Env:");
console.log("SUPABASE_URL:", SUPABASE_URL ? "Set" : "Missing");
console.log("SUPABASE_KEY:", SUPABASE_KEY ? "Set" : "Missing");
console.log("GEMINI_API_KEY:", GEMINI_API_KEY ? "Set" : "Missing");


if (!SUPABASE_URL || !SUPABASE_KEY || !GEMINI_API_KEY) {
    console.error("Missing credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const KNOWLEDGE_DIR = path.resolve(__dirname, '../Sharepoint');


async function getEmbedding(text) {
    try {
        // Correct usage for @google/genai SDK (v0.1.0+)
        const response: any = await ai.models.embedContent({
            model: "models/text-embedding-004",
            contents: [
                {
                    parts: [{ text }]
                }
            ]
        });

        // The response structure might be response.embedding.values or response.embeddings[0].values
        // Based on docs/types, it returns 'embedding' for single content.
        return response.embedding?.values || response.embeddings?.[0]?.values || null;
    } catch (error) {
        console.error("Error generating embedding:", error);
        // Fallback for different SDK version behavior if needed
        return null;
    }
}


async function processFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const filename = path.basename(filePath);
    let text = '';

    console.log(`Processing: ${filename}`);

    try {
        if (ext === '.pdf') {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);
            text = data.text;
        } else if (ext === '.txt' || ext === '.md') {
            text = fs.readFileSync(filePath, 'utf-8');
        } else if (ext === '.docx') {
            const result = await mammoth.extractRawText({ path: filePath });
            text = result.value;
        } else {
            console.log(`Skipping unsupported file type: ${ext}`);
            return;
        }

        if (!text.trim()) {
            console.warn(`Empty text in ${filename}`);
            return;
        }

        // Split into chunks (simple overlap strategy)
        const chunkSize = 1000;
        const overlap = 200;
        const chunks = [];

        for (let i = 0; i < text.length; i += (chunkSize - overlap)) {
            chunks.push(text.slice(i, i + chunkSize));
        }

        console.log(`- Extracted ${chunks.length} chunks.`);

        for (const [index, chunk] of chunks.entries()) {
            const embedding = await getEmbedding(chunk);
            if (!embedding) continue;

            const { error } = await supabase.from('documents').insert({
                content: chunk,
                metadata: { source: filename, chunk_index: index },
                embedding
            });

            if (error) {
                console.error(`Error inserting chunk ${index}:`, error);
            }
        }
        console.log(`- Uploaded successfully.`);

    } catch (err) {
        console.error(`Failed to process ${filename}:`, err);
    }
}

async function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            await walkDir(fullPath);
        } else {
            await processFile(fullPath);
        }
    }
}

async function run() {
    console.log("Starting knowledge sync...");
    // Optional: Clear existing documents to avoid duplicates during dev
    // await supabase.from('documents').delete().neq('id', 0); 

    if (!fs.existsSync(KNOWLEDGE_DIR)) {
        console.error(`Directory not found: ${KNOWLEDGE_DIR}`);
        return;
    }

    await walkDir(KNOWLEDGE_DIR);
    console.log("Sync complete!");
}

run();
