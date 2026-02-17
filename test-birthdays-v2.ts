
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";

dotenv.config({ path: '.env.local' });

const API_KEY = process.env.VITE_GEMINI_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Missing env vars");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const genAI = new GoogleGenAI(API_KEY);

async function run() {
    console.log("🔍 Fetching birthday chunks...");
    const { data, error } = await supabase
        .from('documents')
        .select('content, metadata')
        .ilike('metadata->>source', '%cumple%');

    if (error) {
        console.error("❌ Error fetching:", error.message);
        return;
    }

    console.log(`✅ Found ${data?.length || 0} chunks.`);
    if (data && data.length > 0) {
        console.log("📝 Sources found:", Array.from(new Set(data.map(d => d.metadata.source))));

        const context = data.map(d => d.content).join('\n');
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const today = new Date().toLocaleDateString('es-CL');
        const prompt = `Basado en esta lista de colaboradores, busca los 3 cumpleaños más cercanos a hoy (${today}). 
        Usa la fecha de nacimiento para el cálculo.
        Devuelve JSON con campos: name, date, department. 
        Contexto:
        ${context}`;

        console.log("🤖 Querying Gemini...");
        const result = await model.generateContent(prompt);
        console.log("💬 Response:", result.response.text());
    }
}

run();
