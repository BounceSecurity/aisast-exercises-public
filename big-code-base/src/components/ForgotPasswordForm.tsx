import { useState, FormEvent } from "react";
import { useRouter } from "next/router";

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "An error occurred");
        return;
      }

      router.push(`/reset-password?username=${encodeURIComponent(username.trim())}`);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} autoComplete="off" className="animate-fade-in space-y-6">
      <div className="text-center">
        <h1 className="font-display text-3xl text-warm-white">Forgot Password</h1>
        <div className="gold-rule mx-auto mt-4" />
      </div>

      {error && (
        <div className="bg-coral/10 border border-coral/30 text-coral px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="username" className="block text-xs font-medium text-muted tracking-wider uppercase mb-2">
          Username
        </label>
        <input
          id="username"
          name="forgot-ref"
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

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gold-500 text-navy-950 py-3 text-sm font-semibold tracking-wider uppercase hover:bg-gold-400 disabled:opacity-50 transition-all duration-300"
      >
        {loading ? "Loading..." : "Continue"}
      </button>
    </form>
  );
}
