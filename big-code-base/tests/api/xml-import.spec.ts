import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import os from "os";

const BASE = "https://localhost:3000";

async function loginAs(
  request: import("@playwright/test").APIRequestContext,
  username: string,
  password: string
) {
  const res = await request.post(`${BASE}/api/auth/login`, {
    data: { username, password },
  });
  expect(res.ok()).toBeTruthy();
}

async function resetApp(request: import("@playwright/test").APIRequestContext) {
  await loginAs(request, "admin", "admin123");
  await request.post("/api/reset");
}

function createTempXmlFile(content: string): string {
  const tmpDir = os.tmpdir();
  const filePath = path.join(tmpDir, `test-import-${Date.now()}.xml`);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

test.describe("XML Import API", () => {
  test.beforeEach(async ({ request }) => {
    await resetApp(request);
  });

  test("schema endpoint returns valid XSD content", async ({ request }) => {
    await loginAs(request, "bob", "password");
    const res = await request.get("/api/transactions/schema");
    expect(res.ok()).toBeTruthy();

    const contentType = res.headers()["content-type"];
    expect(contentType).toContain("application/xml");

    const body = await res.text();
    expect(body).toContain("xs:schema");
    expect(body).toContain("transaction");
    expect(body).toContain("xs:element");
  });

  test("import valid XML: inserts transactions, returns count", async ({
    request,
  }) => {
    await loginAs(request, "bob", "password");

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
      const res = await request.post("/api/transactions/import", {
        multipart: {
          file: {
            name: "transactions.xml",
            mimeType: "application/xml",
            buffer: fs.readFileSync(filePath),
          },
        },
      });

      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body.count).toBe(2);
      expect(body.transactions).toHaveLength(2);
    } finally {
      fs.unlinkSync(filePath);
    }
  });

  test("imported transactions appear in user transaction history", async ({
    request,
  }) => {
    await loginAs(request, "bob", "password");

    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<transactions>
  <transaction>
    <date>2024-03-01</date>
    <recipient>Test Vendor</recipient>
    <amount>500.00</amount>
    <description>Test import entry</description>
  </transaction>
</transactions>`;

    const filePath = createTempXmlFile(xmlContent);

    try {
      const importRes = await request.post("/api/transactions/import", {
        multipart: {
          file: {
            name: "transactions.xml",
            mimeType: "application/xml",
            buffer: fs.readFileSync(filePath),
          },
        },
      });
      expect(importRes.ok()).toBeTruthy();

      const historyRes = await request.get("/api/transactions");
      expect(historyRes.ok()).toBeTruthy();
      const history = await historyRes.json();
      expect(history.transactions.length).toBeGreaterThanOrEqual(1);

      const imported = history.transactions.find(
        (t: Record<string, unknown>) => t.description === "Test import entry"
      );
      expect(imported).toBeDefined();
    } finally {
      fs.unlinkSync(filePath);
    }
  });

  test("rejects unauthenticated requests with 401", async ({ request }) => {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<transactions>
  <transaction>
    <date>2024-01-15</date>
    <recipient>Test</recipient>
    <amount>100.00</amount>
    <description>Test</description>
  </transaction>
</transactions>`;

    const filePath = createTempXmlFile(xmlContent);

    try {
      const res = await request.post("/api/transactions/import", {
        headers: { Cookie: "" },
        multipart: {
          file: {
            name: "transactions.xml",
            mimeType: "application/xml",
            buffer: fs.readFileSync(filePath),
          },
        },
      });
      expect(res.status()).toBe(401);
    } finally {
      fs.unlinkSync(filePath);
    }
  });
});
