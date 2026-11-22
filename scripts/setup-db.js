/*
    ICT251 - Activity 7
    Creates the records table and adds the eight starting records.
    Run once locally (and once for the hosted database):  npm run db:setup
    Safe to run again: it never duplicates the starting records.
*/

const fs = require("fs");
const path = require("path");
const pool = require("../db");

async function run() {
    const root = path.join(__dirname, "..");

    for (const file of ["schema.sql", "seed.sql"]) {
        const sql = fs.readFileSync(path.join(root, file), "utf8");
        await pool.query(sql);
        console.log(`Ran ${file}`);
    }

    const result = await pool.query("SELECT COUNT(*) AS total FROM records");
    console.log(`Database ready. Records in table: ${result.rows[0].total}`);
}

run()
    .catch((error) => {
        console.error("Database setup failed:", error.message);
        process.exitCode = 1;
    })
    .finally(() => pool.end());
