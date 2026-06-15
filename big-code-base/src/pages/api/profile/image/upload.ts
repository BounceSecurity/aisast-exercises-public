import type { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/middleware";
import formidable from "formidable";
import fs from "fs";
import path from "path";

export const config = {
  api: {
    bodyParser: false,
  },
};

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

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const form = formidable({
    uploadDir: uploadsDir,
    keepExtensions: true,
  });

  const [, files] = await form.parse(req);

  const fileArray = files.file;
  if (!fileArray || fileArray.length === 0) {
    return res.status(400).json({ error: "No file provided" });
  }

  const uploadedFile = fileArray[0];
  const originalName = uploadedFile.originalFilename || "upload";
  const ext = path.extname(originalName) || ".bin";
  const timestamp = Date.now();
  const newFilename = path.basename(`${currentUser.id}_${timestamp}${ext}`);
  const newPath = path.join(uploadsDir, newFilename);

  fs.renameSync(uploadedFile.filepath, newPath);

  const imagePath = `/uploads/${newFilename}`;

  const db = getDb();
  db.prepare(
    "UPDATE users SET profile_image = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(imagePath, currentUser.id);

  return res.status(200).json({ path: imagePath });
}
