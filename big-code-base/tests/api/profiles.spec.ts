import { test, expect } from "@playwright/test";

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

async function makeProfilePublic(
  request: import("@playwright/test").APIRequestContext,
  username: string,
  password: string,
  displayName?: string,
  address?: string
) {
  await loginAs(request, username, password);
  const body: Record<string, unknown> = { profile_public: 1 };
  if (displayName) body.display_name = displayName;
  if (address) body.address = address;
  await request.put("/api/profile/edit", { data: body });
}

test.describe("Public Profiles API", () => {
  test.beforeEach(async ({ request }) => {
    await resetApp(request);
  });

  test("returns profiles where profile_public = 1", async ({ request }) => {
    await makeProfilePublic(request, "bob", "password", "Bob Builder");

    await loginAs(request, "alice", "alice1");
    const res = await request.get("/api/profiles");
    expect(res.ok()).toBeTruthy();

    const profiles = await res.json();
    expect(profiles.length).toBeGreaterThanOrEqual(1);
    const bob = profiles.find(
      (p: Record<string, unknown>) => p.username === "bob"
    );
    expect(bob).toBeDefined();
    expect(bob.profile_public).toBe(1);
  });

  test("response includes balance field", async ({ request }) => {
    await makeProfilePublic(request, "bob", "password");

    await loginAs(request, "alice", "alice1");
    const res = await request.get("/api/profiles");
    const profiles = await res.json();
    const bob = profiles.find(
      (p: Record<string, unknown>) => p.username === "bob"
    );
    expect(bob).toBeDefined();
    expect(bob.balance).toBeDefined();
    expect(typeof bob.balance).toBe("number");
  });

  test("single profile returns data for public profile", async ({
    request,
  }) => {
    await makeProfilePublic(request, "bob", "password", "Bob Builder");

    await loginAs(request, "alice", "alice1");
    const listRes = await request.get("/api/profiles");
    const profiles = await listRes.json();
    const bob = profiles.find(
      (p: Record<string, unknown>) => p.username === "bob"
    );

    const res = await request.get(`/api/profiles/${bob.id}`);
    expect(res.ok()).toBeTruthy();
    const profile = await res.json();
    expect(profile.username).toBe("bob");
    expect(profile.display_name).toBe("Bob Builder");
  });

  test("single profile returns 403 for private profile viewed by non-owner", async ({
    request,
  }) => {
    await loginAs(request, "alice", "alice1");

    const meRes = await request.get("/api/auth/me");
    const me = await meRes.json();

    await loginAs(request, "bob", "password");
    const res = await request.get(`/api/profiles/${me.id}`);
    expect(res.status()).toBe(403);
  });

  test("owner can view own private profile", async ({ request }) => {
    await loginAs(request, "bob", "password");
    const meRes = await request.get("/api/auth/me");
    const me = await meRes.json();

    const res = await request.get(`/api/profiles/${me.id}`);
    expect(res.ok()).toBeTruthy();
    const profile = await res.json();
    expect(profile.username).toBe("bob");
  });

  test("search returns matching profiles by username", async ({ request }) => {
    await makeProfilePublic(request, "bob", "password");

    await loginAs(request, "alice", "alice1");
    const res = await request.get("/api/profiles/search?q=bob");
    expect(res.ok()).toBeTruthy();
    const results = await res.json();
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(
      results.some((r: Record<string, unknown>) => r.username === "bob")
    ).toBeTruthy();
  });

  test("search returns matching profiles by display_name", async ({
    request,
  }) => {
    await makeProfilePublic(
      request,
      "bob",
      "password",
      "Robert the Great"
    );

    await loginAs(request, "alice", "alice1");
    const res = await request.get("/api/profiles/search?q=Robert");
    expect(res.ok()).toBeTruthy();
    const results = await res.json();
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  test("search returns matching profiles by address", async ({ request }) => {
    await makeProfilePublic(
      request,
      "bob",
      "password",
      "Bob",
      "123 Main Street"
    );

    await loginAs(request, "alice", "alice1");
    const res = await request.get("/api/profiles/search?q=Main%20Street");
    expect(res.ok()).toBeTruthy();
    const results = await res.json();
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  test("rejects unauthenticated requests with 401", async ({ request }) => {
    const res = await request.get("/api/profiles", {
      headers: { Cookie: "" },
    });
    expect(res.status()).toBe(401);
  });
});
