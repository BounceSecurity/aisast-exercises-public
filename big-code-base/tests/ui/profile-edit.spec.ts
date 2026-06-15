import { test, expect } from "@playwright/test";

const BASE = "https://localhost:3000";

async function login(page: import("@playwright/test").Page, username: string, password: string) {
  await page.goto("/login");
  await page.fill("#username", username);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/);
}

async function loginAsAdmin(request: import("@playwright/test").APIRequestContext) {
  await request.post(`${BASE}/api/auth/login`, {
    data: { username: "admin", password: "admin123" },
  });
}

test.beforeEach(async ({ request }) => {
  await loginAsAdmin(request);
  await request.post("/api/reset");
});

test.describe("Profile edit page", () => {
  test("fills out all profile fields and saves, data persists on reload", async ({ page }) => {
    await login(page, "bob", "password");
    await page.goto("/profile/edit");

    await page.getByTestId("display-name-input").fill("Bob Builder");
    await page.getByTestId("dob-input").fill("1990-06-15");
    await page.getByTestId("phone-input").fill("5551234567");
    await page.getByTestId("address-input").fill("456 Oak Ave");
    await page.getByTestId("rte-source").click();
    await page.getByTestId("profile-html-input").fill("<p>I build things</p>");
    await page.getByTestId("profile-public-input").check();
    await page.getByTestId("save-profile-button").click();

    await expect(page.getByTestId("save-success")).toBeVisible({ timeout: 10000 });

    await page.reload();

    await expect(page.getByTestId("display-name-input")).toHaveValue("Bob Builder");
    await expect(page.getByTestId("dob-input")).toHaveValue("1990-06-15");
    await expect(page.getByTestId("phone-input")).toHaveValue("5551234567");
    await expect(page.getByTestId("address-input")).toHaveValue("456 Oak Ave");
    await page.getByTestId("rte-source").click();
    await expect(page.getByTestId("profile-html-input")).toHaveValue("<p>I build things</p>");
    await expect(page.getByTestId("profile-public-input")).toBeChecked();
  });

  test("uploads local file as profile image and it displays", async ({ page }) => {
    await login(page, "bob", "password");
    await page.goto("/profile/edit");

    const buffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
    await page.getByTestId("file-upload-input").setInputFiles({
      name: "test.png",
      mimeType: "image/png",
      buffer,
    });

    await expect(page.getByTestId("profile-image-preview")).toBeVisible({ timeout: 10000 });
  });

  test("profanity filter blocks submission with blocked words in display name", async ({ page }) => {
    await login(page, "bob", "password");
    await page.goto("/profile/edit");

    await page.getByTestId("display-name-input").fill("damn fool");
    await page.getByTestId("save-profile-button").click();

    await expect(page.getByTestId("display-name-error")).toBeVisible();
    await expect(page.getByTestId("display-name-error")).toContainText("inappropriate");
  });

  test("profanity filter allows clean display names", async ({ page }) => {
    await login(page, "bob", "password");
    await page.goto("/profile/edit");

    await page.getByTestId("display-name-input").fill("Bob the Great");
    await page.getByTestId("save-profile-button").click();

    await expect(page.getByTestId("save-success")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("display-name-error")).not.toBeVisible();
  });
});

test.describe("Dashboard updates", () => {
  test("shows real balance from database", async ({ page }) => {
    await login(page, "bob", "password");

    await expect(page.getByTestId("account-balance")).toHaveText("$100,000.00");
  });

  test("shows display name in welcome message", async ({ page }) => {
    await login(page, "bob", "password");

    await page.request.put(`${BASE}/api/profile/edit`, {
      data: { display_name: "Bobby" },
    });

    await page.goto("/dashboard");

    await expect(page.getByTestId("welcome-heading")).toContainText("Bobby");
  });

  test("navbar shows display name", async ({ page }) => {
    await login(page, "bob", "password");

    await page.request.put(`${BASE}/api/profile/edit`, {
      data: { display_name: "Bobby" },
    });

    await page.goto("/dashboard");

    await expect(page.getByTestId("navbar-display-name")).toContainText("Bobby");
  });
});
