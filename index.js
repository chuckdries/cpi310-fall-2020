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
    return next({
      message: e,
      status: 500
    });
  }
  next();
})

app.get("/", async (req, res) => {
  const db = await dbPromise;
  const messages = await db.all(`SELECT
    Messages.id,
    Messages.content,
    Users.username as authorName
  FROM Messages LEFT JOIN Users WHERE Messages.authorId = Users.id`);
  console.log('messages', messages);
  res.render("home", { messages, user: req.user });
});

app.get('/register', (req, res) => {
  if (req.user) {
    return res.redirect('/')
  }
  res.render('register')
})

app.get('/login', (req, res) => {
  if (req.user) {
    return res.redirect('/')
  }
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
    const user = await db.get('SELECT id FROM Users WHERE email=?', email);
    const token = await grantAuthToken(user.id)
    res.cookie('authToken', token);
    res.redirect('/');
  } catch (e) {
    return res.render('register', { error: e })
  }
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
  if (!req.user) {
    res.status(401)
    return res.send('must be logged in to post messages')
  }
  const db = await dbPromise;
  await db.run('INSERT INTO Messages (content, authorId) VALUES (?, ?);',
    req.body.message, req.user.id)
  res.redirect("/");
});

// throw 404 error - it's important this is _below_ all the normal routes
app.use((req, res, next) => {
  next({
    status: 404,
    message: `${req.path} not found`
  })
})

// handle all errors
app.use((err, req, res, next) => {
  res.status(err.status || 500)
  console.log(err);
  res.render('errorPage', {error: err.message || err})
})

const setup = async () => {
  const db = await dbPromise;
  await db.migrate();

  app.listen(8080, () => {
    console.log("listening on http://localhost:8080");
  });
}

setup();