// Toy "database" — in-memory store for demo purposes only.

const _store = {
  members: new Map(),
  preferences: new Map(),
  projects: new Map(),
  invoices: [],
};

module.exports = {
  saveMember(orgId, member) {
    const arr = _store.members.get(orgId) || [];
    arr.push(member);
    _store.members.set(orgId, arr);
    return member;
  },
  savePreference(userId, prefs) {
    _store.preferences.set(userId, prefs);
    return prefs;
  },
  createProject(project) {
    _store.projects.set(project.id, project);
    return project;
  },
  refundInvoice(id, amount) {
    _store.invoices.push({ id, amount, refundedAt: new Date().toISOString() });
    return { ok: true };
  },
  deleteUser(id) {
    return { ok: true, id };
  },
};
