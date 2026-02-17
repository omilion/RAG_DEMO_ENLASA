
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
);

async function cleanDB() {
    console.log("🧨 TRUNCATING 'documents' table to ensure a clean sync...");
    const { error } = await supabase.from('documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) {
        console.error("❌ Error cleaning table:", error);
    } else {
        console.log("✅ Table cleaned.");
    }
}

cleanDB();
