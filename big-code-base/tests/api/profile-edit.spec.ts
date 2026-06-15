import { test, expect, request as playwrightRequest } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";

const BASE = "https://localhost:3000";

async function loginAsAdmin(request: APIRequestContext) {
  await request.post(`${BASE}/api/auth/login`, {
    data: { username: "admin", password: "admin123" },
  });
}

async function resetApp(request: APIRequestContext) {
  await loginAsAdmin(request);
  await request.post(`${BASE}/api/reset`);
}

async function loginAsBob(request: APIRequestContext) {
  const response = await request.post(`${BASE}/api/auth/login`, {
    data: { username: "bob", password: "password" },
  });
  expect(response.ok()).toBeTruthy();
  return response;
}

test.describe("Profile Edit API", () => {
  test.beforeAll(async ({ request }) => {
    await resetApp(request);
  });

  test("updates profile and returns updated data", async ({ request }) => {
    await loginAsBob(request);

    const res = await request.put(`${BASE}/api/profile/edit`, {
      data: {
        display_name: "Bobby Tables",
        profile_html: "<p>Hello world</p>",
        date_of_birth: "1990-05-15",
        phone: "+1234567890",
        address: "123 Main St",
        profile_public: true,
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.display_name).toBe("Bobby Tables");
    expect(body.profile_html).toBe("<p>Hello world</p>");
    expect(body.date_of_birth).toBe("1990-05-15");
    expect(body.phone).toBe("+1234567890");
    expect(body.address).toBe("123 Main St");
    expect(body.profile_public).toBe(1);
  });

  test("accepts HTML content in profile_html without stripping", async ({ request }) => {
    await loginAsBob(request);

    const htmlContent = '<div class="bio"><h2>About Me</h2><script>alert(1)</script></div>';
    const res = await request.put(`${BASE}/api/profile/edit`, {
      data: {
        profile_html: htmlContent,
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.profile_html).toBe(htmlContent);
  });

  test("accepts any display name without server-side profanity filter", async ({ request }) => {
    await loginAsBob(request);

    const res = await request.put(`${BASE}/api/profile/edit`, {
      data: {
        display_name: "damn fool idiot",
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.display_name).toBe("damn fool idiot");
  });

  test("accepts any string for date_of_birth, phone, address", async ({ request }) => {
    await loginAsBob(request);

    const res = await request.put(`${BASE}/api/profile/edit`, {
      data: {
        date_of_birth: "not-a-date",
        phone: "not-a-phone",
        address: "<script>alert('xss')</script>",
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.date_of_birth).toBe("not-a-date");
    expect(body.phone).toBe("not-a-phone");
    expect(body.address).toBe("<script>alert('xss')</script>");
  });

  test("rejects unauthenticated requests with 401", async () => {
    const freshContext = await playwrightRequest.newContext({
      ignoreHTTPSErrors: true,
    });
    const res = await freshContext.put(`${BASE}/api/profile/edit`, {
      data: { display_name: "test" },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Not authenticated");
    await freshContext.dispose();
  });
});

test.describe("Profile Image Upload API", () => {
  test.beforeAll(async ({ request }) => {
    await resetApp(request);
  });

  test("local upload accepts any file type and saves to uploads", async ({ request }) => {
    await loginAsBob(request);

    const fileContent = Buffer.from("<html><body>test</body></html>");
    const res = await request.post(`${BASE}/api/profile/image/upload`, {
      multipart: {
        file: {
          name: "test.html",
          mimeType: "text/html",
          buffer: fileContent,
        },
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.path).toMatch(/^\/uploads\/\d+_\d+\.html$/);
  });

  test("remote upload fetches from provided URL and saves locally", async ({ request }) => {
    await loginAsBob(request);

    const res = await request.post(`${BASE}/api/profile/image/remote`, {
      data: {
        url: `${BASE}/favicon.ico`,
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.path).toMatch(/^\/uploads\/\d+_\d+\.\w+$/);
  });

  test("image upload rejects unauthenticated requests with 401", async () => {
    const freshContext = await playwrightRequest.newContext({
      ignoreHTTPSErrors: true,
    });
    const res = await freshContext.post(`${BASE}/api/profile/image/upload`, {
      multipart: {
        file: {
          name: "test.png",
          mimeType: "image/png",
          buffer: Buffer.from("fake-png"),
        },
      },
    });
    expect(res.status()).toBe(401);
    await freshContext.dispose();
  });

  test("remote upload rejects unauthenticated requests with 401", async () => {
    const freshContext = await playwrightRequest.newContext({
      ignoreHTTPSErrors: true,
    });
    const res = await freshContext.post(`${BASE}/api/profile/image/remote`, {
      data: { url: "https://example.com/image.png" },
    });
    expect(res.status()).toBe(401);
    await freshContext.dispose();
  });
});
