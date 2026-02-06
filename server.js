const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(express.json());

// Sambung ke Railway internal MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const DataSchema = new mongoose.Schema({ name: String, message: String });
const Data = mongoose.model("Data", DataSchema);

app.post("/save", async (req, res) => {
  const newData = new Data(req.body);
  await newData.save();
  res.json({ status: "ok", data: newData });
});

app.get("/all", async (req, res) => {
  const allData = await Data.find();
  res.json(allData);
});

// Serve frontend
app.use(express.static(path.join(__dirname)));

app.listen(process.env.PORT || 3000, () => console.log("Hazzaq Style API berjalan"));