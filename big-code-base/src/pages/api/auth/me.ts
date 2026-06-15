import type { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/middleware";

interface UserRow {
  id: number;
  username: string;
  role: string;
  mfa_enabled: number;
  secret_question_1: string;
  secret_question_2: string;
  email: string | null;
  balance: number;
  display_name: string | null;
  profile_image: string | null;
  profile_html: string | null;
  date_of_birth: string | null;
  phone: string | null;
  address: string | null;
  profile_public: number;
  profile_template: string | null;
  created_at: string;
  updated_at: string;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const currentUser = getCurrentUser(req);

  if (!currentUser) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const db = getDb();

  const user = db
    .prepare(
      "SELECT id, username, role, mfa_enabled, secret_question_1, secret_question_2, email, balance, display_name, profile_image, profile_html, date_of_birth, phone, address, profile_public, profile_template, created_at, updated_at FROM users WHERE id = ?"
    )
    .get(currentUser.id) as UserRow | undefined;

  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  return res.status(200).json(user);
}
