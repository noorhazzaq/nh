import { put } from "@vercel/blob";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { name, message } = req.body;
    const entry = { name, message, timestamp: Date.now() };

    // Simpan data sebagai fail JSON baru dalam Blob
    const blob = await put(`hazzaq-${Date.now()}.json`, JSON.stringify(entry), {
      access: "public",
      contentType: "application/json"
    });

    res.status(200).json({ status: "ok", url: blob.url });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}