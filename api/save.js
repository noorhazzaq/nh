import { put, get } from "@vercel/blob";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { name, message } = req.body;
    const entry = { name, message, timestamp: Date.now() };

    // Ambil fail utama dari Blob
    let current = [];
    try {
      const response = await get("hazzaq-data.json");
      if (response) {
        current = await response.json();
      }
    } catch {
      current = [];
    }

    // Tambah entry baru
    current.push(entry);

    // Simpan semula ke Blob
    await put("hazzaq-data.json", JSON.stringify(current, null, 2), {
      access: "public",
      contentType: "application/json"
    });

    res.status(200).json({ status: "ok", data: entry });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}