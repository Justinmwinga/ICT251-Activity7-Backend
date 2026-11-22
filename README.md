# Activity 7: IT Support Desk API

ICT251 Introduction to Web Technologies, Mulungushi University.
Student number 202500171. Independent Node.js + Express API with a PostgreSQL database.

## Which database? (read this first)

The Activity 7 brief says "SQLite" in several places, but its own code uses `pg`, `DATABASE_URL`, `$1` placeholders and `RETURNING`, which are PostgreSQL. This project follows the code. It also matters for hosting: Render's free web services lose local files (including a SQLite file) every time they restart or sleep, so SQLite there would fail the "record still exists after restart" test. If your lecturer insists on SQLite, ask for an approved equivalent (the brief allows one).

## Project structure

```text
activity7-backend/
├── server.js            Express app, middleware, GET /, GET /health, 404 and error handlers
├── routes/records.js    the five record routes
├── validation.js        the data-agreement rules (lengths, status, id)
├── db.js                PostgreSQL connection pool
├── guide.js             HTML for the API guide shown at GET /
├── schema.sql           creates the records table
├── seed.sql             8 made-up starting records (inserts only into an empty table)
├── scripts/setup-db.js  runs schema.sql + seed.sql   (npm run db:setup)
├── scripts/smoke-test.js  runs the Step 7 tests      (npm run test:api)
├── .env.example         copy to .env
└── .gitignore           excludes .env and node_modules
```

## Run it locally

1. Install an active Node.js LTS release. In PowerShell, use `npm.cmd` instead of `npm` if `npm.ps1` is blocked.
2. Create a database (see "Create the hosted database" below, then use its **External Database URL** locally; or install Postgres locally).
3. In this folder:
   ```bash
   npm install            # also creates package-lock.json: commit it
   cp .env.example .env   # Windows: copy .env.example .env   then edit DATABASE_URL
   npm run db:setup       # creates the table and the 8 starting records
   npm start              # http://localhost:3000
   ```
4. Open http://localhost:3000 (the guide), then http://localhost:3000/health.
5. In a second terminal: `npm run test:api` runs the whole Step 7 table automatically.

## Create the hosted database (Render)

1. Render dashboard → **New → Postgres**, plan **Free**, region near you.
2. When it is ready, copy the **External Database URL** (for your computer) and the **Internal Database URL** (for the web service).
3. On your computer, put the External URL in `.env` as `DATABASE_URL`, then run `npm run db:setup` once. This fills the hosted database.

Free plan limits (Render docs, checked 21 Nov 2026): the free database is 1 GB and **expires 30 days after creation** (then 14 days to upgrade before it is deleted), only one free database per workspace, and no backups. Keep it alive until marking is finished. The free web service sleeps after 15 minutes idle and takes about a minute to wake.

## Deploy the API (Render)

1. Create a GitHub repository containing this folder (with `package.json` and `package-lock.json`; **not** `.env` or `node_modules`).
2. Render → **New → Web Service** → connect the repository. If this folder sits inside another folder, set **Root Directory** to `activity7-backend`.
3. Runtime **Node**, build command `npm install`, start command `npm start`, instance type **Free**.
4. Environment variables:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | the **Internal** Database URL |
   | `CLIENT_ORIGINS` | `http://127.0.0.1:5500,http://localhost:5500` for now (Activity 8: add your Netlify origin) |
   | `PUBLIC_URL` | optional: your `https://….onrender.com` address, shown on the guide |

5. Deploy, read the logs, open the HTTPS URL. Check `/health`, then run:
   ```bash
   node scripts/smoke-test.js https://your-backend.onrender.com
   ```

Submit the base URL only, with no `/api/records` and no final slash.

## Test with Postman (Step 7)

For POST and PUT choose **Body → raw → JSON** (Postman sets `Content-Type: application/json`).

| Test | Expected |
|---|---|
| `GET /health` | 200, `"database":"connected"` |
| `GET /api/records` | 200 and an array |
| `POST /api/records` valid body | 201 and a new record. Save the `id` |
| `GET /api/records/<id>` | 200 and the same record |
| `PUT /api/records/<id>` all four fields | 200, new values, same id |
| `DELETE /api/records/<id>` | 200 `{"message":"Record deleted."}`; GET again gives 404 |
| `POST` with missing title or bad status | 400 and a message; nothing created |
| `GET /api/records/abc`, malformed JSON | 400 and a JSON message |
| `GET`/`PUT`/`DELETE` id `2000000000` | 404 each |

Body:

```json
{
  "title": "Printer offline",
  "category": "Hardware",
  "description": "The lab printer shows offline.",
  "status": "Pending"
}
```

**Persistence test (manual):** create a record, then restart the service (Render → Manual Deploy → Restart, or stop and `npm start` locally), then `GET` that record. It must still exist.

## Rules implemented

- Fields: `id` (generated by the database, never taken from the client), `title` 3–80, `category` 2–40, `description` 5–300, `status` exactly `Pending`, `In progress` or `Completed`.
- Text is checked as a string, trimmed, then length-checked. Missing values, spaces only, wrong lengths, wrong types and unknown statuses give 400. The database also enforces these rules with `CHECK` constraints.
- PUT replaces all four fields and never creates a record.
- Errors are JSON `{"message": "..."}`: 400 invalid input or malformed JSON, 404 missing record or route, 500 unexpected failure (details are logged on the server only), 503 from `/health` when the database does not respond.
- All SQL uses `$1`, `$2`… placeholders.

## Activity 8 (next)

Add your frontend's origin to `CLIENT_ORIGINS` in Render (scheme + host, no path, no final slash), restart the service, and put this API's URL in the frontend's `js/config.js`. In the frontend's Content-Security-Policy add `connect-src 'self' https://your-backend.onrender.com`.
