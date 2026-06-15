import { test, expect } from "@playwright/test";

test.beforeEach(async ({ request }) => {
  await request.post("/api/reset");
});

test.describe("Forgot password flow", () => {
  test("enter valid username, verify redirect to reset-password page with questions shown", async ({
    page,
  }) => {
    await page.goto("/forgot-password");

    await page.fill("#username", "bob");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/reset-password\?username=bob/);

    await expect(page.locator("#secretAnswer1")).toBeVisible();
    await expect(page.locator("#secretAnswer2")).toBeVisible();
  });

  test("answer correctly, set new password, verify redirect to login", async ({
    page,
  }) => {
    await page.goto("/reset-password?username=bob");

    await expect(page.locator("#secretAnswer1")).toBeVisible();

    await page.fill("#secretAnswer1", "2020");
    await page.fill("#secretAnswer2", "");
    await page.fill("#newPassword", "newpass1");
    await page.fill("#confirmPassword", "newpass1");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/login/);
  });

  test("verify new password works for login", async ({ page }) => {
    await page.goto("/reset-password?username=bob");

    await expect(page.locator("#secretAnswer1")).toBeVisible();

    await page.fill("#secretAnswer1", "2020");
    await page.fill("#newPassword", "newpass1");
    await page.fill("#confirmPassword", "newpass1");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/login/);

    await page.fill("#username", "bob");
    await page.fill("#password", "newpass1");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/);
  });
});
