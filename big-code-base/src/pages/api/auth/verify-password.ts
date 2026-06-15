import type { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/middleware";
import { hashPassword } from "@/lib/auth";

interface UserRow {
  id: number;
  password_hash: string;
}

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

  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }

  const db = getDb();

  const dbUser = db
    .prepare("SELECT id, password_hash FROM users WHERE id = ?")
    .get(user.id) as UserRow | undefined;

  if (!dbUser) {
    return res.status(404).json({ error: "User not found" });
  }

  const valid = hashPassword(password) === dbUser.password_hash;

  return res.status(200).json({ valid });
}
