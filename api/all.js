import { get } from "@vercel/blob";

export default async function handler(req, res) {
  try {
    const response = await get("hazzaq-data.json");
    if (!response) {
      return res.status(200).json([]);
    }
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(200).json([]);
  }
}