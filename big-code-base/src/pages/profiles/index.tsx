import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { useUser } from "@/lib/UserContext";
import ProfileListCard from "@/components/ProfileListCard";
import ProfileSearch from "@/components/ProfileSearch";

interface PublicProfile {
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
}

export default function PublicProfilesPage() {
  const router = useRouter();
  const { user, loading: contextLoading } = useUser();
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [searchResults, setSearchResults] = useState<PublicProfile[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (contextLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    fetch("/api/profiles")
      .then((res) => {
        if (!res.ok) {
          router.replace("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setProfiles(data);
        setLoading(false);
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [user, contextLoading, router]);

  const handleSearchResults = useCallback((results: Array<Record<string, unknown>>) => {
    setSearchResults(results as unknown as PublicProfile[]);
  }, []);

  const handleClear = useCallback(() => {
    setSearchResults(null);
  }, []);

  if (loading || contextLoading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <p className="text-muted font-body tracking-wide">Loading...</p>
      </div>
    );
  }

  const displayProfiles = searchResults !== null ? searchResults : profiles;

  return (
    <div className="min-h-screen bg-navy-950 p-8">
      <div className="max-w-2xl mx-auto animate-fade-in">
        <h1 className="text-3xl font-display text-warm-white mb-2">
          Public Profiles
        </h1>
        <div className="gold-rule mb-8" />

        <ProfileSearch onResults={handleSearchResults} onClear={handleClear} />

        {displayProfiles.length === 0 ? (
          <div className="bg-navy-900 border border-navy-700/50 p-6 text-center">
            <p className="text-muted" data-testid="no-profiles">
              {searchResults !== null
                ? "No profiles match your search."
                : "No public profiles found."}
            </p>
          </div>
        ) : (
          <div className="space-y-3" data-testid="profiles-list">
            {displayProfiles.map((profile) => (
              <ProfileListCard key={profile.id} profile={profile} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
