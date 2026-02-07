const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

const filePath = path.join(__dirname, "data.json");

// Pastikan fail wujud
if (!fs.existsSync(filePath)) {
  fs.writeFileSync(filePath, JSON.stringify([]));
}

function addData(entry) {
  const data = JSON.parse(fs.readFileSync(filePath));
  data.push(entry);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function getAllData() {
  return JSON.parse(fs.readFileSync(filePath));
}

app.post("/save", (req, res) => {
  addData(req.body);
  res.json({ status: "ok", data: req.body });
});

app.get("/all", (req, res) => {
  res.json(getAllData());
});

// Serve frontend
app.use(express.static(path.join(__dirname)));

app.listen(process.env.PORT || 3000, () => console.log("Hazzaq Style API berjalan, data kekal dalam fail JSON"));