import { list, get } from "@vercel/blob";

export default async function handler(req, res) {
  // Senarai semua blob dengan prefix "hazzaq-"
  const blobs = await list({ prefix: "hazzaq-" });
  const data = [];

  for (const blob of blobs.blobs) {
    const response = await fetch(blob.url);
    const value = await response.json();
    data.push(value);
  }

  res.status(200).json(data);
}