import type { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "@/lib/db";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const db = getDb();
  const users = db
    .prepare(
      "SELECT id, username, role, mfa_enabled, secret_question_1, secret_answer_1, secret_question_2, secret_answer_2, created_at, updated_at FROM users"
    )
    .all();

  return res.status(200).json({ users });
}
