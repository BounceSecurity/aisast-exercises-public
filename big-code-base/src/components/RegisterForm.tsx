import { useState, FormEvent, ClipboardEvent } from "react";
import { useRouter } from "next/router";

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

const PASSWORD_MIN_LENGTH = 3;
const PASSWORD_MAX_LENGTH = 10;

export default function RegisterForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [secretQuestion1, setSecretQuestion1] = useState("");
  const [secretQuestion2, setSecretQuestion2] = useState("");
  const [secretAnswer1, setSecretAnswer1] = useState("");
  const [secretAnswer2, setSecretAnswer2] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function preventPaste(e: ClipboardEvent) {
    e.preventDefault();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      setError(
        `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`
      );
      return;
    }

    if (password.length > PASSWORD_MAX_LENGTH) {
      setError(
        `Password must be no more than ${PASSWORD_MAX_LENGTH} characters long`
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!secretQuestion1 || !secretQuestion2) {
      setError("Please select both secret questions");
      return;
    }

    if (secretQuestion1 === secretQuestion2) {
      setError("Please select two different secret questions");
      return;
    }

    if (!secretAnswer1.trim() || !secretAnswer2.trim()) {
      setError("Please provide answers to both secret questions");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
          confirmPassword,
          secretQuestion1,
          secretAnswer1,
          secretQuestion2,
          secretAnswer2,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      router.push("/login");
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} autoComplete="off" className="animate-fade-in space-y-6">
      <div className="text-center">
        <h1 className="font-display text-3xl text-warm-white">Create Account</h1>
        <div className="gold-rule mx-auto mt-4" />
      </div>

      {error && (
        <div className="bg-coral/10 border border-coral/30 text-coral px-4 py-3 text-sm" data-testid="error-message">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="username" className="block text-xs font-medium text-muted tracking-wider uppercase mb-2">
          Username
        </label>
        <input
          id="username"
          name="reg-ref"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="off"
          data-lpignore="true"
          data-1p-ignore
          data-form-type="other"
          className="w-full bg-surface border border-navy-600 text-warm-white px-4 py-3 focus:border-gold-500 focus:outline-none transition-colors"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-xs font-medium text-muted tracking-wider uppercase mb-2">
          Password
        </label>
        <input
          id="password"
          name="reg-key"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onPaste={preventPaste}
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
          name="reg-key-confirm"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onPaste={preventPaste}
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
          htmlFor="secretQuestion1"
          className="block text-xs font-medium text-muted tracking-wider uppercase mb-2"
        >
          Secret Question 1
        </label>
        <select
          id="secretQuestion1"
          value={secretQuestion1}
          onChange={(e) => setSecretQuestion1(e.target.value)}
          className="w-full bg-surface border border-navy-600 text-warm-white px-4 py-3 focus:border-gold-500 focus:outline-none transition-colors appearance-none"
        >
          <option value="">Select a question</option>
          {SECRET_QUESTIONS.map((q) => (
            <option key={q} value={q}>
              {q}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="secretAnswer1"
          className="block text-xs font-medium text-muted tracking-wider uppercase mb-2"
        >
          Answer 1
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
          htmlFor="secretQuestion2"
          className="block text-xs font-medium text-muted tracking-wider uppercase mb-2"
        >
          Secret Question 2
        </label>
        <select
          id="secretQuestion2"
          value={secretQuestion2}
          onChange={(e) => setSecretQuestion2(e.target.value)}
          className="w-full bg-surface border border-navy-600 text-warm-white px-4 py-3 focus:border-gold-500 focus:outline-none transition-colors appearance-none"
        >
          <option value="">Select a question</option>
          {SECRET_QUESTIONS.map((q) => (
            <option key={q} value={q}>
              {q}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="secretAnswer2"
          className="block text-xs font-medium text-muted tracking-wider uppercase mb-2"
        >
          Answer 2
        </label>
        <input
          id="secretAnswer2"
          type="text"
          value={secretAnswer2}
          onChange={(e) => setSecretAnswer2(e.target.value)}
          className="w-full bg-surface border border-navy-600 text-warm-white px-4 py-3 focus:border-gold-500 focus:outline-none transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gold-500 text-navy-950 py-3 text-sm font-semibold tracking-wider uppercase hover:bg-gold-400 disabled:opacity-50 transition-all duration-300"
      >
        {loading ? "Registering..." : "Create Account"}
      </button>
    </form>
  );
}
