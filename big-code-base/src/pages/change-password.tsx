import { useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function ChangePasswordPage() {
  const router = useRouter();

  useEffect(() => {
    const hasCookie = document.cookie
      .split("; ")
      .some((row) => row.startsWith("token="));
    if (!hasCookie) {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md animate-fade-in text-center space-y-6">
        <h1 className="font-display text-3xl text-warm-white">Change Password</h1>
        <div className="gold-rule mx-auto" />
        <p className="text-muted">
          For security reasons you can&apos;t change your password.
        </p>
        <Link
          href="/dashboard"
          className="inline-block bg-gold-500 text-navy-950 px-8 py-3 text-sm font-semibold tracking-wider uppercase hover:bg-gold-400 transition-all duration-300"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
