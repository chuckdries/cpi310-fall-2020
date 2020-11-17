const express = require("express");
var exphbs = require("express-handlebars");

const app = express();

app.engine("handlebars", exphbs());
app.set("view engine", "handlebars");

app.get("/", (req, res) => {
  res.render("home", {
    name: "john"
  });
});

app.listen(8080, () => {
  console.log("listening on http://localhost:8080");
});
