import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  const { rows } = await sql`SELECT * FROM doa ORDER BY tarikh DESC;`;
  res.json(rows);
}