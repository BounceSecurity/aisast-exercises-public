import { test, expect, request as playwrightRequest } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";

const BASE = "https://localhost:3000";

async function resetApp(request: APIRequestContext) {
  await request.post(`${BASE}/api/reset`);
}

async function loginAsBob(request: APIRequestContext) {
  const response = await request.post(`${BASE}/api/auth/login`, {
    data: { username: "bob", password: "password" },
  });
  expect(response.ok()).toBeTruthy();
  return response;
}

test.describe("Profile MFA API", () => {
  test.beforeAll(async ({ request }) => {
    await resetApp(request);
  });

  test("toggle MFA on and off as bob", async ({ request }) => {
    await loginAsBob(request);

    const enableResponse = await request.put(`${BASE}/api/profile/mfa`, {
      data: { enabled: true },
    });
    expect(enableResponse.status()).toBe(200);
    const enableBody = await enableResponse.json();
    expect(enableBody.message).toBe("MFA updated");
    expect(enableBody.mfaEnabled).toBe(true);

    const disableResponse = await request.put(`${BASE}/api/profile/mfa`, {
      data: { enabled: false },
    });
    expect(disableResponse.status()).toBe(200);
    const disableBody = await disableResponse.json();
    expect(disableBody.message).toBe("MFA updated");
    expect(disableBody.mfaEnabled).toBe(false);
  });

  test("returns 401 without authentication", async () => {
    const freshContext = await playwrightRequest.newContext({
      ignoreHTTPSErrors: true,
    });
    const response = await freshContext.put(`${BASE}/api/profile/mfa`, {
      data: { enabled: true },
    });
    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.error).toBe("Not authenticated");
    await freshContext.dispose();
  });
});
