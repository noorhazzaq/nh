import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { name, message } = req.body;
    const entry = { name, message, timestamp: Date.now() };

    // simpan data dengan key unik
    await kv.set(`entry:${Date.now()}`, entry);

    res.status(200).json({ status: "ok", data: entry });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}