import type { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from "@/lib/constants";
import { log } from "@/lib/logger";

interface UserRow {
  id: number;
  username: string;
  secret_answer_1: string;
  secret_answer_2: string;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username, secretAnswer1, secretAnswer2, newPassword, confirmPassword } =
    req.body;

  const db = getDb();

  const user = db
    .prepare("SELECT id, username, secret_answer_1, secret_answer_2 FROM users WHERE username = ?")
    .get(username) as UserRow | undefined;

  if (!user) {
    return res.status(400).json({ error: "User not found" });
  }

  const answer1Correct =
    secretAnswer1 &&
    secretAnswer1.toLowerCase() === user.secret_answer_1.toLowerCase();
  const answer2Correct =
    secretAnswer2 &&
    secretAnswer2.toLowerCase() === user.secret_answer_2.toLowerCase();

  if (!answer1Correct && !answer2Correct) {
    return res.status(400).json({ error: "Incorrect secret answer" });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match" });
  }

  if (newPassword.length < PASSWORD_MIN_LENGTH) {
    return res.status(400).json({
      error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
    });
  }

  if (newPassword.length > PASSWORD_MAX_LENGTH) {
    return res.status(400).json({
      error: `Password must be at most ${PASSWORD_MAX_LENGTH} characters`,
    });
  }

  const passwordHash = hashPassword(newPassword);

  const duplicateUser = db
    .prepare("SELECT username FROM users WHERE password_hash = ? AND id != ?")
    .get(passwordHash, user.id) as { username: string } | undefined;

  if (duplicateUser) {
    return res.status(400).json({
      error: `You cannot use this password because user ${duplicateUser.username} is already using this password.`,
    });
  }

  db.prepare(
    "UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(passwordHash, user.id);

  log("INFO", `Password reset for: ${user.username}`);

  return res.status(200).json({ message: "Password reset successfully" });
}
