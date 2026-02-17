
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';


import dotenv from 'dotenv';
import mammoth from 'mammoth';
import pdf from 'pdf-parse';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');







const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !GEMINI_API_KEY) {
    console.error("❌ Missing credentials in .env.local");
    console.error(`URL: ${SUPABASE_URL ? 'OK' : 'MISSING'}`);
    console.error(`KEY: ${SUPABASE_KEY ? 'OK' : 'MISSING'}`);
    console.error(`GEMINI: ${GEMINI_API_KEY ? 'OK' : 'MISSING'}`);
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const KNOWLEDGE_DIR = path.resolve(__dirname, '../Sharepoint');

async function getEmbedding(text, retries = 5, initialDelay = 500) { // Reduced for Paid Tier
    for (let i = 0; i < retries; i++) {
        try {
            const response: any = await ai.models.embedContent({
                model: "models/gemini-embedding-001",
                contents: [{ parts: [{ text }] }]
            });
            return response.embedding?.values || response.embeddings?.[0]?.values || null;
        } catch (error) {
            const isRateLimit = error.message?.includes("429") || error.message?.includes("Quota");
            if (isRateLimit && i < retries - 1) {
                const wait = initialDelay * Math.pow(2, i);
                console.warn(`   ⚠️ Rate limited. Waiting ${wait}ms before retry ${i + 1}/${retries}...`);
                await sleep(wait);
                continue;
            }
            console.error("❌ Error generating embedding:", error.message);
            return null;
        }
    }
    return null;
}




async function processFile(filePath) {
    const filename = path.basename(filePath);
    const ext = path.extname(filePath).toLowerCase();

    console.log(`📄 Processing: ${filename}`);

    let text = "";
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
        } else if (ext === '.xlsx' || ext === '.xls') {
            const workbook = XLSX.readFile(filePath);
            const sheetNames = workbook.SheetNames;
            text = sheetNames.map(name => {
                const sheet = workbook.Sheets[name];
                return `Sheet: ${name}\n${XLSX.utils.sheet_to_csv(sheet)}`;
            }).join('\n\n');
        } else {

            console.log(`⏭️  Skipping unsupported type: ${ext}`);
            return;
        }
    } catch (err) {
        console.error(`❌ Failed to read ${filename}:`, err.message);
        return;
    }

    if (!text || text.trim().length === 0) {
        console.warn(`⚠️ Empty text: ${filename}`);
        return;
    }

    // Chunking
    const chunkSize = 1000;
    const overlap = 200;
    const chunks = [];

    for (let i = 0; i < text.length; i += (chunkSize - overlap)) {
        chunks.push(text.slice(i, i + chunkSize));
    }

    console.log(`   🔸 Extracted ${chunks.length} chunks. Uploading...`);

    let successCount = 0;
    for (const [index, chunk] of chunks.entries()) {
        const embedding = await getEmbedding(chunk);
        if (!embedding) {
            console.warn(`   ⚠️ Failed embedding for chunk ${index}`);
            continue;
        }

        const { error } = await supabase.from('documents').insert({
            content: chunk,
            metadata: { source: filename, chunk_index: index },
            embedding
        });

        if (error) {
            console.error(`   ❌ Insert error chunk ${index}:`, error.message);
        } else {
            successCount++;
        }
    }
    console.log(`   ✅ Uploaded ${successCount}/${chunks.length} chunks.`);
}

async function run() {
    console.log("🚀 Starting knowledge sync...");
    console.log(`📂 Scanning: ${KNOWLEDGE_DIR}`);

    if (!fs.existsSync(KNOWLEDGE_DIR)) {
        console.error(`❌ Directory not found: ${KNOWLEDGE_DIR}`);
        return;
    }

    try {
        // Node 20+ recursive readdir
        const entries = fs.readdirSync(KNOWLEDGE_DIR, { recursive: true, withFileTypes: true });

        const files = entries
            .filter(dirent => dirent.isFile())
            .map(dirent => path.join(dirent.parentPath || dirent.path, dirent.name));

        console.log(`📊 Found ${files.length} files.`);

        for (const file of files) {
            await processFile(file);
        }





        console.log("🎉 Sync complete!");
    } catch (e) {
        console.error("❌ Fatal error:", e);
    }
}

run();
