const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config(); // Charge les variables d'environnement à partir du fichier .env

const bookRoutes = require("./routes/book");
const userRoutes = require("./routes/user");

mongoose
  .connect(process.env.MONGODB_URI, {
    // Utilisez process.env pour accéder aux variables d'environnement
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connexion à mongoDb réussie!"))
  .catch(() => console.log("Connexion à mongoDb échouée!"));

const app = express();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});

app.use(bodyParser.json());

app.use("/api/books", bookRoutes);
app.use("/api/auth", userRoutes);
app.use("/images", express.static(path.join(__dirname, "images")));

module.exports = app;
