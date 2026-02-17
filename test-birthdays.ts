
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
);

const genAI = new GoogleGenAI(process.env.VITE_GEMINI_API_KEY!);

async function testBirthdayRAG() {
    console.log("🧪 Testing Birthday RAG flow...");

    const { data, error } = await supabase
        .from('documents')
        .select('content')
        .eq('metadata->>source', 'cumpleanos_50_colaboradores.xlsx');

    if (error) {
        console.error("❌ Supabase Error:", error);
        return;
    }

    console.log(`📊 Found ${data?.length || 0} chunks for the birthday file.`);

    if (!data || data.length === 0) {
        console.log("⚠️ No document segments found for 'cumpleanos_50_colaboradores.xlsx'");
        return;
    }

    const context = data.map(d => d.content).join('\n');
    console.log("📝 Context length:", context.length);
    // console.log("📝 Context sample:", context.substring(0, 500));

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const today = new Date().toLocaleDateString('es-CL');
    const prompt = `
      Basado en los siguientes fragmentos de archivos de Recursos Humanos (que incluyen una lista de colaboradores con sus FECHAS DE NACIMIENTO), identifica a las 3 personas cuyos CUMPLEAÑOS son los más próximos a la fecha de hoy (${today}).
      
      IMPORTANTE:
      1. Usa la FECHA DE NACIMIENTO para calcular el próximo cumpleaños en 2025 o 2026.
      2. Si el cumpleaños es HOY, pon "Hoy" en el campo date.
      3. Si es mañana, pon "Mañana" en el campo date.
      4. Si es en otra fecha, pon el día y mes (ej: "25 de Marzo").
      5. Devuelve un array JSON con: name, date, department, photo (usa una URL vacía "").
      
      Fragmentos:
      ${context}
  `;

    try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        console.log("\n🤖 AI Response:");
        console.log(responseText);

        const jsonMatch = responseText.match(/\[.*\]/s);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            console.log("\n✅ Parsed JSON:", JSON.stringify(parsed, null, 2));
        } else {
            console.log("\n❌ No JSON found in response.");
        }
    } catch (err) {
        console.error("❌ Gemini Error:", err);
    }
}

testBirthdayRAG();
