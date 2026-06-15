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

test.describe("Dashboard page", () => {
  test("customer sees welcome message, details, and account info", async ({ page }) => {
    await login(page, "bob", "password");

    await expect(page.locator("h1")).toContainText("Welcome, bob");
    await expect(page.getByTestId("user-username")).toHaveText("bob");
    await expect(page.getByTestId("user-role")).toHaveText("customer");
    await expect(page.getByTestId("user-mfa")).toHaveText("Disabled");
    await expect(page.getByTestId("account-number")).toHaveText("#1234-5678");
    await expect(page.getByTestId("account-balance")).toHaveText("$100,000.00");
  });

  test("admin sees Manage Customers link", async ({ page }) => {
    await login(page, "admin", "admin123");

    await expect(page.locator("h1")).toContainText("Welcome, admin");
    const manageLink = page.getByRole("link", { name: "Manage Customers" });
    await expect(manageLink).toBeVisible();
  });

  test("unauthenticated user is redirected to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL("/login");
    expect(page.url()).toContain("/login");
  });
});
