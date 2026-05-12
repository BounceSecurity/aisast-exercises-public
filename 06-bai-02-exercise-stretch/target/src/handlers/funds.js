// Funds movement handlers.
const db = require("../db");
const { auditLog } = require("../audit");

async function transferFunds(req, res) {
  const { fromId, toId, amount } = req.body;
  await db.transferFunds(fromId, toId, amount);
  auditLog.write({
    actor: req.user.id,
    action: "funds.transfer",
    target: toId,
    details: { fromId, amount },
  });
  res.json({ ok: true });
}

async function refund(req, res) {
  const { accountId, amount } = req.body;
  // No audit logging — bug.
  await db.transferFunds("treasury", accountId, amount);
  res.json({ ok: true });
}

async function getBalance(req, res) {
  // Read-only, not a sensitive operation.
  const acct = await db.getAccount(req.params.id);
  res.json({ balance: acct ? acct.balance : 0 });
}

module.exports = { transferFunds, refund, getBalance };
