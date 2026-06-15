# NoHackMeBank

A banking web application built with Next.js.

## Quick Start

```bash
npm install
npx playwright install chromium
npm run dev
```

Open [https://localhost:3000](https://localhost:3000) in your browser and accept the self-signed certificate warning.

### HTTPS Certificate

The dev server runs over HTTPS. Generate a self-signed certificate:

```bash
mkdir -p certificates
openssl req -x509 -newkey rsa:2048 \
  -keyout certificates/localhost-key.pem \
  -out certificates/localhost.pem \
  -days 365 -nodes -subj "/CN=localhost"
```

## Default Users

| Username | Password | Role     |
|----------|----------|----------|
| admin    | admin123 | admin    |
| alice    | alice1   | customer |
| bob      | password | customer |
| charlie  | chuck1   | customer |

## Features

- User registration with secret questions
- Login with optional MFA
- Forgot password / reset password
- User profile with MFA toggle
- Profile editing with image upload (local and remote URL)
- Public profiles with search
- Fund transfers between accounts
- Transaction history
- XML transaction import
- Admin panel for user management

## Running Tests

```bash
npm test              # Run all Playwright tests
npx playwright test --ui  # Run tests with interactive UI
```

## Other Commands

```bash
npm run dev      # Start dev server (HTTPS)
npm run build    # Production build
npm start        # Start production server
```

## Tech Stack

- Next.js 16 (Pages Router) + TypeScript
- Tailwind CSS v4
- SQLite (better-sqlite3)
- JWT authentication
- Playwright for testing
