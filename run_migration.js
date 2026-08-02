import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const client = new Client({
    connectionString: "postgresql://postgres.qfmlelswaluwtmndsadz:sigmatech2026@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres",
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        console.log("Connected to Supabase via DIRECT_URL");
        const sql = fs.readFileSync('add_download_columns.sql', 'utf8');
        console.log("Executing SQL:\n", sql);
        const res = await client.query(sql);
        console.log("Migration successful:", res);
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        await client.end();
        console.log("Disconnected.");
    }
}

run();
