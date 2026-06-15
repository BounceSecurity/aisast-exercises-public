import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useUser } from "@/lib/UserContext";
import ProfileView from "@/components/ProfileView";

interface ProfileData {
  id: number;
  username: string;
  display_name: string | null;
  profile_image: string | null;
  profile_html: string | null;
  date_of_birth: string | null;
  phone: string | null;
  address: string | null;
  balance: number;
  profile_public: number;
  template_content?: string;
}

export default function ProfileViewPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, loading: contextLoading } = useUser();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (contextLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!id) return;

    fetch(`/api/profiles/${id}`)
      .then(async (res) => {
        if (res.status === 403) {
          setError("This profile is private.");
          setLoading(false);
          return;
        }
        if (res.status === 404) {
          setError("Profile not found.");
          setLoading(false);
          return;
        }
        if (!res.ok) {
          router.replace("/login");
          return;
        }
        const data = await res.json();
        setProfile(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load profile.");
        setLoading(false);
      });
  }, [user, contextLoading, id, router]);

  if (loading || contextLoading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <p className="text-muted font-body tracking-wide">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-navy-950 p-8">
        <div className="max-w-2xl mx-auto animate-fade-in">
          <div className="bg-navy-900 border border-navy-700/50 p-6 text-center">
            <p className="text-coral" data-testid="profile-error">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-navy-950 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-display text-warm-white mb-2">
          {profile.display_name || profile.username}
        </h1>
        <div className="gold-rule mb-8" />
        <ProfileView profile={profile} />
      </div>
    </div>
  );
}
