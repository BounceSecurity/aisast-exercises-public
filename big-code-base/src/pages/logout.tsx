import { useEffect } from "react";
import { useRouter } from "next/router";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    async function performLogout() {
      await fetch("/api/auth/logout", { method: "POST" });

      document.cookie = "token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie =
        "ui_setting=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT";

      router.replace("/");
    }

    performLogout();
  }, [router]);

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center">
      <p className="text-muted font-body tracking-wider uppercase text-sm">Signing out...</p>
    </div>
  );
}
