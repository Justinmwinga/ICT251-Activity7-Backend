/*
    ICT251 - Activity 7
    The five record routes, mounted at /api/records.
    All SQL uses $1, $2 ... placeholders, so user input never becomes SQL text.
*/

const router = require("express").Router();
const pool = require("../db");
const { MAX_ID, parseId, validateRecord } = require("../validation");

const COLUMNS = "id, title, category, description, status";

function notFound(res) {
    return res.status(404).json({ message: "Record not found." });
}

/*
    Read and check the :id parameter. Sends the error response itself and
    returns null when the id cannot be used.
    A valid id larger than the INTEGER column can hold cannot exist: 404.
*/
function readId(req, res) {
    const id = parseId(req.params.id);

    if (id === null) {
        res.status(400).json({ message: "Id must be a positive whole number." });
        return null;
    }
    if (id > MAX_ID) {
        notFound(res);
        return null;
    }
    return id;
}

// GET /api/records: read all records
router.get("/", async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT ${COLUMNS} FROM records ORDER BY id`
        );
        res.status(200).json(result.rows);
    } catch (error) {
        next(error);
    }
});

// GET /api/records/:id: read one record
router.get("/:id", async (req, res, next) => {
    try {
        const id = readId(req, res);
        if (id === null) return;

        const result = await pool.query(
            `SELECT ${COLUMNS} FROM records WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) return notFound(res);

        res.status(200).json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

// POST /api/records: create a record (the database generates the id)
router.post("/", async (req, res, next) => {
    try {
        const { values, error } = validateRecord(req.body);
        if (error) return res.status(400).json({ message: error });

        const result = await pool.query(
            `INSERT INTO records (title, category, description, status)
             VALUES ($1, $2, $3, $4)
             RETURNING ${COLUMNS}`,
            [values.title, values.category, values.description, values.status]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

// PUT /api/records/:id: replace all four editable fields
router.put("/:id", async (req, res, next) => {
    try {
        const id = readId(req, res);
        if (id === null) return;

        const { values, error } = validateRecord(req.body);
        if (error) return res.status(400).json({ message: error });

        const result = await pool.query(
            `UPDATE records
             SET title = $1, category = $2, description = $3, status = $4
             WHERE id = $5
             RETURNING ${COLUMNS}`,
            [values.title, values.category, values.description, values.status, id]
        );

        if (result.rows.length === 0) return notFound(res);

        res.status(200).json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

// DELETE /api/records/:id: delete a record
router.delete("/:id", async (req, res, next) => {
    try {
        const id = readId(req, res);
        if (id === null) return;

        const result = await pool.query(
            "DELETE FROM records WHERE id = $1 RETURNING id",
            [id]
        );

        if (result.rows.length === 0) return notFound(res);

        res.status(200).json({ message: "Record deleted." });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
