import { test, expect } from "@playwright/test";

const BASE = "https://localhost:3000";

async function loginAsAdmin(request: import("@playwright/test").APIRequestContext) {
  const response = await request.post(`${BASE}/api/auth/login`, {
    data: { username: "admin", password: "admin123" },
  });
  expect(response.ok()).toBeTruthy();
}

async function getUsers(request: import("@playwright/test").APIRequestContext) {
  const response = await request.get(`${BASE}/api/admin/users`);
  const body = await response.json();
  return body.users as Array<{ id: number; username: string; role: string; mfa_enabled: number }>;
}

async function findUser(request: import("@playwright/test").APIRequestContext, username: string) {
  const users = await getUsers(request);
  const user = users.find((u) => u.username === username);
  expect(user).toBeTruthy();
  return user!;
}

test.beforeEach(async ({ request }) => {
  await request.post(`${BASE}/api/reset`);
});

test.describe("Admin API", () => {
  test.describe("List users", () => {
    test("returns all 4 seed users", async ({ request }) => {
      const response = await request.get(`${BASE}/api/admin/users`);
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.users).toHaveLength(4);

      const usernames = body.users.map((u: { username: string }) => u.username);
      expect(usernames).toContain("admin");
      expect(usernames).toContain("alice");
      expect(usernames).toContain("bob");
      expect(usernames).toContain("charlie");
    });

    test("does not include password_hash", async ({ request }) => {
      const response = await request.get(`${BASE}/api/admin/users`);
      const body = await response.json();

      for (const user of body.users) {
        expect(user).not.toHaveProperty("password_hash");
      }
    });
  });

  test.describe("Delete user", () => {
    test("delete a customer successfully", async ({ request }) => {
      await loginAsAdmin(request);
      const bob = await findUser(request, "bob");

      const deleteResponse = await request.delete(`${BASE}/api/admin/users/${bob.id}`);
      expect(deleteResponse.status()).toBe(200);

      const users = await getUsers(request);
      const usernames = users.map((u) => u.username);
      expect(usernames).not.toContain("bob");
    });

    test("cannot delete self", async ({ request }) => {
      await loginAsAdmin(request);
      const admin = await findUser(request, "admin");

      const deleteResponse = await request.delete(`${BASE}/api/admin/users/${admin.id}`);
      expect(deleteResponse.status()).toBe(400);

      const body = await deleteResponse.json();
      expect(body.error).toBe("Cannot delete your own account");
    });
  });

  test.describe("Toggle MFA", () => {
    test("enable MFA for bob then disable", async ({ request }) => {
      await loginAsAdmin(request);
      const bob = await findUser(request, "bob");

      const enableResponse = await request.put(`${BASE}/api/admin/users/${bob.id}/mfa`, {
        data: { enabled: true },
      });
      expect(enableResponse.status()).toBe(200);
      const enableBody = await enableResponse.json();
      expect(enableBody.mfaEnabled).toBe(true);

      const disableResponse = await request.put(`${BASE}/api/admin/users/${bob.id}/mfa`, {
        data: { enabled: false },
      });
      expect(disableResponse.status()).toBe(200);
      const disableBody = await disableResponse.json();
      expect(disableBody.mfaEnabled).toBe(false);
    });
  });

  test.describe("Change role", () => {
    test("change alice to admin and back", async ({ request }) => {
      await loginAsAdmin(request);
      const alice = await findUser(request, "alice");

      const promoteResponse = await request.put(`${BASE}/api/admin/users/${alice.id}/role`, {
        data: { role: "admin" },
      });
      expect(promoteResponse.status()).toBe(200);
      expect((await promoteResponse.json()).role).toBe("admin");

      const demoteResponse = await request.put(`${BASE}/api/admin/users/${alice.id}/role`, {
        data: { role: "customer" },
      });
      expect(demoteResponse.status()).toBe(200);
      expect((await demoteResponse.json()).role).toBe("customer");
    });
  });

  test.describe("Reset password", () => {
    test("successfully reset password", async ({ request }) => {
      await loginAsAdmin(request);
      const bob = await findUser(request, "bob");

      const response = await request.put(`${BASE}/api/admin/users/${bob.id}/password`, {
        data: { newPassword: "newpass1" },
      });
      expect(response.status()).toBe(200);
      expect((await response.json()).message).toBe("Password updated");
    });

    test("reject too short password", async ({ request }) => {
      await loginAsAdmin(request);
      const bob = await findUser(request, "bob");

      const response = await request.put(`${BASE}/api/admin/users/${bob.id}/password`, {
        data: { newPassword: "ab" },
      });
      expect(response.status()).toBe(400);
    });

    test("reject too long password", async ({ request }) => {
      await loginAsAdmin(request);
      const bob = await findUser(request, "bob");

      const response = await request.put(`${BASE}/api/admin/users/${bob.id}/password`, {
        data: { newPassword: "abcdefghijk" },
      });
      expect(response.status()).toBe(400);
    });

    test("reject duplicate password hash naming other user", async ({ request }) => {
      await loginAsAdmin(request);
      const bob = await findUser(request, "bob");

      const response = await request.put(`${BASE}/api/admin/users/${bob.id}/password`, {
        data: { newPassword: "admin123" },
      });
      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body.error).toContain("admin");
      expect(body.error).toContain("already using this password");
    });
  });

  test.describe("Reset app", () => {
    test("POST /api/reset restores seed users", async ({ request }) => {
      await loginAsAdmin(request);
      const bob = await findUser(request, "bob");
      await request.delete(`${BASE}/api/admin/users/${bob.id}`);

      const resetResponse = await request.post(`${BASE}/api/reset`);
      expect(resetResponse.status()).toBe(200);

      const users = await getUsers(request);
      expect(users).toHaveLength(4);
      const usernames = users.map((u) => u.username);
      expect(usernames).toContain("bob");
    });
  });
});
