import express from "express";
import exphbs from "express-handlebars";

import sqlite3 from "sqlite3";
import { open } from "sqlite";

const dbPromise = open({
  filename: "data.db",
  driver: sqlite3.Database,
});

const app = express();

let messages = [];

app.engine("handlebars", exphbs());
app.set("view engine", "handlebars");

app.use(express.urlencoded());

app.get("/", (req, res) => {
  res.render("home", { messages });
});

app.post("/message", (req, res) => {
  messages.push(req.body.message);
  res.redirect("/");
});

app.listen(8080, () => {
  console.log("listening on http://localhost:8080");
});
