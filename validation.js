/*
    ICT251 - Activity 7
    Request checks that follow the shared data agreement.
    Kept apart from the routes so the rules are easy to read and test.
*/

const STATUSES = ["Pending", "In progress", "Completed"];

const TEXT_RULES = {
    title:       { label: "Title",       min: 3, max: 80 },
    category:    { label: "Category",    min: 2, max: 40 },
    description: { label: "Description", min: 5, max: 300 }
};

// Largest value the INTEGER id column can hold
const MAX_ID = 2147483647;

/* An id in the URL must be a positive whole number. Returns a number or null. */
function parseId(value) {
    if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
        return null;
    }
    const id = Number(value);
    return Number.isSafeInteger(id) ? id : null;
}

/*
    Check the body sent by POST and PUT.
    Returns { values } with trimmed text, or { error } with a message.
    Any client-supplied id (or other extra field) is ignored.
*/
function validateRecord(body) {

    if (body === null || typeof body !== "object" || Array.isArray(body)) {
        return { error: "Request body must be a JSON object." };
    }

    const values = {};

    for (const [field, rule] of Object.entries(TEXT_RULES)) {
        const raw = body[field];

        if (raw === undefined || raw === null) {
            return { error: `${rule.label} is required.` };
        }
        if (typeof raw !== "string") {
            return { error: `${rule.label} must be text.` };
        }
        if (raw.includes("\u0000")) {
            return { error: `${rule.label} contains invalid characters.` };
        }

        const text = raw.trim();

        if (text.length < rule.min || text.length > rule.max) {
            return { error: `${rule.label} must have ${rule.min} to ${rule.max} characters.` };
        }
        values[field] = text;
    }

    if (body.status === undefined || body.status === null) {
        return { error: "Status is required." };
    }
    if (typeof body.status !== "string") {
        return { error: "Status must be text." };
    }

    const status = body.status.trim();

    if (!STATUSES.includes(status)) {
        return { error: "Status must be Pending, In progress or Completed." };
    }
    values.status = status;

    return { values };
}

module.exports = { STATUSES, MAX_ID, parseId, validateRecord };
