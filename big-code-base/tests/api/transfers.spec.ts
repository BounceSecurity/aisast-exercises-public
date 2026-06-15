import { test, expect } from "@playwright/test";

const BASE = "https://localhost:3000";

// MFA users authenticate with a secret answer. Either secret answer is
// accepted, so we always supply the first one.
const MFA_ANSWERS: Record<string, string> = {
  alice: "Globex Corp",
  charlie: "Johnson",
};

async function loginAs(
  request: import("@playwright/test").APIRequestContext,
  username: string,
  password: string
) {
  const res = await request.post(`${BASE}/api/auth/login`, {
    data: { username, password },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  if (body.mfaRequired && MFA_ANSWERS[username]) {
    const mfaRes = await request.post(`${BASE}/api/auth/login`, {
      data: { username, password, secretAnswer: MFA_ANSWERS[username] },
    });
    expect(mfaRes.ok()).toBeTruthy();
  }
}

async function resetApp(request: import("@playwright/test").APIRequestContext) {
  await loginAs(request, "admin", "admin123");
  await request.post(`${BASE}/api/reset`);
}

async function getBalance(
  request: import("@playwright/test").APIRequestContext,
  username: string,
  password: string
): Promise<number> {
  await loginAs(request, username, password);
  const meRes = await request.get(`${BASE}/api/auth/me`);
  const me = await meRes.json();
  return me.balance;
}

async function makeTransfer(
  request: import("@playwright/test").APIRequestContext,
  data: { recipient: string; amount: number; description?: string }
) {
  const initiateRes = await request.post(`${BASE}/api/transfers/initiate`, {
    data,
  });
  expect(initiateRes.ok()).toBeTruthy();
  const initiateBody = await initiateRes.json();

  const confirmRes = await request.post(`${BASE}/api/transfers/confirm`, {
    data: { transfer_id: initiateBody.transfer_id },
  });
  expect(confirmRes.ok()).toBeTruthy();
  return confirmRes.json();
}

test.describe("Transfers API", () => {
  test.beforeEach(async ({ request }) => {
    await resetApp(request);
  });

  test("successful transfer between users: both balances update correctly", async ({
    request,
  }) => {
    await loginAs(request, "bob", "password");

    const body = await makeTransfer(request, {
      recipient: "alice",
      amount: 5000,
      description: "Payment",
    });

    expect(body.balance).toBe(95000);
    expect(body.transaction).toBeDefined();
    expect(body.transaction.amount).toBe(5000);

    const aliceBalance = await getBalance(request, "alice", "alice1");
    expect(aliceBalance).toBe(105000);
  });

  test("transfer to external/unknown account: only sender balance decreases", async ({
    request,
  }) => {
    await loginAs(request, "bob", "password");

    const body = await makeTransfer(request, {
      recipient: "external-acct-123",
      amount: 2000,
      description: "External transfer",
    });

    expect(body.balance).toBe(98000);
    expect(body.transaction.to_account).toBe("external-acct-123");
  });

  test("negative amount: reverses direction (sender gains, recipient loses)", async ({
    request,
  }) => {
    await loginAs(request, "bob", "password");

    const body = await makeTransfer(request, {
      recipient: "alice",
      amount: -3000,
      description: "Reversal",
    });

    expect(body.balance).toBe(103000);

    const aliceBalance = await getBalance(request, "alice", "alice1");
    expect(aliceBalance).toBe(97000);
  });

  test("initiate endpoint: always returns transfer_id and requires_confirmation flag", async ({
    request,
  }) => {
    await loginAs(request, "bob", "password");

    const res = await request.post(`${BASE}/api/transfers/initiate`, {
      data: { recipient: "alice", amount: 20000, description: "Big payment" },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();

    expect(body.requires_confirmation).toBe(true);
    expect(body.transfer_id).toBeDefined();
    expect(typeof body.transfer_id).toBe("number");
  });

  test("initiate endpoint: returns requires_confirmation false for amounts <= 10,000", async ({
    request,
  }) => {
    await loginAs(request, "bob", "password");

    const res = await request.post(`${BASE}/api/transfers/initiate`, {
      data: { recipient: "alice", amount: 5000, description: "Small payment" },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();

    expect(body.requires_confirmation).toBe(false);
    expect(body.transfer_id).toBeDefined();
  });

  test("confirm endpoint: processes transfer with just transfer_id", async ({
    request,
  }) => {
    await loginAs(request, "bob", "password");

    const initiateRes = await request.post(`${BASE}/api/transfers/initiate`, {
      data: { recipient: "alice", amount: 20000, description: "Confirmed transfer" },
    });
    const initiateBody = await initiateRes.json();
    expect(initiateBody.transfer_id).toBeDefined();

    const confirmRes = await request.post(`${BASE}/api/transfers/confirm`, {
      data: { transfer_id: initiateBody.transfer_id },
    });
    expect(confirmRes.ok()).toBeTruthy();
    const confirmBody = await confirmRes.json();

    expect(confirmBody.balance).toBe(80000);
    expect(confirmBody.transaction).toBeDefined();
  });

  test("confirm endpoint: rejects invalid transfer_id", async ({ request }) => {
    await loginAs(request, "bob", "password");

    const confirmRes = await request.post(`${BASE}/api/transfers/confirm`, {
      data: { transfer_id: 999999 },
    });
    expect(confirmRes.status()).toBe(404);
  });

  test("transaction history: returns transactions ordered by date descending", async ({
    request,
  }) => {
    await loginAs(request, "bob", "password");

    await makeTransfer(request, {
      recipient: "alice",
      amount: 1000,
      description: "First",
    });
    await makeTransfer(request, {
      recipient: "alice",
      amount: 2000,
      description: "Second",
    });

    const res = await request.get(`${BASE}/api/transactions`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();

    expect(body.transactions.length).toBeGreaterThanOrEqual(2);
    const dates = body.transactions.map(
      (t: { created_at: string }) => new Date(t.created_at + "Z").getTime()
    );
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]);
    }
  });

  test("rejects unauthenticated requests with 401", async ({ request }) => {
    await request.post(`${BASE}/api/auth/logout`);

    const initiateRes = await request.post(`${BASE}/api/transfers/initiate`, {
      data: { recipient: "alice", amount: 100 },
    });
    expect(initiateRes.status()).toBe(401);

    const confirmRes = await request.post(`${BASE}/api/transfers/confirm`, {
      data: { transfer_id: 1 },
    });
    expect(confirmRes.status()).toBe(401);

    const txRes = await request.get(`${BASE}/api/transactions`);
    expect(txRes.status()).toBe(401);
  });
});
