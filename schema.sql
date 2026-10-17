CREATE TABLE IF NOT EXISTS delegates (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL COLLATE NOCASE,
  grade TEXT,
  committee TEXT,
  country TEXT
);

CREATE INDEX IF NOT EXISTS delegates_name_idx ON delegates(name COLLATE NOCASE);
