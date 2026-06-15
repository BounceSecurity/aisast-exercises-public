import { test, expect } from "@playwright/test";

test.beforeEach(async ({ request }) => {
  await request.post("/api/reset");
});

test.describe("Login flow", () => {
  test("login as bob (no MFA), verify redirect to dashboard", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.fill("#username", "bob");
    await page.fill("#password", "password");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("login as alice (MFA), verify question appears, answer correctly, verify dashboard", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.fill("#username", "alice");
    await page.fill("#password", "alice1");
    await page.click('button[type="submit"]');

    await expect(page.locator("#secretAnswer")).toBeVisible();

    const questionText = await page
      .locator('label[for="secretAnswer"]')
      .textContent();
    expect(questionText).toBeTruthy();

    let answer = "";
    if (questionText?.includes("unpaid internship")) {
      answer = "Globex Corp";
    } else if (questionText?.includes("canceled TV show")) {
      answer = "Firefly";
    }

    await page.fill("#secretAnswer", answer);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("wrong username shows 'User not found'", async ({ page }) => {
    await page.goto("/login");

    await page.fill("#username", "nonexistent");
    await page.fill("#password", "whatever");
    await page.click('button[type="submit"]');

    await expect(page.getByTestId("error-message")).toContainText("User not found");
  });

  test("wrong password shows 'Incorrect password'", async ({ page }) => {
    await page.goto("/login");

    await page.fill("#username", "bob");
    await page.fill("#password", "wrongpass");
    await page.click('button[type="submit"]');

    await expect(page.getByTestId("error-message")).toContainText(
      "Incorrect password"
    );
  });

  test("wrong secret answer shows 'Incorrect secret answer'", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.fill("#username", "alice");
    await page.fill("#password", "alice1");
    await page.click('button[type="submit"]');

    await expect(page.locator("#secretAnswer")).toBeVisible();

    await page.fill("#secretAnswer", "wrong answer");
    await page.click('button[type="submit"]');

    await expect(page.getByTestId("error-message")).toContainText(
      "Incorrect secret answer"
    );
  });
});
