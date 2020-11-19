import express from "express";
import exphbs from "express-handlebars";
import bcrypt from 'bcrypt';

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

app.get('/register', (req, res) => {
  res.render('register')
})

app.post('/register', async (req, res) => {
  const db = await dbPromise;
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  const passwordHash = await bcrypt.hash(password, 10);
  try {
    await db.run('INSERT INTO Users (username, email, password) VALUES (?, ?, ?);',
      username,
      email,
      passwordHash
    )
  } catch (e) {
    return res.render('register', { error: e })
  }
  res.redirect('/');
})

app.post("/message", async (req, res) => {
  const db = await dbPromise;
  await db.run('INSERT INTO Messages (content) VALUES (?);', req.body.message)
  res.redirect("/");
});

const setup = async () => {
  const db = await dbPromise;
  await db.migrate();

  const users = await db.all('SELECT * FROM Users');
  console.log('started with users', users);

  app.listen(8080, () => {
    console.log("listening on http://localhost:8080");
  });
}

setup();