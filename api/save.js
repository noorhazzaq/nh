import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data.json");

export default function handler(req, res) {
  if (req.method === "POST") {
    const data = JSON.parse(fs.readFileSync(filePath));
    data.push(req.body);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    res.status(200).json({ status: "ok", data: req.body });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}