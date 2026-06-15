import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import ProfileCard from "@/components/ProfileCard";
import MfaToggle from "@/components/MfaToggle";
import DisplayName from "@/components/DisplayName";

interface UserData {
  id: number;
  username: string;
  role: string;
  mfa_enabled: number;
  email: string;
  display_name: string | null;
  profile_image: string | null;
  secret_question_1: string;
  secret_question_2: string;
  created_at: string;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

export default function ProfilePage() {
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

  return (
    <div className="min-h-screen bg-navy-950 p-8">
      <div className="max-w-2xl mx-auto animate-fade-in">
        <h1 className="text-3xl font-display text-warm-white mb-2">Your Profile</h1>
        <div className="gold-rule mb-8" />

        <div className="space-y-6">
          {(user.profile_image || user.display_name) && (
            <div className="bg-navy-900 border border-navy-700/50 p-6 flex items-center gap-6">
              {user.profile_image && (
                <img
                  src={user.profile_image}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border border-navy-700/50"
                  data-testid="profile-image"
                />
              )}
              {user.display_name && (
                <DisplayName
                  name={user.display_name}
                  className="text-xl font-display text-warm-white"
                  data-testid="profile-display-name"
                />
              )}
            </div>
          )}

          <ProfileCard
            username={user.username}
            role={user.role}
            secretQuestion1={user.secret_question_1}
            secretQuestion2={user.secret_question_2}
          />

          <MfaToggle
            enabled={!!user.mfa_enabled}
            onToggle={(newState) => {
              setUser((prev) =>
                prev ? { ...prev, mfa_enabled: newState ? 1 : 0 } : prev
              );
            }}
          />

          <div className="flex gap-4">
            <Link
              href="/profile/edit"
              className="bg-gold-500 text-navy-950 px-5 py-2 text-sm font-semibold tracking-wider uppercase hover:bg-gold-400 transition-all duration-300"
              data-testid="edit-profile-link"
            >
              Edit Profile
            </Link>
            <Link
              href="/change-password"
              className="bg-gold-500 text-navy-950 px-5 py-2 text-sm font-semibold tracking-wider uppercase hover:bg-gold-400 transition-all duration-300"
              data-testid="change-password-link"
            >
              Change Password
            </Link>
            <Link
              href="/dashboard"
              className="border border-navy-600 text-muted px-5 py-2 text-sm font-medium tracking-wider uppercase hover:text-warm-white hover:border-navy-500 transition-all duration-300"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
