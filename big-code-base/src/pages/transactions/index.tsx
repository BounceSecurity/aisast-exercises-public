import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useUser } from "@/lib/UserContext";
import TransactionHistory from "@/components/TransactionHistory";

interface Transaction {
  id: number;
  from_user_id: number;
  to_user_id: number | null;
  to_account: string | null;
  amount: number;
  description: string | null;
  created_at: string;
  from_username: string;
  to_username: string | null;
}

export default function TransactionsPage() {
  const router = useRouter();
  const { user, loading: contextLoading } = useUser();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (contextLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    fetch("/api/transactions")
      .then((res) => {
        if (!res.ok) {
          router.replace("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setTransactions(data.transactions);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [user, contextLoading, router]);

  if (contextLoading || loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <p className="text-muted font-body tracking-wide">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-navy-950 p-8">
      <div className="max-w-4xl mx-auto animate-fade-in">
        <h1 className="text-3xl font-display text-warm-white mb-2">
          Transaction History
        </h1>
        <div className="gold-rule mb-8" />

        <TransactionHistory
          transactions={transactions}
          currentUsername={user.username}
        />
      </div>
    </div>
  );
}
