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

test.describe("Admin customers page", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "admin", "admin123");
    await page.goto("/admin/customers");
    await expect(page.getByTestId("users-table")).toBeVisible();
  });

  test("all seed users are listed in the table", async ({ page }) => {
    await expect(page.getByTestId("user-row-admin")).toBeVisible();
    await expect(page.getByTestId("user-row-alice")).toBeVisible();
    await expect(page.getByTestId("user-row-bob")).toBeVisible();
    await expect(page.getByTestId("user-row-charlie")).toBeVisible();
  });

  test("delete alice removes her from the list", async ({ page }) => {
    page.on("dialog", (dialog) => dialog.accept());
    await page.getByTestId("delete-alice").click();
    await expect(page.getByTestId("user-row-alice")).not.toBeVisible();
  });

  test("toggle MFA for bob updates in table", async ({ page }) => {
    const bobRow = page.getByTestId("user-row-bob");
    await expect(bobRow.locator("td").nth(2)).toHaveText("Disabled");

    await page.getByTestId("toggle-mfa-bob").click();
    await expect(bobRow.locator("td").nth(2)).toHaveText("Enabled");
  });

  test("change bob role to admin updates in table", async ({ page }) => {
    const bobRow = page.getByTestId("user-row-bob");
    await expect(bobRow.locator("td").nth(1)).toHaveText("customer");

    await page.getByTestId("change-role-bob").click();
    await expect(bobRow.locator("td").nth(1)).toHaveText("admin");
  });

  test("reset password for bob shows success message", async ({ page }) => {
    await page.getByTestId("reset-password-bob").click();
    await page.getByTestId("password-input-bob").fill("newpass1");
    await page.getByTestId("password-submit-bob").click();
    await expect(page.getByTestId("message-bob")).toHaveText("Password updated");
  });

  test("Reset App restores seed users", async ({ page }) => {
    page.on("dialog", (dialog) => dialog.accept());
    await page.getByTestId("delete-alice").click();
    await expect(page.getByTestId("user-row-alice")).not.toBeVisible();

    await page.getByTestId("reset-app").click();
    await page.waitForURL("/");

    await login(page, "admin", "admin123");
    await page.goto("/admin/customers");
    await expect(page.getByTestId("users-table")).toBeVisible();
    await expect(page.getByTestId("user-row-admin")).toBeVisible();
    await expect(page.getByTestId("user-row-alice")).toBeVisible();
    await expect(page.getByTestId("user-row-bob")).toBeVisible();
    await expect(page.getByTestId("user-row-charlie")).toBeVisible();
  });
});
