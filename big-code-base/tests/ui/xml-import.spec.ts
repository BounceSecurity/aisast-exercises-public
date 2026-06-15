import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import os from "os";

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

async function resetApp(
  request: import("@playwright/test").APIRequestContext
) {
  await loginAsAdmin(request);
  await request.post("/api/reset");
}

function createTempXmlFile(content: string): string {
  const tmpDir = os.tmpdir();
  const filePath = path.join(tmpDir, `test-ui-import-${Date.now()}.xml`);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

test.describe("XML Import UI", () => {
  test.beforeEach(async ({ request }) => {
    await resetApp(request);
  });

  test("download schema file link works", async ({ page }) => {
    await login(page, "bob", "password");
    await page.goto("/transactions/import");

    const downloadLink = page.getByTestId("download-schema");
    await expect(downloadLink).toBeVisible();

    const href = await downloadLink.getAttribute("href");
    expect(href).toBe("/api/transactions/schema");
  });

  test("upload valid XML file, verify success message with count", async ({
    page,
  }) => {
    await login(page, "bob", "password");
    await page.goto("/transactions/import");

    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<transactions>
  <transaction>
    <date>2024-01-15</date>
    <recipient>Alice Corp</recipient>
    <amount>250.00</amount>
    <description>Invoice payment</description>
  </transaction>
  <transaction>
    <date>2024-01-16</date>
    <recipient>Bob Services</recipient>
    <amount>100.00</amount>
    <description>Monthly subscription</description>
  </transaction>
</transactions>`;

    const filePath = createTempXmlFile(xmlContent);

    try {
      const fileInput = page.getByTestId("xml-file-input");
      await fileInput.setInputFiles(filePath);

      await page.getByTestId("import-submit").click();

      const successMessage = page.getByTestId("import-success");
      await expect(successMessage).toBeVisible({ timeout: 10000 });
      await expect(successMessage).toContainText("2 transactions");
    } finally {
      fs.unlinkSync(filePath);
    }
  });

  test("verify imported transactions appear in transaction history", async ({
    page,
  }) => {
    await login(page, "bob", "password");
    await page.goto("/transactions/import");

    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<transactions>
  <transaction>
    <date>2024-06-01</date>
    <recipient>History Test Vendor</recipient>
    <amount>999.00</amount>
    <description>History verification entry</description>
  </transaction>
</transactions>`;

    const filePath = createTempXmlFile(xmlContent);

    try {
      const fileInput = page.getByTestId("xml-file-input");
      await fileInput.setInputFiles(filePath);
      await page.getByTestId("import-submit").click();

      await expect(page.getByTestId("import-success")).toBeVisible({
        timeout: 10000,
      });

      await page.goto("/transactions");
      await expect(page.locator("text=History verification entry")).toBeVisible({
        timeout: 10000,
      });
    } finally {
      fs.unlinkSync(filePath);
    }
  });
});
