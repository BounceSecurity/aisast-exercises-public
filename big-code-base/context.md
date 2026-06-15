### SARIF Finding Accuracy Validation

#### Application context

This is a Next.js banking web app (TypeScript). The notes below describe the trust model to apply when validating a finding. They are orientation, not a list of vulnerabilities — verify everything against the code.

#### Where untrusted input enters

- API handlers under `src/pages/api/**`: request body, query, route params, headers, cookies.
- File uploads (multipart): both the file content and the client-supplied filename.
- User-stored values (e.g. profile fields, uploaded paths) later read back from the database.

#### Identity and auth

- Authentication is JWT/cookie based; the "current user" is derived from a token. Confirm how identity values are produced and validated before trusting them — do not assume a field such as a user id is a trustworthy integer.

Keep analysis scoped to the specific finding under review.
