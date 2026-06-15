import type { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from "@/lib/constants";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const id = Number(req.query.id);
  const { newPassword } = req.body;

  if (
    !newPassword ||
    newPassword.length < PASSWORD_MIN_LENGTH ||
    newPassword.length > PASSWORD_MAX_LENGTH
  ) {
    return res.status(400).json({
      error: `Password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters`,
    });
  }

  const db = getDb();
  const user = db.prepare("SELECT id FROM users WHERE id = ?").get(id);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const newHash = hashPassword(newPassword);

  const duplicate = db
    .prepare("SELECT username FROM users WHERE password_hash = ? AND id != ?")
    .get(newHash, id) as { username: string } | undefined;

  if (duplicate) {
    return res.status(400).json({
      error: `You cannot use this password because user ${duplicate.username} is already using this password.`,
    });
  }

  db.prepare(
    "UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(newHash, id);

  return res.status(200).json({ message: "Password updated" });
}
