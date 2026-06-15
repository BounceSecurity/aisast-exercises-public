import { test, expect } from "@playwright/test";

test.beforeEach(async ({ request }) => {
  await request.post("/api/reset");
});

test.describe("Registration flow", () => {
  test("fill form, register successfully, verify redirect to /login", async ({
    page,
  }) => {
    await page.goto("/register");

    await page.fill("#username", "newuser");
    await page.fill("#password", "test123");
    await page.fill("#confirmPassword", "test123");
    await page.selectOption("#secretQuestion1", {
      index: 1,
    });
    await page.fill("#secretAnswer1", "answer one");
    await page.selectOption("#secretQuestion2", {
      index: 2,
    });
    await page.fill("#secretAnswer2", "answer two");

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/login/);
  });

  test("paste is disabled on password fields", async ({ page }) => {
    await page.goto("/register");

    const passwordField = page.locator("#password");
    await passwordField.focus();
    await passwordField.evaluate((el: HTMLInputElement) => {
      const pasteEvent = new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData: new DataTransfer(),
      });
      pasteEvent.clipboardData!.setData("text/plain", "pastedtext");
      el.dispatchEvent(pasteEvent);
    });
    await expect(passwordField).toHaveValue("");

    const confirmField = page.locator("#confirmPassword");
    await confirmField.focus();
    await confirmField.evaluate((el: HTMLInputElement) => {
      const pasteEvent = new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData: new DataTransfer(),
      });
      pasteEvent.clipboardData!.setData("text/plain", "pastedtext");
      el.dispatchEvent(pasteEvent);
    });
    await expect(confirmField).toHaveValue("");
  });

  test("selecting same question twice shows error", async ({ page }) => {
    await page.goto("/register");

    await page.fill("#username", "newuser");
    await page.fill("#password", "test123");
    await page.fill("#confirmPassword", "test123");
    await page.selectOption("#secretQuestion1", {
      index: 1,
    });
    await page.fill("#secretAnswer1", "answer one");
    await page.selectOption("#secretQuestion2", {
      index: 1,
    });
    await page.fill("#secretAnswer2", "answer two");

    await page.click('button[type="submit"]');

    await expect(
      page.locator("text=Please select two different secret questions")
    ).toBeVisible();
  });

  test("duplicate password hash error shows other user's name", async ({
    page,
  }) => {
    await page.goto("/register");

    await page.fill("#username", "newuser");
    await page.fill("#password", "password");
    await page.fill("#confirmPassword", "password");
    await page.selectOption("#secretQuestion1", {
      index: 1,
    });
    await page.fill("#secretAnswer1", "answer one");
    await page.selectOption("#secretQuestion2", {
      index: 2,
    });
    await page.fill("#secretAnswer2", "answer two");

    await page.click('button[type="submit"]');

    await expect(page.getByTestId("error-message")).toContainText("bob");
  });

  test("password too short shows validation error", async ({ page }) => {
    await page.goto("/register");

    await page.fill("#username", "newuser");
    await page.fill("#password", "ab");
    await page.fill("#confirmPassword", "ab");
    await page.selectOption("#secretQuestion1", {
      index: 1,
    });
    await page.fill("#secretAnswer1", "answer one");
    await page.selectOption("#secretQuestion2", {
      index: 2,
    });
    await page.fill("#secretAnswer2", "answer two");

    await page.click('button[type="submit"]');

    await expect(page.getByTestId("error-message")).toContainText(
      "at least 3 characters"
    );
  });

  test("password too long is prevented by maxLength", async ({ page }) => {
    await page.goto("/register");

    const passwordField = page.locator("#password");
    await passwordField.fill("12345678901234");
    const value = await passwordField.inputValue();
    expect(value.length).toBeLessThanOrEqual(10);
  });
});
