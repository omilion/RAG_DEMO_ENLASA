
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
);

async function verify() {
    console.log("🔍 Checking documents in Supabase...");

    const { data, error, count } = await supabase
        .from('documents')
        .select('metadata', { count: 'exact' });

    if (error) {
        console.error("❌ Error fetching documents:", error);
        return;
    }

    console.log(`📊 Total segments uploaded: ${count}`);

    const uniqueSources = new Map<string, number>();
    const folders = new Set<string>();

    data?.forEach(doc => {
        const source = doc.metadata?.source || 'Desconocido';
        const folder = doc.metadata?.folder || 'Raíz';
        uniqueSources.set(source, (uniqueSources.get(source) || 0) + 1);
        folders.add(folder);
    });

    console.log("\n📄 Unique Sources & Segment Count:");
    uniqueSources.forEach((count, source) => console.log(` - ${source}: ${count} segments`));

    console.log("\n📂 Folders found in metadata:");
    Array.from(folders).forEach(f => console.log(` - ${f}`));

    // Check for birthday file specifically
    const birthdayDocs = data?.filter(d => d.metadata?.source === 'cumpleanos_50_colaboradores.xlsx');
    console.log(`\n🎂 Birthday chunks (cumpleanos_50_colaboradores.xlsx): ${birthdayDocs?.length || 0}`);

    if (birthdayDocs && birthdayDocs.length > 0) {
        console.log("✅ Birthday data is in DB.");
    } else {
        console.log("⚠️ Birthday data MISSING in DB.");
    }
}

verify();
