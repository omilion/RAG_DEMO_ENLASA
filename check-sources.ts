
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
);

async function checkSources() {
    console.log("🔍 Fetching all document metadata...");

    // We fetch in batches if count is high, but for ~3000 segments we can try a large range
    const { data, error } = await supabase
        .from('documents')
        .select('metadata')
        .limit(10000);

    if (error) {
        console.error("❌ Error:", error);
        return;
    }

    const sources = {};
    data?.forEach(doc => {
        const s = doc.metadata?.source || 'Unknown';
        sources[s] = (sources[s] || 0) + 1;
    });

    console.log("\n📊 Sources found in DB:");
    Object.entries(sources).forEach(([src, count]) => {
        console.log(` - ${src}: ${count} chunks`);
    });

    if (!sources['cumpleanos_50_colaboradores.xlsx']) {
        console.log("\n⚠️  CRITICAL: Birthday file is MISSING in DB.");
    } else {
        console.log("\n✅ Birthday file is present.");
    }
}

checkSources();
