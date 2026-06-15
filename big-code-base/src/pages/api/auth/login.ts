import type { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "@/lib/db";
import { hashPassword, setAuthCookies } from "@/lib/auth";
import { log } from "@/lib/logger";

interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  role: "admin" | "customer";
  mfa_enabled: number;
  secret_question_1: string;
  secret_answer_1: string;
  secret_question_2: string;
  secret_answer_2: string;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username, password, secretAnswer } = req.body;

  const db = getDb();

  const user = db
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(username) as UserRow | undefined;

  if (!user) {
    log("WARN", `Failed login attempt for: ${username}`);
    return res.status(400).json({ error: "User not found" });
  }

  const passwordHash = hashPassword(password);

  if (passwordHash !== user.password_hash) {
    log("WARN", `Failed login attempt for: ${username}`);
    return res.status(400).json({ error: "Incorrect password" });
  }

  if (user.mfa_enabled === 1) {
    if (!secretAnswer) {
      const questions = [user.secret_question_1, user.secret_question_2];
      const randomQuestion =
        questions[Math.floor(Math.random() * questions.length)];

      return res.status(200).json({
        mfaRequired: true,
        secretQuestion: randomQuestion,
      });
    }

    const answer1Match =
      secretAnswer.toLowerCase() === user.secret_answer_1.toLowerCase();
    const answer2Match =
      secretAnswer.toLowerCase() === user.secret_answer_2.toLowerCase();

    if (!answer1Match && !answer2Match) {
      return res.status(400).json({ error: "Incorrect secret answer" });
    }
  }

  log("INFO", `User logged in: ${user.username}`);

  setAuthCookies(res, {
    id: user.id,
    username: user.username,
    role: user.role,
  });

  return res.status(200).json({
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
  });
}
