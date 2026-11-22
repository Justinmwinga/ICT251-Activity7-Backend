-- ICT251 Activity 7: eight made-up starting records.
-- Inserts only when the table is empty, so running it twice adds nothing.

INSERT INTO records (title, category, description, status)
SELECT v.title, v.category, v.description, v.status
FROM (VALUES
    ('Unable to connect to Wi-Fi',            'Network',  'The computer cannot connect to the university Wi-Fi network.',          'Pending'),
    ('Computer running slowly',               'Hardware', 'The computer takes too long to start and open applications.',          'In progress'),
    ('Microsoft Office installation',         'Software', 'Microsoft Office needs to be installed on the laboratory computer.',   'Completed'),
    ('Network cable not working',             'Network',  'The Ethernet cable does not provide a network connection.',            'Pending'),
    ('Keyboard malfunction',                  'Hardware', 'Several keyboard keys are not responding when pressed.',               'In progress'),
    ('Browser installation',                  'Software', 'A modern web browser needs to be installed on the computer.',          'Completed'),
    ('Internet connection keeps disconnecting','Network', 'The internet connection disconnects repeatedly during use.',           'Pending'),
    ('Monitor display problem',               'Hardware', 'The monitor occasionally displays a black screen.',                    'In progress')
) AS v(title, category, description, status)
WHERE NOT EXISTS (SELECT 1 FROM records);
