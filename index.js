import express from "express";
import exphbs from "express-handlebars";
import bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';

import sqlite3 from "sqlite3";
import { open } from "sqlite";

import { grantAuthToken, lookupUserFromAuthToken } from "./auth";

export const dbPromise = open({
  filename: "data.db",
  driver: sqlite3.Database,
});

const app = express();

app.engine("handlebars", exphbs());
app.set("view engine", "handlebars");

app.use(cookieParser())
app.use(express.urlencoded({ extended: false }));
app.use('/static', express.static(__dirname + '/static'));

app.use(async (req, res, next) => {
  const { authToken } = req.cookies;
  if (!authToken) {
    return next();
  }
  try {
    const user = await lookupUserFromAuthToken(authToken)
    req.user = user;
  } catch (e) {
    next(e);
  }
  next();
})

app.get("/", async (req, res) => {
  const db = await dbPromise;
  console.log('request user', req.user);
  const messages = await db.all('SELECT * FROM Messages;');
  res.render("home", { messages });
});

app.get('/register', (req, res) => {
  res.render('register')
})

app.get('/login', (req, res) => {
  res.render('login')
})

app.post('/register', async (req, res) => {
  const db = await dbPromise;
  const {
    username,
    email,
    password
  } = req.body;
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

app.post('/login', async (req, res) => {
  const db = await dbPromise;
  const {
    email,
    password
  } = req.body;
  try {
    const existingUser = await db.get("SELECT * FROM USERS WHERE email=?", email);
    if (!existingUser) {
      throw 'Incorrect login';
    }
    const passwordsMatch = await bcrypt.compare(password, existingUser.password);
    if (!passwordsMatch) {
      throw 'Incorrect login';
    }
    const token = await grantAuthToken(existingUser.id)
    res.cookie('authToken', token);
    res.redirect('/');
  } catch (e) {
    return res.render('login', { error: e })
  }
})

app.post("/message", async (req, res) => {
  const db = await dbPromise;
  await db.run('INSERT INTO Messages (content) VALUES (?);', req.body.message)
  res.redirect("/");
});

const setup = async () => {
  const db = await dbPromise;
  await db.migrate();

  const tokens = await db.all('SELECT * FROM AuthTokens');
  console.log('started with tokens', tokens);

  app.listen(8080, () => {
    console.log("listening on http://localhost:8080");
  });
}

setup();