import type { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/middleware";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const db = getDb();
  const profiles = db
    .prepare(
      "SELECT id, username, display_name, profile_image, profile_html, date_of_birth, phone, address, balance, profile_public FROM users WHERE profile_public = 1"
    )
    .all();

  return res.status(200).json(profiles);
}
