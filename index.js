import express from "express";
import exphbs from "express-handlebars";

import sqlite3 from "sqlite3";
import { open } from "sqlite";

const dbPromise = open({
  filename: "data.db",
  driver: sqlite3.Database,
});

const app = express();

app.engine("handlebars", exphbs());
app.set("view engine", "handlebars");

app.use(express.urlencoded({ extended: false }));

app.get("/", async (req, res) => {
  const db = await dbPromise;
  const messages = await db.all('SELECT * FROM Messages');
  res.render("home", { messages });
});

app.post("/message", async (req, res) => {
  const db = await dbPromise;
  await db.run('INSERT INTO Messages (content) VALUES (?);', req.body.message)
  res.redirect("/");
});

const setup = async () => {
  const db = await dbPromise;
  await db.migrate();

  const messages = await db.all('SELECT * FROM Messages');
  console.log('started with messages', messages);

  app.listen(8080, () => {
    console.log("listening on http://localhost:8080");
  });
}

setup();