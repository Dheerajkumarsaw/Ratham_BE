const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const route = require("../routes")

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose
  .connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
  })
  .then(() => console.log("MongoDB is connected"))
  .catch((err) => console.log(err.message));

app.use("/", route)

app.listen(process.env.PORT, function () {
  console.log("Express app is Running on port ", process.env.PORT);
});
