import type { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import {
  SECRET_QUESTIONS,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
} from "@/lib/constants";
import { log } from "@/lib/logger";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    username,
    password,
    confirmPassword,
    secretQuestion1,
    secretAnswer1,
    secretQuestion2,
    secretAnswer2,
  } = req.body;

  if (
    !username ||
    !password ||
    !confirmPassword ||
    !secretQuestion1 ||
    !secretAnswer1 ||
    !secretQuestion2 ||
    !secretAnswer2
  ) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match" });
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return res.status(400).json({
      error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
    });
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    return res.status(400).json({
      error: `Password must be at most ${PASSWORD_MAX_LENGTH} characters`,
    });
  }

  if (secretQuestion1 === secretQuestion2) {
    return res
      .status(400)
      .json({ error: "Secret questions must be different" });
  }

  if (!SECRET_QUESTIONS.includes(secretQuestion1)) {
    return res.status(400).json({ error: "Invalid secret question" });
  }

  if (!SECRET_QUESTIONS.includes(secretQuestion2)) {
    return res.status(400).json({ error: "Invalid secret question" });
  }

  const db = getDb();
  const trimmedUsername = username.trim();

  const existingUser = db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get(trimmedUsername) as { id: number } | undefined;

  if (existingUser) {
    return res.status(400).json({ error: "Username already exists" });
  }

  const passwordHash = hashPassword(password);

  const duplicateUser = db
    .prepare("SELECT username FROM users WHERE password_hash = ?")
    .get(passwordHash) as { username: string } | undefined;

  if (duplicateUser) {
    return res.status(400).json({
      error: `You cannot create this password because user ${duplicateUser.username} is already using this password.`,
    });
  }

  db.prepare(
    `INSERT INTO users (username, password_hash, role, mfa_enabled, secret_question_1, secret_answer_1, secret_question_2, secret_answer_2)
     VALUES (?, ?, 'customer', 0, ?, ?, ?, ?)`
  ).run(
    trimmedUsername,
    passwordHash,
    secretQuestion1,
    secretAnswer1,
    secretQuestion2,
    secretAnswer2
  );

  log("INFO", `New user registered: ${trimmedUsername}`);

  return res.status(201).json({ message: "Account created successfully" });
}
