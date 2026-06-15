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
    return res.status(401).json({ error: "Unauthorized" });
  }

  const db = getDb();

  const transactions = db
    .prepare(
      `SELECT
        t.id,
        t.from_user_id,
        t.to_user_id,
        t.to_account,
        t.amount,
        t.description,
        t.created_at,
        sender.username AS from_username,
        recipient.username AS to_username
      FROM transactions t
      LEFT JOIN users sender ON t.from_user_id = sender.id
      LEFT JOIN users recipient ON t.to_user_id = recipient.id
      WHERE t.from_user_id = ? OR t.to_user_id = ?
      ORDER BY t.created_at DESC`
    )
    .all(user.id, user.id);

  return res.status(200).json({ transactions });
}
