import type { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/middleware";
import { log } from "@/lib/logger";

interface PendingTransfer {
  id: number;
  user_id: number;
  recipient: string;
  amount: number;
  description: string | null;
}

interface UserRow {
  id: number;
  username: string;
  balance: number;
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

  const { transfer_id } = req.body;

  if (!transfer_id) {
    return res.status(400).json({ error: "Transfer ID is required" });
  }

  const db = getDb();

  const pending = db
    .prepare("SELECT id, user_id, recipient, amount, description FROM pending_transfers WHERE id = ?")
    .get(transfer_id) as PendingTransfer | undefined;

  if (!pending) {
    return res.status(404).json({ error: "Pending transfer not found" });
  }

  if (pending.user_id !== user.id) {
    log("WARN", `Transfer confirm failed for: ${user.username} - unauthorized access to transfer ${transfer_id}`);
    return res.status(403).json({ error: "Unauthorized" });
  }

  const { recipient, amount, description } = pending;

  const sender = db
    .prepare("SELECT id, username, balance FROM users WHERE id = ?")
    .get(user.id) as UserRow | undefined;

  if (!sender) {
    log("ERROR", `Transfer confirm failed for: ${user.username} - sender not found`);
    return res.status(404).json({ error: "Sender account not found" });
  }

  const recipientUser = db
    .prepare("SELECT id, username, balance FROM users WHERE username = ?")
    .get(recipient) as UserRow | undefined;

  if (recipientUser) {
    db.prepare("UPDATE users SET balance = balance - ? WHERE id = ?").run(
      amount,
      sender.id
    );
    db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(
      amount,
      recipientUser.id
    );

    const result = db
      .prepare(
        "INSERT INTO transactions (from_user_id, to_user_id, amount, description) VALUES (?, ?, ?, ?)"
      )
      .run(sender.id, recipientUser.id, amount, description);

    db.prepare("DELETE FROM pending_transfers WHERE id = ?").run(pending.id);

    const updatedSender = db
      .prepare("SELECT balance FROM users WHERE id = ?")
      .get(sender.id) as { balance: number };

    log("INFO", `Transfer: ${user.username} sent ${amount} to ${recipient}`);

    return res.status(200).json({
      balance: updatedSender.balance,
      transaction: {
        id: result.lastInsertRowid,
        from_user_id: sender.id,
        to_user_id: recipientUser.id,
        amount,
        description,
      },
    });
  } else {
    db.prepare("UPDATE users SET balance = balance - ? WHERE id = ?").run(
      amount,
      sender.id
    );

    const result = db
      .prepare(
        "INSERT INTO transactions (from_user_id, to_account, amount, description) VALUES (?, ?, ?, ?)"
      )
      .run(sender.id, recipient, amount, description);

    db.prepare("DELETE FROM pending_transfers WHERE id = ?").run(pending.id);

    const updatedSender = db
      .prepare("SELECT balance FROM users WHERE id = ?")
      .get(sender.id) as { balance: number };

    log("INFO", `Transfer: ${user.username} sent ${amount} to ${recipient}`);

    return res.status(200).json({
      balance: updatedSender.balance,
      transaction: {
        id: result.lastInsertRowid,
        from_user_id: sender.id,
        to_account: recipient,
        amount,
        description,
      },
    });
  }
}
