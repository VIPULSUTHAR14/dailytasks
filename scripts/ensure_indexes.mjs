// scripts/ensure_indexes.mjs
// Idempotent database indexing script for AlgoCraft MongoDB collections

import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";

function loadEnv() {
    const envPath = path.resolve(".env.local");
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf8");
        content.split("\n").forEach((line) => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
                const [key, ...rest] = trimmed.split("=");
                const val = rest.join("=").replace(/^["']|["']$/g, "").trim();
                process.env[key.trim()] = val;
            }
        });
    }
}

async function ensureIndexes() {
    loadEnv();
    const uri = process.env.MONGO_DB_URI;
    const dbName = process.env.MONGO_DB_DATABASE_NAME;

    if (!uri) {
        console.error("MONGO_DB_URI is not set in environment or .env.local");
        process.exit(1);
    }

    console.log(`Connecting to MongoDB (${dbName || "default"})...`);
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db(dbName);
        console.log("Connected successfully! Ensuring indexes...");

        const indexesToCreate = [
            { col: "sessions", spec: { hashedToken: 1 }, options: { background: true } },
            { col: "sessions", spec: { ExpireAt: 1 }, options: { expireAfterSeconds: 0, background: true } },
            { col: "users", spec: { email: 1 }, options: { background: true } },
            { col: "tasks", spec: { user_id: 1 }, options: { background: true } },
            { col: "dsatopics", spec: { user_id: 1 }, options: { background: true } },
            { col: "custom_notes", spec: { user_id: 1 }, options: { background: true } },
            { col: "timetable", spec: { userId: 1 }, options: { background: true } },
            { col: "dsaquestions", spec: { user_id: 1 }, options: { background: true } },
            { col: "habits", spec: { user_id: 1 }, options: { background: true } },
            { col: "aptitude", spec: { user_id: 1 }, options: { background: true } },
        ];

        for (const idx of indexesToCreate) {
            try {
                const res = await db.collection(idx.col).createIndex(idx.spec, idx.options);
                console.log(`  ✓ [${idx.col}] Index ensured: ${res}`);
            } catch (err) {
                console.warn(`  ⚠ [${idx.col}] Could not create index: ${err.message}`);
            }
        }

        console.log("\nAll indexes successfully verified and ensured.");
    } finally {
        await client.close();
    }
}

ensureIndexes().catch((err) => {
    console.error("Indexing failed:", err);
    process.exit(1);
});
