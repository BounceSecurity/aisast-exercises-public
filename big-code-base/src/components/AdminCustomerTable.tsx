import { useState } from "react";

interface User {
  id: number;
  username: string;
  role: string;
  mfa_enabled: number;
  secret_question_1: string;
  secret_question_2: string;
  created_at: string;
}

interface AdminCustomerTableProps {
  users: User[];
  currentUserId: number;
  onRefresh: () => void;
}

export default function AdminCustomerTable({
  users,
  currentUserId,
  onRefresh,
}: AdminCustomerTableProps) {
  const [passwordInputs, setPasswordInputs] = useState<
    Record<number, string>
  >({});
  const [showPasswordInput, setShowPasswordInput] = useState<
    Record<number, boolean>
  >({});
  const [messages, setMessages] = useState<Record<number, string>>({});
  const [messageTypes, setMessageTypes] = useState<
    Record<number, "success" | "error">
  >({});

  const handleDelete = (userId: number, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) {
      return;
    }

    fetch(`/api/admin/users/${userId}`, { method: "DELETE" })
      .then((res) => {
        if (res.ok) {
          onRefresh();
        }
      });
  };

  const handleToggleMfa = (userId: number, currentMfa: number) => {
    fetch(`/api/admin/users/${userId}/mfa`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !currentMfa }),
    }).then((res) => {
      if (res.ok) {
        onRefresh();
      }
    });
  };

  const handleChangeRole = (userId: number, currentRole: string) => {
    const newRole = currentRole === "admin" ? "customer" : "admin";
    fetch(`/api/admin/users/${userId}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    }).then((res) => {
      if (res.ok) {
        onRefresh();
      }
    });
  };

  const handleResetPassword = (userId: number) => {
    const newPassword = passwordInputs[userId];
    if (!newPassword) return;

    fetch(`/api/admin/users/${userId}/password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setMessages((prev) => ({ ...prev, [userId]: "Password updated" }));
          setMessageTypes((prev) => ({ ...prev, [userId]: "success" }));
          setPasswordInputs((prev) => ({ ...prev, [userId]: "" }));
          setShowPasswordInput((prev) => ({ ...prev, [userId]: false }));
        } else {
          setMessages((prev) => ({
            ...prev,
            [userId]: data.error || "Failed to update password",
          }));
          setMessageTypes((prev) => ({ ...prev, [userId]: "error" }));
        }
      });
  };

  return (
    <div className="overflow-x-auto bg-navy-900 border border-navy-700/50">
      <table className="w-full" data-testid="users-table">
        <thead className="border-b border-navy-700">
          <tr>
            <th className="px-4 py-3 text-xs font-medium text-muted tracking-wider uppercase text-left">Username</th>
            <th className="px-4 py-3 text-xs font-medium text-muted tracking-wider uppercase text-left">Role</th>
            <th className="px-4 py-3 text-xs font-medium text-muted tracking-wider uppercase text-left">MFA Status</th>
            <th className="px-4 py-3 text-xs font-medium text-muted tracking-wider uppercase text-left">Secret Questions</th>
            <th className="px-4 py-3 text-xs font-medium text-muted tracking-wider uppercase text-left">Created At</th>
            <th className="px-4 py-3 text-xs font-medium text-muted tracking-wider uppercase text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-navy-800/50 hover:bg-navy-800/30 transition-colors" data-testid={`user-row-${user.username}`}>
              <td className="px-4 py-3 text-sm text-warm-white">{user.username}</td>
              <td className="px-4 py-3 text-sm text-warm-white">{user.role}</td>
              <td className="px-4 py-3 text-sm text-warm-white">
                {user.mfa_enabled ? "Enabled" : "Disabled"}
              </td>
              <td className="px-4 py-3 text-xs text-muted">
                <div>{user.secret_question_1}</div>
                <div>{user.secret_question_2}</div>
              </td>
              <td className="px-4 py-3 text-xs text-muted">{user.created_at}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleDelete(user.id, user.username)}
                    disabled={user.id === currentUserId}
                    className="bg-coral/10 text-coral border border-coral/30 px-3 py-1.5 text-xs font-medium tracking-wider uppercase hover:bg-coral/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid={`delete-${user.username}`}
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => handleToggleMfa(user.id, user.mfa_enabled)}
                    className="bg-navy-700 text-warm-white px-3 py-1.5 text-xs font-medium tracking-wider uppercase hover:bg-navy-600 transition-all"
                    data-testid={`toggle-mfa-${user.username}`}
                  >
                    Toggle MFA
                  </button>
                  <button
                    onClick={() => handleChangeRole(user.id, user.role)}
                    className="bg-navy-700 text-warm-white px-3 py-1.5 text-xs font-medium tracking-wider uppercase hover:bg-navy-600 transition-all"
                    data-testid={`change-role-${user.username}`}
                  >
                    Change Role
                  </button>
                  <button
                    onClick={() =>
                      setShowPasswordInput((prev) => ({
                        ...prev,
                        [user.id]: !prev[user.id],
                      }))
                    }
                    className="bg-navy-700 text-warm-white px-3 py-1.5 text-xs font-medium tracking-wider uppercase hover:bg-navy-600 transition-all"
                    data-testid={`reset-password-${user.username}`}
                  >
                    Reset Password
                  </button>
                </div>

                {showPasswordInput[user.id] && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={passwordInputs[user.id] || ""}
                      onChange={(e) =>
                        setPasswordInputs((prev) => ({
                          ...prev,
                          [user.id]: e.target.value,
                        }))
                      }
                      placeholder="New password"
                      className="bg-surface border border-navy-600 text-warm-white px-3 py-1.5 text-sm focus:border-gold-500 focus:outline-none transition-colors"
                      data-testid={`password-input-${user.username}`}
                    />
                    <button
                      onClick={() => handleResetPassword(user.id)}
                      className="bg-gold-500 text-navy-950 px-3 py-1.5 text-xs font-semibold tracking-wider uppercase hover:bg-gold-400 transition-all duration-300"
                      data-testid={`password-submit-${user.username}`}
                    >
                      Set
                    </button>
                  </div>
                )}

                {messages[user.id] && (
                  <p
                    className={`mt-1 text-sm ${
                      messageTypes[user.id] === "error"
                        ? "text-coral"
                        : "text-emerald"
                    }`}
                    data-testid={`message-${user.username}`}
                  >
                    {messages[user.id]}
                  </p>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
