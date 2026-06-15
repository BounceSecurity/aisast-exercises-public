import type { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/middleware";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const currentUser = getCurrentUser(req);

  if (!currentUser) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { enabled } = req.body;

  const db = getDb();
  db.prepare("UPDATE users SET mfa_enabled = ?, updated_at = datetime('now') WHERE id = ?").run(
    enabled ? 1 : 0,
    currentUser.id
  );

  return res.status(200).json({ message: "MFA updated", mfaEnabled: enabled });
}
