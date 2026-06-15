import type { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/middleware";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const query = (req.query.q as string) || "";

  if (!query.trim()) {
    return res.status(200).json([]);
  }

  const db = getDb();
  const results = db
    .prepare(
      `SELECT id, username, display_name, profile_image, date_of_birth, phone, address, balance FROM users WHERE profile_public = 1 AND (username LIKE '%${query}%' OR display_name LIKE '%${query}%' OR address LIKE '%${query}%')`
    )
    .all();

  return res.status(200).json(results);
}
