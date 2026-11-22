-- ICT251 Activity 7: records table for the IT Support Desk system.
-- Safe to run more than once.

CREATE TABLE IF NOT EXISTS records (
    id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title       TEXT NOT NULL
                CHECK (char_length(btrim(title))       BETWEEN 3 AND 80),
    category    TEXT NOT NULL
                CHECK (char_length(btrim(category))    BETWEEN 2 AND 40),
    description TEXT NOT NULL
                CHECK (char_length(btrim(description)) BETWEEN 5 AND 300),
    status      TEXT NOT NULL
                CHECK (status IN ('Pending', 'In progress', 'Completed'))
);
