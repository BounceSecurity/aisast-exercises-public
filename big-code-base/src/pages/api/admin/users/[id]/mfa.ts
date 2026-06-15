import type { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "@/lib/db";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const id = Number(req.query.id);
  const { enabled } = req.body;

  const db = getDb();
  const user = db.prepare("SELECT id FROM users WHERE id = ?").get(id);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  db.prepare("UPDATE users SET mfa_enabled = ?, updated_at = datetime('now') WHERE id = ?").run(
    enabled ? 1 : 0,
    id
  );

  return res.status(200).json({ message: "MFA updated", mfaEnabled: enabled });
}
