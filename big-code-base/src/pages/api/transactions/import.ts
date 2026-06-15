import type { NextApiRequest, NextApiResponse } from "next";
import { getCurrentUser } from "@/lib/middleware";
import { getDb } from "@/lib/db";
import { log } from "@/lib/logger";
import formidable from "formidable";
import fs from "fs";
import libxmljs, { Element } from "libxmljs2";

export const config = {
  api: {
    bodyParser: false,
  },
};

function createForm() {
  return formidable({ maxFileSize: 10 * 1024 * 1024 });
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
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const form = createForm();
    const [, files] = await form.parse(req);
    const fileArray = files.file;

    if (!fileArray || fileArray.length === 0) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const uploadedFile = fileArray[0];
    const xmlContent = fs.readFileSync(uploadedFile.filepath, "utf-8");

    const doc = libxmljs.parseXml(xmlContent, {
      noent: true,
      dtdload: true,
      dtdvalid: false,
      nonet: false,
    });

    const transactions = doc.find<Element>("//transaction");
    const db = getDb();

    const insert = db.prepare(
      "INSERT INTO transactions (from_user_id, to_account, amount, description, created_at) VALUES (?, ?, ?, ?, ?)"
    );

    const imported: Array<{
      date: string;
      recipient: string;
      amount: number;
      description: string;
    }> = [];

    const insertMany = db.transaction(
      (
        items: Array<{
          date: string;
          recipient: string;
          amount: number;
          description: string;
        }>
      ) => {
        for (const item of items) {
          const recipientUser = db
            .prepare("SELECT id FROM users WHERE username = ?")
            .get(item.recipient) as { id: number } | undefined;

          if (recipientUser) {
            db.prepare(
              "INSERT INTO transactions (from_user_id, to_user_id, amount, description, created_at) VALUES (?, ?, ?, ?, ?)"
            ).run(
              user.id,
              recipientUser.id,
              item.amount,
              item.description,
              item.date
            );
          } else {
            insert.run(
              user.id,
              item.recipient,
              item.amount,
              item.description,
              item.date
            );
          }
        }
      }
    );

    for (const txNode of transactions) {
      const dateNode = txNode.get<Element>("date");
      const recipientNode = txNode.get<Element>("recipient");
      const amountNode = txNode.get<Element>("amount");
      const descriptionNode = txNode.get<Element>("description");

      const date = dateNode ? dateNode.text() : new Date().toISOString().split("T")[0];
      const recipient = recipientNode ? recipientNode.text() : "";
      const amount = amountNode ? Math.round(parseFloat(amountNode.text()) * 100) : 0;
      const description = descriptionNode ? descriptionNode.text() : "";

      imported.push({ date, recipient, amount, description });
    }

    insertMany(imported);

    fs.unlinkSync(uploadedFile.filepath);

    log("INFO", `XML import by ${user.username}: ${imported.length} transactions`);

    return res.status(200).json({
      message: `Successfully imported ${imported.length} transactions`,
      count: imported.length,
      transactions: imported,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    log("ERROR", `Error in /api/transactions/import: ${message}`);
    return res.status(500).json({ error: "Failed to process XML file" });
  }
}
