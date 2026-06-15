import { test, expect } from "@playwright/test";

const BASE = "https://localhost:3000";

// MFA users authenticate with a secret answer. Either secret answer is
// accepted, so we always supply the first one regardless of which question
// the server randomly presents.
const MFA_ANSWERS: Record<string, string> = {
  alice: "Globex Corp",
  charlie: "Johnson",
};

async function login(
  page: import("@playwright/test").Page,
  username: string,
  password: string
) {
  await page.goto("/login");
  await page.fill("#username", username);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
  if (MFA_ANSWERS[username]) {
    await expect(page.locator("#secretAnswer")).toBeVisible();
    await page.fill("#secretAnswer", MFA_ANSWERS[username]);
    await page.click('button[type="submit"]');
  }
  await page.waitForURL(/\/dashboard/);
}

async function loginAsAdmin(
  request: import("@playwright/test").APIRequestContext
) {
  await request.post(`${BASE}/api/auth/login`, {
    data: { username: "admin", password: "admin123" },
  });
}

async function resetApp(
  request: import("@playwright/test").APIRequestContext
) {
  await loginAsAdmin(request);
  await request.post("/api/reset");
}

async function setProfilePublic(
  request: import("@playwright/test").APIRequestContext,
  username: string,
  password: string,
  displayName?: string
) {
  await request.post(`${BASE}/api/auth/login`, {
    data: { username, password },
  });
  const body: Record<string, unknown> = {
    profile_public: 1,
    profile_html: "<p>Hello from my profile!</p>",
  };
  if (displayName) body.display_name = displayName;
  await request.put("/api/profile/edit", { data: body });
}

test.describe("Public Profiles UI", () => {
  test.beforeEach(async ({ request }) => {
    await resetApp(request);
  });

  test("set profile to public, verify it appears in public profiles list", async ({
    page,
    request,
  }) => {
    await setProfilePublic(request, "bob", "password", "Bob Builder");

    await login(page, "alice", "alice1");
    await page.goto("/profiles");

    const profilesList = page.getByTestId("profiles-list");
    await expect(profilesList).toBeVisible();
    await expect(
      page.getByTestId("profile-card-bob")
    ).toBeVisible();
  });

  test("view individual public profile, verify HTML content renders", async ({
    page,
    request,
  }) => {
    await setProfilePublic(request, "bob", "password", "Bob Builder");

    await login(page, "alice", "alice1");
    await page.goto("/profiles");

    await page.getByTestId("profile-card-bob").click();
    await page.waitForURL(/\/profile\/\d+/);

    const htmlContent = page.getByTestId("profile-html-content");
    await expect(htmlContent).toBeVisible();
    await expect(htmlContent).toContainText("Hello from my profile!");
  });

  test("private profiles do not appear in public list", async ({
    page,
    request,
  }) => {
    await setProfilePublic(request, "bob", "password", "Bob Builder");

    await login(page, "alice", "alice1");
    await page.goto("/profiles");

    await expect(
      page.getByTestId("profile-card-bob")
    ).toBeVisible();
    await expect(
      page.getByTestId("profile-card-charlie")
    ).not.toBeVisible();
  });

  test("search for profiles by username, verify results", async ({
    page,
    request,
  }) => {
    await setProfilePublic(request, "bob", "password", "Bob Builder");

    await login(page, "alice", "alice1");
    await page.goto("/profiles");

    await page.getByTestId("profile-search-input").fill("bob");
    await page.waitForTimeout(500);

    await expect(
      page.getByTestId("profile-card-bob")
    ).toBeVisible();
  });

  test("search for profiles by display name, verify results", async ({
    page,
    request,
  }) => {
    await setProfilePublic(
      request,
      "bob",
      "password",
      "UniqueDisplayName123"
    );

    await login(page, "alice", "alice1");
    await page.goto("/profiles");

    await page.getByTestId("profile-search-input").fill("UniqueDisplayName123");
    await page.waitForTimeout(500);

    await expect(
      page.getByTestId("profile-card-bob")
    ).toBeVisible();
  });
});
