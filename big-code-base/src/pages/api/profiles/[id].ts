import type { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/middleware";
import fs from "fs";
import path from "path";

interface ProfileRow {
  id: number;
  username: string;
  display_name: string | null;
  profile_image: string | null;
  profile_html: string | null;
  date_of_birth: string | null;
  phone: string | null;
  address: string | null;
  balance: number;
  profile_public: number;
  profile_template: string | null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const currentUser = await getCurrentUser(req);
  if (!currentUser) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { id } = req.query;
  const profileId = Number(id);

  if (isNaN(profileId)) {
    return res.status(400).json({ error: "Invalid profile ID" });
  }

  const db = getDb();
  const profile = db
    .prepare(
      "SELECT id, username, display_name, profile_image, profile_html, date_of_birth, phone, address, balance, profile_public, profile_template FROM users WHERE id = ?"
    )
    .get(profileId) as ProfileRow | undefined;

  if (!profile) {
    return res.status(404).json({ error: "Profile not found" });
  }

  if (!profile.profile_public && profile.id !== currentUser.id) {
    return res.status(403).json({ error: "This profile is private" });
  }

  const result: Record<string, unknown> = { ...profile };

  if (profile.profile_template) {
    const templatePath = path.join(process.cwd(), "public", profile.profile_template);
    if (fs.existsSync(templatePath)) {
      const code = fs.readFileSync(templatePath, "utf-8");
      try {
        const fn = new Function(code + '\nreturn typeof render === "function" ? render() : ""');
        result.template_content = fn();
      } catch {
        result.template_content = "";
      }
    }
  }

  return res.status(200).json(result);
}
