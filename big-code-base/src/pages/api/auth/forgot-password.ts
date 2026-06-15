import type { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "@/lib/db";

interface UserRow {
  id: number;
  secret_question_1: string;
  secret_question_2: string;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username } = req.body;

  const db = getDb();

  const user = db
    .prepare("SELECT id, secret_question_1, secret_question_2 FROM users WHERE username = ?")
    .get(username) as UserRow | undefined;

  if (!user) {
    return res.status(400).json({ error: "User not found" });
  }

  return res.status(200).json({
    secretQuestion1: user.secret_question_1,
    secretQuestion2: user.secret_question_2,
  });
}
