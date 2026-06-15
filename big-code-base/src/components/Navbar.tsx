import Link from "next/link";
import { useUser } from "@/lib/UserContext";
import DisplayName from "@/components/DisplayName";

export default function Navbar() {
  const { user, loading } = useUser();

  return (
    <nav className="bg-navy-900 border-b border-navy-700/50 px-8 py-4 flex items-center justify-between relative z-40">
      <Link href="/" className="font-display text-2xl text-gold-400 tracking-wide hover:text-gold-300 transition-colors">
        NoHackMeBank
      </Link>
      <div className="flex items-center gap-6 font-body text-sm font-medium tracking-wide uppercase">
        {loading ? null : !user ? (
          <>
            <Link href="/login" className="text-muted hover:text-warm-white transition-colors">
              Login
            </Link>
            <Link href="/register" className="bg-gold-500 text-navy-950 px-5 py-2 hover:bg-gold-400 transition-colors">
              Register
            </Link>
          </>
        ) : (
          <>
            <Link href="/dashboard" className="text-muted hover:text-warm-white transition-colors">
              Dashboard
            </Link>
            {user.role === "admin" && (
              <Link href="/admin/customers" className="text-muted hover:text-warm-white transition-colors">
                Admin
              </Link>
            )}
            {user.role === "customer" && (
              <>
                <Link href="/profile/edit" className="text-muted hover:text-warm-white transition-colors">
                  My Profile
                </Link>
                <Link href="/profiles" className="text-muted hover:text-warm-white transition-colors">
                  Public Profiles
                </Link>
                <Link href="/transfer" className="text-muted hover:text-warm-white transition-colors">
                  Transfers
                </Link>
                <Link href="/transactions" className="text-muted hover:text-warm-white transition-colors">
                  Transactions
                </Link>
                <Link href="/transactions/import" className="text-muted hover:text-warm-white transition-colors">
                  Import
                </Link>
              </>
            )}
            {user.role !== "customer" && (
              <Link href="/profile" className="text-muted hover:text-warm-white transition-colors">
                Profile
              </Link>
            )}
            <span className="text-warm-white" data-testid="navbar-display-name">
              <DisplayName name={user.display_name || user.username} />
            </span>
            <Link href="/logout" className="text-coral hover:text-coral/80 transition-colors">
              Logout
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
