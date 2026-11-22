/*
    ICT251 - Activity 7
    Runs the Step 7 tests from the brief against a running API.

    Local:   npm run test:api
    Hosted:  node scripts/smoke-test.js https://your-backend.onrender.com

    It creates test records and deletes them again. Needs Node 18 or newer.
    The restart-persistence test cannot be automated: see the README.
*/

const base = (process.argv[2] || process.env.BASE_URL || "http://localhost:3000")
    .replace(/\/+$/, "");

const valid = {
    title: "Printer offline",
    category: "Hardware",
    description: "The lab printer shows offline.",
    status: "Pending"
};

let passed = 0;
let failed = 0;

function check(name, condition, detail = "") {
    if (condition) {
        passed++;
        console.log(`PASS  ${name}`);
    } else {
        failed++;
        console.log(`FAIL  ${name}${detail ? "  -> " + detail : ""}`);
    }
}

async function call(method, path, body, raw = false) {
    const options = { method, headers: {} };

    if (body !== undefined) {
        options.headers["Content-Type"] = "application/json";
        options.body = raw ? body : JSON.stringify(body);
    }

    const response = await fetch(base + path, options);
    const text = await response.text();
    let json = null;

    try { json = JSON.parse(text); } catch { /* not JSON */ }

    return { status: response.status, json, text, type: response.headers.get("content-type") || "" };
}

const hasMessage = (res) => res.json && typeof res.json.message === "string" && res.json.message.length > 0;

async function main() {
    console.log(`Testing ${base}\n`);

    // Cold start on a free host can take a minute
    const first = await fetch(base + "/health", { signal: AbortSignal.timeout(90000) }).catch(() => null);
    if (!first) {
        console.log("Cannot reach the server. Is it running (or still waking up)?");
        process.exit(1);
    }

    // --- Guide and health
    let res = await call("GET", "/");
    check("GET / returns an HTML guide", res.status === 200 && res.type.includes("text/html") && res.text.includes("/api/records"));

    res = await call("GET", "/health");
    check("GET /health 200 with database connected", res.status === 200 && res.json?.database === "connected", `status ${res.status}`);

    // --- Read all
    res = await call("GET", "/api/records");
    const startCount = Array.isArray(res.json) ? res.json.length : -1;
    check("GET /api/records 200 and a JSON array", res.status === 200 && Array.isArray(res.json));
    check("Starting data has at least 8 records", startCount >= 8, `found ${startCount}`);

    // --- Create
    res = await call("POST", "/api/records", { ...valid, title: "  Printer offline  ", id: 999999 });
    const created = res.json;
    check("POST valid body: 201 with a new id", res.status === 201 && Number.isInteger(created?.id), `status ${res.status}`);
    check("POST ignores a client-supplied id", created?.id !== 999999);
    check("POST trims spaces from text", created?.title === "Printer offline");
    const id = created?.id;

    // --- Read one
    res = await call("GET", `/api/records/${id}`);
    check("GET one: 200 and the exact record", res.status === 200 && JSON.stringify(res.json) === JSON.stringify(created));

    // --- Update
    const changed = { title: "Printer fixed", category: "Hardware", description: "Toner replaced and tested.", status: "Completed" };
    res = await call("PUT", `/api/records/${id}`, changed);
    check("PUT: 200 with changed values and original id", res.status === 200 && res.json?.id === id && res.json?.status === "Completed" && res.json?.title === "Printer fixed");

    res = await call("PUT", `/api/records/${id}`, { title: "Only a title" });
    check("PUT with missing fields: 400", res.status === 400 && hasMessage(res));

    // --- Validation: nothing is created
    const bad = [
        ["missing title", { ...valid, title: undefined }],
        ["spaces-only title", { ...valid, title: "     " }],
        ["title of 2 characters", { ...valid, title: "ab" }],
        ["title of 81 characters", { ...valid, title: "x".repeat(81) }],
        ["category of 1 character", { ...valid, category: "a" }],
        ["description of 4 characters", { ...valid, description: "abcd" }],
        ["description of 301 characters", { ...valid, description: "x".repeat(301) }],
        ["invalid status", { ...valid, status: "Done" }],
        ["status with wrong case", { ...valid, status: "pending" }],
        ["title that is a number", { ...valid, title: 12345 }]
    ];
    for (const [name, body] of bad) {
        res = await call("POST", "/api/records", body);
        check(`POST ${name}: 400 and a message`, res.status === 400 && hasMessage(res), `status ${res.status}`);
    }

    res = await call("POST", "/api/records", [1, 2, 3]);
    check("POST an array instead of an object: 400", res.status === 400 && hasMessage(res));

    // --- Bad ids and malformed JSON
    for (const badId of ["abc", "0", "-1", "1.5", "1e3"]) {
        res = await call("GET", `/api/records/${badId}`);
        check(`GET invalid id "${badId}": 400 JSON message`, res.status === 400 && hasMessage(res), `status ${res.status}`);
    }
    res = await call("PUT", "/api/records/abc", changed);
    check("PUT invalid id: 400", res.status === 400 && hasMessage(res));
    res = await call("DELETE", "/api/records/abc");
    check("DELETE invalid id: 400", res.status === 400 && hasMessage(res));

    res = await call("POST", "/api/records", '{"title": "broken', true);
    check("POST malformed JSON: 400 JSON message", res.status === 400 && hasMessage(res), `status ${res.status}`);

    // --- Valid id that does not exist
    for (const missing of ["2000000000", "99999999999"]) {
        res = await call("GET", `/api/records/${missing}`);
        check(`GET missing id ${missing}: 404`, res.status === 404 && hasMessage(res), `status ${res.status}`);
    }
    res = await call("PUT", "/api/records/2000000000", changed);
    check("PUT missing id: 404 (does not create)", res.status === 404 && hasMessage(res));
    res = await call("DELETE", "/api/records/2000000000");
    check("DELETE missing id: 404", res.status === 404 && hasMessage(res));

    res = await call("GET", "/api/nothing-here");
    check("Unknown route: 404 JSON message", res.status === 404 && hasMessage(res));

    // --- Delete, then confirm it is gone
    res = await call("DELETE", `/api/records/${id}`);
    check('DELETE: 200 and {"message":"Record deleted."}', res.status === 200 && res.json?.message === "Record deleted.");
    res = await call("GET", `/api/records/${id}`);
    check("GET the deleted id: 404", res.status === 404);

    res = await call("GET", "/api/records");
    check("Record count is back to the start (invalid POSTs created nothing)", Array.isArray(res.json) && res.json.length === startCount, `${res.json?.length} vs ${startCount}`);

    console.log(`\n${passed} passed, ${failed} failed`);
    console.log("Manual test still to do: create a record, restart the service, then GET it (see README).");
    process.exit(failed === 0 ? 0 : 1);
}

main().catch((error) => {
    console.error("Test run stopped:", error.message);
    process.exit(1);
});
