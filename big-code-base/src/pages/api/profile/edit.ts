import type { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/middleware";
import { log } from "@/lib/logger";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const currentUser = await getCurrentUser(req);

  if (!currentUser) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { display_name, profile_html, date_of_birth, phone, address, profile_public } = req.body;

  const db = getDb();
  db.prepare(
    `UPDATE users SET
      display_name = ?,
      profile_html = ?,
      date_of_birth = ?,
      phone = ?,
      address = ?,
      profile_public = ?,
      updated_at = datetime('now')
    WHERE id = ?`
  ).run(
    display_name ?? null,
    profile_html ?? null,
    date_of_birth ?? null,
    phone ?? null,
    address ?? null,
    profile_public ? 1 : 0,
    currentUser.id
  );

  log("INFO", `Profile updated: ${currentUser.username}`);

  const updated = db
    .prepare(
      "SELECT id, username, role, email, display_name, profile_html, profile_image, date_of_birth, phone, address, profile_public, created_at, updated_at FROM users WHERE id = ?"
    )
    .get(currentUser.id);

  return res.status(200).json(updated);
}
