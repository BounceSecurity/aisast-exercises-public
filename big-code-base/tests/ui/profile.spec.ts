import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page, username: string, password: string) {
  await page.goto("/login");
  await page.fill("#username", username);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/);
}

test.beforeEach(async ({ request }) => {
  await request.post("/api/reset");
});

test.describe("Profile page", () => {
  test("displays username, role, and MFA toggle", async ({ page }) => {
    await login(page, "bob", "password");
    await page.goto("/profile");

    await expect(page.getByTestId("profile-username")).toHaveText("bob");
    await expect(page.getByTestId("profile-role")).toHaveText("customer");
    await expect(page.getByTestId("mfa-toggle")).toBeVisible();
    await expect(page.getByTestId("mfa-status")).toHaveText("MFA is disabled");
  });

  test("toggling MFA persists after reload", async ({ page }) => {
    await login(page, "bob", "password");
    await page.goto("/profile");

    await expect(page.getByTestId("mfa-status")).toHaveText("MFA is disabled");
    await page.getByTestId("mfa-toggle").click();
    await expect(page.getByTestId("mfa-status")).toHaveText("MFA is enabled");

    await page.reload();
    await expect(page.getByTestId("mfa-status")).toHaveText("MFA is enabled");

    await page.getByTestId("mfa-toggle").click();
    await expect(page.getByTestId("mfa-status")).toHaveText("MFA is disabled");
  });

  test("Change Password button navigates to /change-password", async ({ page }) => {
    await login(page, "bob", "password");
    await page.goto("/profile");

    await page.getByTestId("change-password-link").click();
    await page.waitForURL("/change-password");
    expect(page.url()).toContain("/change-password");
  });
});
