import type { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/middleware";
import fs from "fs";
import path from "path";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const currentUser = await getCurrentUser(req);

  if (!currentUser) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  try {
    const prevTlsSetting = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    let response: Response;
    try {
      response = await fetch(url);
    } finally {
      if (prevTlsSetting === undefined) {
        delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      } else {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = prevTlsSetting;
      }
    }

    if (!response.ok) {
      return res.status(400).json({ error: "Failed to fetch remote image" });
    }

    const urlPath = new URL(url).pathname;
    let ext = path.extname(urlPath);
    if (!ext) {
      ext = ".jpg";
    }

    const timestamp = Date.now();
    const newFilename = path.basename(`${currentUser.id}_${timestamp}${ext}`);
    const newPath = path.join(uploadsDir, newFilename);

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(newPath, buffer);

    const imagePath = `/uploads/${newFilename}`;

    const db = getDb();
    db.prepare(
      "UPDATE users SET profile_image = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(imagePath, currentUser.id);

    return res.status(200).json({ path: imagePath });
  } catch {
    return res.status(400).json({ error: "Failed to fetch remote image" });
  }
}
