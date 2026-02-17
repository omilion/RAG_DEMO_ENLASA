
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
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

    console.log(`📊 Total documents: ${count}`);

    const uniqueSources = new Set();
    const folders = new Set();

    data.forEach(doc => {
        if (doc.metadata?.source) uniqueSources.add(doc.metadata.source);
        if (doc.metadata?.folder) folders.add(doc.metadata.folder);
    });

    console.log("\n📄 Unique Sources:");
    Array.from(uniqueSources).forEach(s => console.log(` - ${s}`));

    console.log("\n📂 Folders:");
    Array.from(folders).forEach(f => console.log(` - ${f}`));

    // Check for birthday file specifically
    const birthdayDocs = data.filter(d => d.metadata?.source === 'cumpleanos_50_colaboradores.xlsx');
    console.log(`\n🎂 Birthday chunks: ${birthdayDocs.length}`);
}

verify();
