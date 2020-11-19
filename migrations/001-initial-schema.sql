-- Up
CREATE TABLE Messages (
  id INTEGER PRIMARY KEY,
  authorId INTEGER,
  content STRING
);

CREATE TABLE Users (
  id INTEGER PRIMARY KEY,
  email STRING UNIQUE,
  username STRING,
  password STRING
);

-- Down
DROP TABLE Messages;
DROP TABLE Users;
