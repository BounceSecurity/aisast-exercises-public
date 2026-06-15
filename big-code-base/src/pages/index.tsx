import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const hasCookie = document.cookie
      .split("; ")
      .some((row) => row.startsWith("token="));
    if (hasCookie) {
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--navy-800)_0%,_var(--navy-950)_70%)]" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gold-500/5 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col items-center gap-8 animate-fade-in px-6 text-center">
        <div className="w-16 h-px bg-gold-500 mb-2" />
        <p className="text-muted text-sm font-body tracking-[0.3em] uppercase">
          Est. 2024
        </p>
        <h1 className="font-display text-6xl md:text-7xl text-warm-white leading-tight">
          NoHackMeBank
        </h1>
        <p className="text-muted text-lg font-light max-w-md leading-relaxed">
          Private banking, redefined. Your wealth deserves the security and
          discretion of a trusted institution.
        </p>
        <div className="gold-rule w-48 my-2" />
        <div className="flex gap-5 mt-4">
          <Link
            href="/register"
            className="bg-gold-500 text-navy-950 px-8 py-3 text-sm font-semibold tracking-wider uppercase hover:bg-gold-400 transition-all duration-300"
          >
            Open Account
          </Link>
          <Link
            href="/login"
            className="border border-gold-500/40 text-gold-400 px-8 py-3 text-sm font-semibold tracking-wider uppercase hover:bg-gold-500/10 transition-all duration-300"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
