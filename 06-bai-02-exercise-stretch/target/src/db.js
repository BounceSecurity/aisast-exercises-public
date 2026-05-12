// Stub data layer. Pretend these talk to a real database.
const users = new Map();
const accounts = new Map();

module.exports = {
  async deleteUserById(id) {
    users.delete(id);
  },
  async setUserRole(id, role) {
    const u = users.get(id) || { id };
    u.role = role;
    users.set(id, u);
  },
  async resetUserPassword(id, newHash) {
    const u = users.get(id) || { id };
    u.passwordHash = newHash;
    users.set(id, u);
  },
  async transferFunds(fromId, toId, amount) {
    const from = accounts.get(fromId) || { id: fromId, balance: 0 };
    const to = accounts.get(toId) || { id: toId, balance: 0 };
    from.balance -= amount;
    to.balance += amount;
    accounts.set(fromId, from);
    accounts.set(toId, to);
  },
  async getAccount(id) {
    return accounts.get(id) || null;
  },
  async listUsers() {
    return Array.from(users.values());
  },
};
