
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '.env.local');
console.log("Target file:", envPath);

const REQUIRED_KEYS = {
    VITE_SUPABASE_URL: "https://jypzdlrbjzdqszwqefha.supabase.co",
    VITE_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5cHpkbHJianpkcXN6d3FlZmhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMzI0NzEsImV4cCI6MjA4NjkwODQ3MX0.2J3geQ0W6oVBV6iNLqmBqgzLqDqEe5DW9wlHzAmjHoo"
};

try {
    let content = "";
    if (fs.existsSync(envPath)) {
        content = fs.readFileSync(envPath, 'utf-8');
    }

    let updated = false;
    let newContent = content;

    // Ensure content ends with newline if not empty
    if (newContent && !newContent.endsWith('\n')) {
        newContent += '\n';
    }

    for (const [key, value] of Object.entries(REQUIRED_KEYS)) {
        if (!newContent.includes(`${key}=`)) {
            newContent += `${key}=${value}\n`;
            updated = true;
            console.log(`Appending ${key}...`);
        } else {
            console.log(`${key} already exists.`);
        }
    }

    if (updated) {
        fs.writeFileSync(envPath, newContent, 'utf-8');
        console.log("File updated successfully.");
    } else {
        console.log("No updates needed.");
    }

    // Verify
    const verifyContent = fs.readFileSync(envPath, 'utf-8');
    console.log("Final file length:", verifyContent.length);
    console.log("Contains VITE_SUPABASE_URL:", verifyContent.includes("VITE_SUPABASE_URL"));

} catch (e) {
    console.error("Failed to update .env.local:", e);
    process.exit(1);
}
