
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugRAG() {
    console.log("Checking Supabase 'documents' table...");

    // 1. Count documents
    const { count, error: countError } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error("Error counting documents:", countError);
        return;
    }
    console.log(`Total documents found: ${count}`);

    if (count === 0) {
        console.warn("Table is empty! Did sync-knowledge.ts run successfully?");
        return;
    }

    // 2. Fetch sample metadata
    const { data: samples, error: sampleError } = await supabase
        .from('documents')
        .select('metadata, content')
        .limit(3);

    if (sampleError) {
        console.error("Error fetching samples:", sampleError);
    } else {
        console.log("Sample documents:");
        samples.forEach((doc, i) => {
            console.log(`[${i}] Source: ${doc.metadata?.source}, Content Preview: ${doc.content.substring(0, 50)}...`);
        });
    }
}

debugRAG();
