import type { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/middleware";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const id = Number(req.query.id);
  const currentUser = getCurrentUser(req);

  if (currentUser && currentUser.id === id) {
    return res.status(400).json({ error: "Cannot delete your own account" });
  }

  const db = getDb();
  const user = db.prepare("SELECT id FROM users WHERE id = ?").get(id);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  db.prepare("DELETE FROM users WHERE id = ?").run(id);

  return res.status(200).json({ message: "User deleted successfully" });
}
