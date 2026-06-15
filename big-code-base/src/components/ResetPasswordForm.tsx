import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/router";

const PASSWORD_MIN_LENGTH = 3;
const PASSWORD_MAX_LENGTH = 10;

export default function ResetPasswordForm() {
  const router = useRouter();
  const { username } = router.query;

  const [secretQuestion1, setSecretQuestion1] = useState("");
  const [secretQuestion2, setSecretQuestion2] = useState("");
  const [secretAnswer1, setSecretAnswer1] = useState("");
  const [secretAnswer2, setSecretAnswer2] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [questionsLoaded, setQuestionsLoaded] = useState(false);

  useEffect(() => {
    if (!username) return;

    async function loadQuestions() {
      try {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });

        const data = await res.json();

        if (res.ok) {
          setSecretQuestion1(data.secretQuestion1);
          setSecretQuestion2(data.secretQuestion2);
          setQuestionsLoaded(true);
        } else {
          setError(data.error || "Failed to load questions");
        }
      } catch {
        setError("An unexpected error occurred");
      }
    }

    loadQuestions();
  }, [username]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      setError(
        `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`
      );
      return;
    }

    if (newPassword.length > PASSWORD_MAX_LENGTH) {
      setError(
        `Password must be no more than ${PASSWORD_MAX_LENGTH} characters long`
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          secretAnswer1,
          secretAnswer2,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Password reset failed");
        return;
      }

      router.push("/login");
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  if (!username) {
    return (
      <div className="text-center py-8">
        <p className="text-muted">Missing username parameter.</p>
      </div>
    );
  }

  if (!questionsLoaded) {
    return (
      <div className="text-center py-8">
        {error ? (
          <div className="bg-coral/10 border border-coral/30 text-coral px-4 py-3 text-sm">
            {error}
          </div>
        ) : (
          <p className="text-muted">Loading security questions...</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} autoComplete="off" className="animate-fade-in space-y-6">
      <div className="text-center">
        <h1 className="font-display text-3xl text-warm-white">Reset Password</h1>
        <div className="gold-rule mx-auto mt-4" />
      </div>

      {error && (
        <div className="bg-coral/10 border border-coral/30 text-coral px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="secretAnswer1"
          className="block text-xs font-medium text-muted tracking-wider uppercase mb-2"
        >
          {secretQuestion1}
        </label>
        <input
          id="secretAnswer1"
          type="text"
          value={secretAnswer1}
          onChange={(e) => setSecretAnswer1(e.target.value)}
          className="w-full bg-surface border border-navy-600 text-warm-white px-4 py-3 focus:border-gold-500 focus:outline-none transition-colors"
        />
      </div>

      <div>
        <label
          htmlFor="secretAnswer2"
          className="block text-xs font-medium text-muted tracking-wider uppercase mb-2"
        >
          {secretQuestion2}
        </label>
        <input
          id="secretAnswer2"
          type="text"
          value={secretAnswer2}
          onChange={(e) => setSecretAnswer2(e.target.value)}
          className="w-full bg-surface border border-navy-600 text-warm-white px-4 py-3 focus:border-gold-500 focus:outline-none transition-colors"
        />
      </div>

      <div>
        <label
          htmlFor="newPassword"
          className="block text-xs font-medium text-muted tracking-wider uppercase mb-2"
        >
          New Password
        </label>
        <input
          id="newPassword"
          name="reset-key"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          maxLength={PASSWORD_MAX_LENGTH}
          autoComplete="off"
          data-lpignore="true"
          data-1p-ignore
          data-form-type="other"
          className="w-full bg-surface border border-navy-600 text-warm-white px-4 py-3 focus:border-gold-500 focus:outline-none transition-colors"
        />
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-xs font-medium text-muted tracking-wider uppercase mb-2"
        >
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          name="reset-key-confirm"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          maxLength={PASSWORD_MAX_LENGTH}
          autoComplete="off"
          data-lpignore="true"
          data-1p-ignore
          data-form-type="other"
          className="w-full bg-surface border border-navy-600 text-warm-white px-4 py-3 focus:border-gold-500 focus:outline-none transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gold-500 text-navy-950 py-3 text-sm font-semibold tracking-wider uppercase hover:bg-gold-400 disabled:opacity-50 transition-all duration-300"
      >
        {loading ? "Resetting..." : "Reset Password"}
      </button>
    </form>
  );
}
