
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
);

async function verifyDetailed() {
    console.log("🔍 Deep dive into Supabase documents...");

    const { data, error, count } = await supabase
        .from('documents')
        .select('id, metadata, content', { count: 'exact' });

    if (error) {
        console.error("❌ Error fetching documents:", error);
        return;
    }

    console.log(`\n📊 Total segments in 'documents' table: ${count}`);

    if (!data || data.length === 0) {
        console.log("⚠️ TABLE IS EMPTY! The sync script might be failing to authenticate or insert.");
        return;
    }

    const sources = new Map<string, number>();
    const folderStats = new Map<string, number>();

    data.forEach(doc => {
        const source = doc.metadata?.source || 'Missing Source';
        const folder = doc.metadata?.folder || 'Missing Folder';
        sources.set(source, (sources.get(source) || 0) + 1);
        folderStats.set(folder, (folderStats.get(folder) || 0) + 1);
    });

    console.log("\n📄 Documents by Source:");
    sources.forEach((cnt, src) => console.log(` - ${src}: ${cnt} chunks`));

    console.log("\n📂 Documents by Folder:");
    folderStats.forEach((cnt, fld) => console.log(` - ${fld}: ${cnt} chunks`));

    // Sample check for birthday content
    const birthdaySamples = data.filter(d => d.metadata?.source?.includes('cumpleanos'));
    if (birthdaySamples.length > 0) {
        console.log(`\n✅ Found ${birthdaySamples.length} birthday chunks.`);
        console.log("📝 Sample content snippet:", birthdaySamples[0].content.substring(0, 100).replace(/\n/g, ' '));
    } else {
        console.log("\n❌ NO BIRTHDAY DATA FOUND IN DB.");
    }

    // Check unique IDs to ensure no major duplicates that could break UI logic
    const ids = new Set(data.map(d => d.id));
    console.log(`\n🆔 Unique IDs: ${ids.size} / ${count}`);
}

verifyDetailed();
