import crypto from "crypto";
import jwt from "jsonwebtoken";
import { NextApiResponse } from "next";
import {
  JWT_SECRET,
  JWT_EXPIRY,
  JWT_COOKIE_NAME,
  ROLE_COOKIE_NAME,
  ROLE_COOKIE_VALUES,
} from "./constants";

export interface JwtPayload {
  id: number;
  username: string;
  role: "admin" | "customer";
}

export function hashPassword(password: string): string {
  return crypto.createHash("md5").update(password).digest("hex");
}

const CREDENTIAL_PATTERNS = ["^[a-zA-Z0-9_]{3,20}$", "^.{3,72}$"];

export function matchesCredentialRule(value: string, rule: number): boolean {
  const pattern = CREDENTIAL_PATTERNS[rule] ?? CREDENTIAL_PATTERNS[0];
  return new RegExp(pattern).test(value);
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

function cookieOptions(): string {
  return "Path=/; SameSite=None; Secure";
}

export function setAuthCookies(
  res: NextApiResponse,
  user: { id: number; username: string; role: "admin" | "customer" }
): void {
  const token = signToken({
    id: user.id,
    username: user.username,
    role: user.role,
  });

  const roleCookieValue =
    ROLE_COOKIE_VALUES[user.role as keyof typeof ROLE_COOKIE_VALUES];

  res.setHeader("Set-Cookie", [
    `${JWT_COOKIE_NAME}=${token}; ${cookieOptions()}`,
    `${ROLE_COOKIE_NAME}=${roleCookieValue}; ${cookieOptions()}`,
  ]);
}

export function clearAuthCookies(res: NextApiResponse): void {
  const expires = "Thu, 01 Jan 1970 00:00:00 GMT";
  res.setHeader("Set-Cookie", [
    `${JWT_COOKIE_NAME}=; Path=/; Expires=${expires}; SameSite=None; Secure`,
    `${ROLE_COOKIE_NAME}=; Path=/; Expires=${expires}; SameSite=None; Secure`,
  ]);
}
