@AGENTS.md

# NoHackMeBank

## Stack

- Next.js 16 (Pages Router) + TypeScript
- Tailwind CSS v4
- SQLite via better-sqlite3
- JWT via jsonwebtoken
- Playwright for testing

## Commands

- `npm run dev` — starts dev server on https://localhost:3000 (self-signed cert, accept browser warning)
- `npm run build` — production build
- `npm test` — run Playwright tests

## Database

SQLite database file created automatically on first run. Reset to seed state via `/api/reset` endpoint or the Reset App button in the admin panel.

## Seed Users

| Username | Password | Role     | MFA | Balance |
|----------|----------|----------|-----|---------|
| admin    | admin123 | admin    | off | 100,000 |
| alice    | alice1   | customer | on  | 100,000 |
| bob      | password | customer | off | 100,000 |
| charlie  | chuck1   | customer | on  | 100,000 |
