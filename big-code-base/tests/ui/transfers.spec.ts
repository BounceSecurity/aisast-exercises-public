import { test, expect } from "@playwright/test";

const BASE = "https://localhost:3000";

async function login(
  page: import("@playwright/test").Page,
  username: string,
  password: string
) {
  await page.goto("/login");
  await page.fill("#username", username);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/);
}

async function loginAsAdmin(
  request: import("@playwright/test").APIRequestContext
) {
  await request.post(`${BASE}/api/auth/login`, {
    data: { username: "admin", password: "admin123" },
  });
}

test.beforeEach(async ({ request }) => {
  await loginAsAdmin(request);
  await request.post(`${BASE}/api/reset`);
});

test.describe("Transfer page", () => {
  test("transfer funds to another user, verify success message and balance update", async ({
    page,
  }) => {
    await login(page, "bob", "password");
    await page.goto("/transfer");

    await page.getByTestId("transfer-recipient").fill("alice");
    await page.getByTestId("transfer-amount").fill("50");
    await page.getByTestId("transfer-description").fill("Test payment");
    await page.getByTestId("transfer-submit").click();

    await expect(page.getByTestId("transfer-success")).toBeVisible();
    await expect(page.getByTestId("transfer-success")).toContainText("alice");
  });

  test("transfer to external account, verify success", async ({ page }) => {
    await login(page, "bob", "password");
    await page.goto("/transfer");

    await page.getByTestId("transfer-recipient").fill("ext-account-999");
    await page.getByTestId("transfer-amount").fill("25");
    await page.getByTestId("transfer-description").fill("External payment");
    await page.getByTestId("transfer-submit").click();

    await expect(page.getByTestId("transfer-success")).toBeVisible();
  });

  test("large transfer (> 10,000) triggers password confirmation step", async ({
    page,
  }) => {
    await login(page, "bob", "password");
    await page.goto("/transfer");

    await page.getByTestId("transfer-recipient").fill("alice");
    await page.getByTestId("transfer-amount").fill("15000");
    await page.getByTestId("transfer-description").fill("Large transfer");
    await page.getByTestId("transfer-submit").click();

    await expect(page.getByTestId("confirm-dialog")).toBeVisible();
    await expect(page.getByTestId("confirm-recipient")).toHaveText("alice");
  });

  test("complete large transfer with correct password", async ({ page }) => {
    await login(page, "bob", "password");
    await page.goto("/transfer");

    await page.getByTestId("transfer-recipient").fill("alice");
    await page.getByTestId("transfer-amount").fill("15000");
    await page.getByTestId("transfer-description").fill("Large confirmed");
    await page.getByTestId("transfer-submit").click();

    await expect(page.getByTestId("confirm-dialog")).toBeVisible();
    await page.getByTestId("confirm-password").fill("password");
    await page.getByTestId("confirm-submit").click();

    await expect(page.getByTestId("transfer-success")).toBeVisible();
  });

  test("view transaction history after transfers, verify entries appear", async ({
    page,
    request,
  }) => {
    await loginAsAdmin(request);
    await request.post(`${BASE}/api/auth/login`, {
      data: { username: "bob", password: "password" },
    });
    const initiateRes = await request.post(`${BASE}/api/transfers/initiate`, {
      data: { recipient: "alice", amount: 1000, description: "API transfer" },
    });
    const initiateBody = await initiateRes.json();
    await request.post(`${BASE}/api/transfers/confirm`, {
      data: { transfer_id: initiateBody.transfer_id },
    });

    await login(page, "bob", "password");
    await page.goto("/transactions");

    await expect(page.getByTestId("transactions-table")).toBeVisible();
    await expect(page.locator("text=API transfer")).toBeVisible();
  });

  test("amount input only allows positive numbers in the UI", async ({
    page,
  }) => {
    await login(page, "bob", "password");
    await page.goto("/transfer");

    const amountInput = page.getByTestId("transfer-amount");
    await expect(amountInput).toHaveAttribute("min", "0.01");
    await expect(amountInput).toHaveAttribute("step", "0.01");
    await expect(amountInput).toHaveAttribute("type", "number");
  });
});
