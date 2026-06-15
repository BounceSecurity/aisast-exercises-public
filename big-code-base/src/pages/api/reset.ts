import type { NextApiRequest, NextApiResponse } from "next";
import { resetDatabase } from "@/lib/db";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  resetDatabase();

  return res.status(200).json({ message: "Database reset successfully" });
}
