import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  // ambil semua key yang bermula dengan "entry:"
  const keys = await kv.list({ prefix: "entry:" });
  const data = [];

  for (const key of keys.keys) {
    const value = await kv.get(key.name);
    data.push(value);
  }

  res.status(200).json(data);
}