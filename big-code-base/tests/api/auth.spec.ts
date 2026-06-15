import { test, expect } from "@playwright/test";

const BASE = "/api/auth";

const SECRET_QUESTIONS = [
  "What is the name of your least favorite child?",
  "In what year did you abandon your dreams?",
  "What is the maiden name of your father's mistress?",
  "At what age did your childhood pet run away?",
  "What was the name of your favorite unpaid internship?",
  "What is your ex-wife's newest last name?",
  "What sports team do you obsess over to avoid meaningful discussion with others?",
  "What is the name of your favorite canceled TV show?",
  "On what street did you lose your childlike sense of wonder?",
  "When did you stop trying?",
];

function newUser(overrides: Record<string, string> = {}) {
  return {
    username: "testuser",
    password: "test123",
    confirmPassword: "test123",
    secretQuestion1: SECRET_QUESTIONS[0],
    secretAnswer1: "Answer1",
    secretQuestion2: SECRET_QUESTIONS[1],
    secretAnswer2: "Answer2",
    ...overrides,
  };
}

test.describe("Registration", () => {
  test.beforeEach(async ({ request }) => {
    await request.post("/api/reset");
  });

  test("successful registration returns 201", async ({ request }) => {
    const res = await request.post(`${BASE}/register`, {
      data: newUser(),
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.message).toBe("Account created successfully");
  });

  test("duplicate username returns 400", async ({ request }) => {
    const res = await request.post(`${BASE}/register`, {
      data: newUser({ username: "bob" }),
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Username already exists");
  });

  test("duplicate password hash returns error containing other user's name", async ({
    request,
  }) => {
    const res = await request.post(`${BASE}/register`, {
      data: newUser({ password: "admin123", confirmPassword: "admin123" }),
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("admin");
    expect(body.error).toContain("is already using this password");
  });

  test("password too short returns 400", async ({ request }) => {
    const res = await request.post(`${BASE}/register`, {
      data: newUser({ password: "ab", confirmPassword: "ab" }),
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("at least");
  });

  test("password too long returns 400", async ({ request }) => {
    const res = await request.post(`${BASE}/register`, {
      data: newUser({
        password: "12345678901",
        confirmPassword: "12345678901",
      }),
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("at most");
  });

  test("missing fields returns 400", async ({ request }) => {
    const res = await request.post(`${BASE}/register`, {
      data: { username: "testuser" },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("required");
  });

  test("mismatched passwords returns 400", async ({ request }) => {
    const res = await request.post(`${BASE}/register`, {
      data: newUser({ confirmPassword: "different" }),
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("do not match");
  });

  test("same secret question twice returns 400", async ({ request }) => {
    const res = await request.post(`${BASE}/register`, {
      data: newUser({ secretQuestion2: SECRET_QUESTIONS[0] }),
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("different");
  });
});

test.describe("Login", () => {
  test.beforeEach(async ({ request }) => {
    await request.post("/api/reset");
  });

  test("successful login without MFA sets cookies and returns user", async ({
    request,
  }) => {
    const res = await request.post(`${BASE}/login`, {
      data: { username: "bob", password: "password" },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.user).toBeDefined();
    expect(body.user.username).toBe("bob");
    expect(body.user.role).toBe("customer");
    expect(body.user.id).toBeDefined();

    const cookies = res.headers()["set-cookie"];
    expect(cookies).toBeDefined();
    expect(cookies).toContain("token=");
    expect(cookies).toContain("ui_setting=");
  });

  test("login with MFA - first call returns mfaRequired and question", async ({
    request,
  }) => {
    const res = await request.post(`${BASE}/login`, {
      data: { username: "alice", password: "alice1" },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.mfaRequired).toBe(true);
    expect(body.secretQuestion).toBeDefined();
    expect(
      [
        "What was the name of your favorite unpaid internship?",
        "What is the name of your favorite canceled TV show?",
      ].includes(body.secretQuestion)
    ).toBeTruthy();
  });

  test("login with MFA - second call with correct answer succeeds", async ({
    request,
  }) => {
    const res = await request.post(`${BASE}/login`, {
      data: {
        username: "alice",
        password: "alice1",
        secretAnswer: "Globex Corp",
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.user).toBeDefined();
    expect(body.user.username).toBe("alice");
  });

  test("wrong username returns User not found", async ({ request }) => {
    const res = await request.post(`${BASE}/login`, {
      data: { username: "nonexistent", password: "anything" },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("User not found");
  });

  test("wrong password returns Incorrect password", async ({ request }) => {
    const res = await request.post(`${BASE}/login`, {
      data: { username: "bob", password: "wrongpassword" },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Incorrect password");
  });

  test("wrong secret answer returns Incorrect secret answer", async ({
    request,
  }) => {
    const res = await request.post(`${BASE}/login`, {
      data: {
        username: "alice",
        password: "alice1",
        secretAnswer: "wrong answer",
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Incorrect secret answer");
  });
});

test.describe("Forgot Password", () => {
  test.beforeEach(async ({ request }) => {
    await request.post("/api/reset");
  });

  test("valid username returns both secret questions", async ({ request }) => {
    const res = await request.post(`${BASE}/forgot-password`, {
      data: { username: "bob" },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.secretQuestion1).toBe(
      "In what year did you abandon your dreams?"
    );
    expect(body.secretQuestion2).toBe(
      "On what street did you lose your childlike sense of wonder?"
    );
  });

  test("unknown username returns error", async ({ request }) => {
    const res = await request.post(`${BASE}/forgot-password`, {
      data: { username: "nobody" },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("User not found");
  });
});

test.describe("Reset Password", () => {
  test.beforeEach(async ({ request }) => {
    await request.post("/api/reset");
  });

  test("success with correct Q1 answer", async ({ request }) => {
    const res = await request.post(`${BASE}/reset-password`, {
      data: {
        username: "bob",
        secretAnswer1: "2020",
        newPassword: "newpass1",
        confirmPassword: "newpass1",
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("Password reset successfully");

    const loginRes = await request.post(`${BASE}/login`, {
      data: { username: "bob", password: "newpass1" },
    });
    expect(loginRes.status()).toBe(200);
  });

  test("success with correct Q2 answer (case-insensitive)", async ({
    request,
  }) => {
    const res = await request.post(`${BASE}/reset-password`, {
      data: {
        username: "bob",
        secretAnswer2: "ELM STREET",
        newPassword: "newpass2",
        confirmPassword: "newpass2",
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("Password reset successfully");
  });

  test("both wrong answers returns error", async ({ request }) => {
    const res = await request.post(`${BASE}/reset-password`, {
      data: {
        username: "bob",
        secretAnswer1: "wrong",
        secretAnswer2: "also wrong",
        newPassword: "newpass1",
        confirmPassword: "newpass1",
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Incorrect secret answer");
  });

  test("reusing own password should succeed", async ({ request }) => {
    const res = await request.post(`${BASE}/reset-password`, {
      data: {
        username: "bob",
        secretAnswer1: "2020",
        newPassword: "password",
        confirmPassword: "password",
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("Password reset successfully");
  });

  test("duplicate hash against other user should fail naming them", async ({
    request,
  }) => {
    const res = await request.post(`${BASE}/reset-password`, {
      data: {
        username: "bob",
        secretAnswer1: "2020",
        newPassword: "admin123",
        confirmPassword: "admin123",
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("admin");
    expect(body.error).toContain("is already using this password");
  });
});

test.describe("Me", () => {
  test.beforeEach(async ({ request }) => {
    await request.post("/api/reset");
  });

  test("authenticated request returns user data", async ({ request }) => {
    const loginRes = await request.post(`${BASE}/login`, {
      data: { username: "bob", password: "password" },
    });
    expect(loginRes.status()).toBe(200);

    const meRes = await request.get(`${BASE}/me`);
    expect(meRes.status()).toBe(200);
    const body = await meRes.json();
    expect(body.username).toBe("bob");
    expect(body.role).toBe("customer");
    expect(body.id).toBeDefined();
    expect(body.password_hash).toBeUndefined();
  });

  test("unauthenticated request returns 401", async ({ request }) => {
    const res = await request.get(`${BASE}/me`);
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Not authenticated");
  });
});

test.describe("Logout", () => {
  test.beforeEach(async ({ request }) => {
    await request.post("/api/reset");
  });

  test("logout clears cookies", async ({ request }) => {
    await request.post(`${BASE}/login`, {
      data: { username: "bob", password: "password" },
    });

    const res = await request.post(`${BASE}/logout`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("Logged out successfully");

    const cookies = res.headers()["set-cookie"];
    expect(cookies).toBeDefined();
    expect(cookies).toContain("token=;");
    expect(cookies).toContain("ui_setting=;");

    const meRes = await request.get(`${BASE}/me`);
    expect(meRes.status()).toBe(401);
  });
});
