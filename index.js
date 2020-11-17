const express = require("express");
var exphbs = require("express-handlebars");

const app = express();

app.engine("handlebars", exphbs());
app.set("view engine", "handlebars");

app.use(express.urlencoded());

app.get("/", (req, res) => {
  res.render("home");
});

app.post('/greet', (req, res) => {
  res.render('greet', { name: req.body.name });
})

app.listen(8080, () => {
  console.log("listening on http://localhost:8080");
});
