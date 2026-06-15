import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminCustomerTable from "@/components/AdminCustomerTable";

interface User {
  id: number;
  username: string;
  role: string;
  mfa_enabled: number;
  secret_question_1: string;
  secret_question_2: string;
  created_at: string;
}

interface MeData {
  id: number;
  username: string;
  role: string;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

export default function AdminCustomersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<MeData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    Promise.all([
      fetch("/api/auth/me").then((res) => (res.ok ? res.json() : null)),
      fetch("/api/admin/users").then((res) => (res.ok ? res.json() : null)),
    ]).then(([meData, usersData]) => {
      if (meData) setCurrentUser(meData);
      if (usersData) setUsers(usersData.users);
      setLoading(false);
    });
  };

  useEffect(() => {
    const token = getCookie("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    const roleSetting = getCookie("ui_setting");
    if (roleSetting !== "0") {
      router.replace("/dashboard");
      return;
    }

    fetchData();
  }, [router]);

  const handleResetApp = () => {
    fetch("/api/reset", { method: "POST" }).then((res) => {
      if (res.ok) {
        router.push("/");
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <p className="text-muted font-body tracking-wide">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950 p-8">
      <div className="max-w-6xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-display text-warm-white">Manage Customers</h1>
          <button
            onClick={handleResetApp}
            className="bg-coral/10 text-coral border border-coral/30 px-3 py-1.5 text-xs font-medium tracking-wider uppercase hover:bg-coral/20 transition-all"
            data-testid="reset-app"
          >
            Reset App
          </button>
        </div>
        <div className="gold-rule mb-8" />

        <AdminCustomerTable
          users={users}
          currentUserId={currentUser?.id ?? -1}
          onRefresh={fetchData}
        />

        <div className="mt-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="border border-navy-600 text-muted px-5 py-2 text-sm font-medium tracking-wider uppercase hover:text-warm-white hover:border-navy-500 transition-all duration-300"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
