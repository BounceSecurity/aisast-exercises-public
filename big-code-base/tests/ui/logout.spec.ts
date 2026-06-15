import { test, expect } from "@playwright/test";

test.beforeEach(async ({ request }) => {
  await request.post("/api/reset");
});

test.describe("Logout flow", () => {
  test("login, then visit /logout, verify redirect to landing page", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.fill("#username", "bob");
    await page.fill("#password", "password");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto("/logout");

    await expect(page).toHaveURL("/");
  });

  test("verify cookies are cleared after logout", async ({ page }) => {
    await page.goto("/login");

    await page.fill("#username", "bob");
    await page.fill("#password", "password");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto("/logout");
    await expect(page).toHaveURL("/");

    const cookies = await page.context().cookies();
    const tokenCookie = cookies.find((c) => c.name === "token");
    const roleCookie = cookies.find((c) => c.name === "ui_setting");

    expect(
      !tokenCookie || tokenCookie.value === ""
    ).toBeTruthy();
    expect(
      !roleCookie || roleCookie.value === ""
    ).toBeTruthy();
  });
});
