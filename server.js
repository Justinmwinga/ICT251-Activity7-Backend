/*
    ICT251 - Activity 7
    IT Support Desk Management System: independent Node.js API.
*/

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");
const { renderGuide } = require("./guide");

const app = express();

// Render sits behind a proxy; this makes req.protocol report https.
app.set("trust proxy", 1);
app.disable("x-powered-by");

// Frontend origins allowed to read responses in a browser (Postman is unaffected).
const origins = (process.env.CLIENT_ORIGINS || "")
    .split(",").map(value => value.trim()).filter(Boolean);

app.use(cors({ origin: origins }));
app.use(express.json({ limit: "10kb" }));


// GET /: small HTML guide for the marker
app.get("/", (req, res) => {
    const baseUrl = process.env.PUBLIC_URL || `${req.protocol}://${req.get("host")}`;
    res.status(200).type("html").send(renderGuide(baseUrl));
});

// GET /health: the server and the database both respond
app.get("/health", async (req, res) => {
    try {
        const result = await pool.query("SELECT COUNT(*) AS total FROM records");
        res.status(200).json({
            status: "ok",
            database: "connected",
            records: Number(result.rows[0].total)
        });
    } catch (error) {
        console.error("Health check failed:", error.message);
        res.status(503).json({
            message: "Database is not responding or the records table is missing."
        });
    }
});

app.use("/api/records", require("./routes/records"));


// Unknown routes: JSON 404
app.use((req, res) => {
    res.status(404).json({ message: "Route not found." });
});

// Error middleware (four parameters): malformed JSON is 400, the rest is 500
app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }
    if (error.type === "entity.parse.failed") {
        return res.status(400).json({ message: "Request body is not valid JSON." });
    }
    if (error.type === "entity.too.large") {
        return res.status(400).json({ message: "Request body is too large." });
    }

    console.error("Unexpected error:", error);
    res.status(500).json({ message: "Something went wrong on the server. Please try again." });
});


const port = process.env.PORT || 3000;

app.listen(port, "0.0.0.0", () => {
    console.log(`Server listening on port ${port}`);
});
