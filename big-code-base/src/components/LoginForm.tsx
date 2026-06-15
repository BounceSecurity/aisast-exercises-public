import { useState, FormEvent, ClipboardEvent } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [secretAnswer, setSecretAnswer] = useState("");
  const [secretQuestion, setSecretQuestion] = useState("");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function preventPaste(e: ClipboardEvent) {
    e.preventDefault();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const body: Record<string, string> = { username, password };
      if (mfaRequired && secretAnswer) {
        body.secretAnswer = secretAnswer;
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      if (data.mfaRequired && data.secretQuestion) {
        setMfaRequired(true);
        setSecretQuestion(data.secretQuestion);
        setError("");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} autoComplete="off" className="w-full max-w-md mx-auto space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl text-warm-white">Welcome Back</h1>
        <div className="gold-rule w-16 mx-auto mt-4" />
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
          name="login-ref"
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
          name="login-key"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onPaste={preventPaste}
          autoComplete="off"
          data-lpignore="true"
          data-1p-ignore
          data-form-type="other"
          className="w-full bg-surface border border-navy-600 text-warm-white px-4 py-3 focus:border-gold-500 focus:outline-none transition-colors"
        />
      </div>

      {mfaRequired && (
        <div className="animate-fade-in">
          <label
            htmlFor="secretAnswer"
            className="block text-xs font-medium text-gold-400 tracking-wider uppercase mb-2"
          >
            {secretQuestion}
          </label>
          <input
            id="secretAnswer"
            type="text"
            value={secretAnswer}
            onChange={(e) => setSecretAnswer(e.target.value)}
            className="w-full bg-surface border border-navy-600 text-warm-white px-4 py-3 focus:border-gold-500 focus:outline-none transition-colors"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gold-500 text-navy-950 py-3 text-sm font-semibold tracking-wider uppercase hover:bg-gold-400 disabled:opacity-50 transition-all duration-300"
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>

      <div className="text-center">
        <Link href="/forgot-password" className="text-muted text-sm hover:text-gold-400 transition-colors">
          Forgot your password?
        </Link>
      </div>
    </form>
  );
}
