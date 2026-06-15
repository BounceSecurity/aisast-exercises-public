import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import DisplayName from "@/components/DisplayName";

interface UserData {
  id: number;
  username: string;
  role: string;
  mfa_enabled: number;
  email: string;
  balance: number;
  display_name: string | null;
  profile_image: string | null;
  created_at: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getCookie("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) {
          router.replace("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setUser(data);
        }
        setLoading(false);
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <p className="text-muted font-body tracking-wide">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  const isAdmin = user.role === "admin";
  const welcomeName = user.display_name || user.username;

  return (
    <div className="min-h-screen bg-navy-950 p-8">
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="flex items-center gap-4 mb-2">
          {user.profile_image && (
            <img
              src={user.profile_image}
              alt="Profile"
              className="w-12 h-12 rounded-full object-cover border border-navy-700/50"
              data-testid="dashboard-profile-image"
            />
          )}
          <h1 className="text-3xl font-display text-warm-white" data-testid="welcome-heading">
            Welcome, <DisplayName name={welcomeName} />
          </h1>
        </div>
        <div className="gold-rule mb-8" />

        {isAdmin ? (
          <div className="bg-navy-900 border border-navy-700/50 p-6 mb-6">
            <h2 className="text-xl font-display text-warm-white mb-4">Admin Dashboard</h2>
            <Link
              href="/admin/customers"
              className="inline-block bg-gold-500 text-navy-950 px-5 py-2 text-sm font-semibold tracking-wider uppercase hover:bg-gold-400 transition-all duration-300"
            >
              Manage Customers
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-navy-900 border border-navy-700/50 p-6">
              <h2 className="text-lg font-display text-warm-white mb-4">Your Details</h2>
              <dl className="space-y-3">
                <div className="flex">
                  <dt className="text-sm font-medium text-muted tracking-wider uppercase w-32">Username</dt>
                  <dd className="text-sm text-warm-white" data-testid="user-username">{user.username}</dd>
                </div>
                <div className="flex">
                  <dt className="text-sm font-medium text-muted tracking-wider uppercase w-32">Role</dt>
                  <dd className="text-sm text-warm-white" data-testid="user-role">{user.role}</dd>
                </div>
                <div className="flex">
                  <dt className="text-sm font-medium text-muted tracking-wider uppercase w-32">MFA</dt>
                  <dd className="text-sm text-warm-white" data-testid="user-mfa">
                    {user.mfa_enabled ? "Enabled" : "Disabled"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="bg-navy-900 border border-navy-700/50 p-6">
              <h2 className="text-lg font-display text-warm-white mb-4">Account Summary</h2>
              <dl className="space-y-3">
                <div className="flex">
                  <dt className="text-sm font-medium text-muted tracking-wider uppercase w-40">Account Number</dt>
                  <dd className="text-sm text-warm-white" data-testid="account-number">#1234-5678</dd>
                </div>
                <div className="flex">
                  <dt className="text-sm font-medium text-muted tracking-wider uppercase w-40">Balance</dt>
                  <dd className="text-lg font-semibold text-gold-400" data-testid="account-balance">{formatCurrency(user.balance)}</dd>
                </div>
              </dl>
            </div>

            <div className="bg-navy-900 border border-navy-700/50 p-6">
              <h2 className="text-lg font-display text-warm-white mb-4">Quick Actions</h2>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/transfer"
                  className="bg-gold-500 text-navy-950 px-5 py-2 text-sm font-semibold tracking-wider uppercase hover:bg-gold-400 transition-all duration-300"
                >
                  Transfer
                </Link>
                <Link
                  href="/transactions"
                  className="bg-gold-500 text-navy-950 px-5 py-2 text-sm font-semibold tracking-wider uppercase hover:bg-gold-400 transition-all duration-300"
                >
                  Transaction History
                </Link>
                <Link
                  href="/profiles"
                  className="bg-gold-500 text-navy-950 px-5 py-2 text-sm font-semibold tracking-wider uppercase hover:bg-gold-400 transition-all duration-300"
                >
                  Public Profiles
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex gap-4">
          <Link
            href="/profile"
            className="border border-navy-600 text-muted px-5 py-2 text-sm font-medium tracking-wider uppercase hover:text-warm-white hover:border-navy-500 transition-all duration-300"
          >
            Profile
          </Link>
          <button
            onClick={() => {
              fetch("/api/auth/logout", { method: "POST" }).then(() => {
                router.push("/login");
              });
            }}
            className="bg-coral/10 text-coral border border-coral/30 px-5 py-2 text-sm font-medium tracking-wider uppercase hover:bg-coral/20 transition-all"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
