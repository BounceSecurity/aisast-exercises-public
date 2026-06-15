import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useUser } from "@/lib/UserContext";
import XmlImportForm from "@/components/XmlImportForm";

export default function ImportTransactionsPage() {
  const router = useRouter();
  const { user, loading: contextLoading } = useUser();
  const redirected = useRef(false);

  useEffect(() => {
    if (contextLoading || redirected.current) return;
    if (!user) {
      redirected.current = true;
      router.replace("/login");
      return;
    }
    if (user.role !== "customer") {
      redirected.current = true;
      router.replace("/dashboard");
    }
  }, [user, contextLoading, router]);

  if (!user || contextLoading || user.role !== "customer") {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <p className="text-muted font-body tracking-wide">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950 p-8">
      <div className="max-w-2xl mx-auto animate-fade-in">
        <h1 className="text-3xl font-display text-warm-white mb-2">
          Import Transactions
        </h1>
        <div className="gold-rule mb-8" />
        <XmlImportForm />
      </div>
    </div>
  );
}
