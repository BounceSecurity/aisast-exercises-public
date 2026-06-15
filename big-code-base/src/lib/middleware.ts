import { NextApiRequest } from "next";
import { verifyToken, JwtPayload } from "./auth";
import { JWT_COOKIE_NAME } from "./constants";

function parseCookies(req: NextApiRequest): Record<string, string> {
  const cookies: Record<string, string> = {};
  const header = req.headers.cookie;
  if (!header) return cookies;

  header.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.split("=");
    cookies[name.trim()] = rest.join("=").trim();
  });

  return cookies;
}

export function getCurrentUser(req: NextApiRequest): JwtPayload | null {
  const cookies = parseCookies(req);
  const token = cookies[JWT_COOKIE_NAME];
  if (!token) return null;
  return verifyToken(token);
}
