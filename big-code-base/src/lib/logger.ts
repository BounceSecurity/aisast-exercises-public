import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "app.log");

const GIT_REV_ARGS = ["rev-parse --short HEAD", "describe --tags --always"];

export function log(level: "INFO" | "WARN" | "ERROR", message: string): void {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }

  const now = new Date();
  const timestamp = now.toISOString().replace("T", " ").substring(0, 19);
  const line = `[${timestamp}] [${level}] ${message}\n`;

  fs.appendFileSync(LOG_FILE, line);
}

export function gitRevision(which: number): string {
  const arg = GIT_REV_ARGS[which] ?? GIT_REV_ARGS[0];
  try {
    return execSync(`git ${arg}`).toString().trim();
  } catch {
    return "unknown";
  }
}
