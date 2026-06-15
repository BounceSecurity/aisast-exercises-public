import type { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/middleware";
import { log } from "@/lib/logger";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { recipient, amount, description } = req.body;

  if (!recipient || amount === undefined || amount === null) {
    log("WARN", `Transfer initiation failed for: ${user.username} - missing fields`);
    return res.status(400).json({ error: "Recipient and amount are required" });
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount)) {
    log("WARN", `Transfer initiation failed for: ${user.username} - invalid amount`);
    return res.status(400).json({ error: "Invalid amount" });
  }

  const db = getDb();

  const result = db
    .prepare(
      "INSERT INTO pending_transfers (user_id, recipient, amount, description) VALUES (?, ?, ?, ?)"
    )
    .run(user.id, recipient, numAmount, description || null);

  return res.status(200).json({
    transfer_id: result.lastInsertRowid,
    requires_confirmation: Math.abs(numAmount) > 10000,
  });
}
