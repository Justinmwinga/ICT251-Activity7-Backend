/*
    ICT251 - Activity 7
    Database connection pool (PostgreSQL).
*/

require("dotenv").config();
const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
    console.error(
        "DATABASE_URL is not set. Copy .env.example to .env (local) " +
        "or add it in the Render service settings."
    );
    process.exit(1);
}

// Hosted databases (Render, Neon, ...) need SSL. Local Postgres usually does not.
function useSsl(connectionString) {
    if (process.env.DATABASE_SSL === "false") {
        return false;
    }
    try {
        const host = new URL(connectionString).hostname;
        return !["localhost", "127.0.0.1", "::1"].includes(host);
    } catch {
        return true;
    }
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: useSsl(process.env.DATABASE_URL) ? { rejectUnauthorized: false } : false,
    max: 5,
    connectionTimeoutMillis: 10000
});

// An idle connection can be dropped by the host. Log it instead of crashing.
pool.on("error", (error) => {
    console.error("Unexpected database pool error:", error.message);
});

module.exports = pool;
