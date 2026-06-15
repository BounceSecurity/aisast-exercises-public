import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useUser } from "@/lib/UserContext";
import ProfileEditForm from "@/components/ProfileEditForm";
import ImageUpload from "@/components/ImageUpload";
import TemplateUpload from "@/components/TemplateUpload";

interface ProfileData {
  id: number;
  username: string;
  display_name: string | null;
  profile_html: string | null;
  profile_image: string | null;
  date_of_birth: string | null;
  phone: string | null;
  address: string | null;
  profile_public: number;
  profile_template: string | null;
}

export default function ProfileEditPage() {
  const router = useRouter();
  const { user: contextUser, loading: contextLoading, refresh } = useUser();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(() => {
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
          setProfile(data);
        }
        setLoading(false);
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

  useEffect(() => {
    if (contextLoading) return;
    if (!contextUser) {
      router.replace("/login");
      return;
    }

    loadProfile();
  }, [contextUser, contextLoading, router, loadProfile]);

  async function handleSave(data: {
    display_name: string;
    date_of_birth: string;
    phone: string;
    address: string;
    profile_html: string;
    profile_public: boolean;
  }) {
    const res = await fetch("/api/profile/edit", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error("Failed to save");
    }

    const updated = await res.json();
    setProfile(updated);
    refresh();
  }

  function handleImageUploaded(imagePath: string) {
    setProfile((prev) => (prev ? { ...prev, profile_image: imagePath } : prev));
    refresh();
  }

  function handleTemplateUploaded(templatePath: string) {
    setProfile((prev) => (prev ? { ...prev, profile_template: templatePath } : prev));
    refresh();
  }

  if ((loading || contextLoading) && !profile) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <p className="text-muted font-body tracking-wide">Loading...</p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-navy-950 p-8">
      <div className="max-w-2xl mx-auto animate-fade-in">
        <h1 className="text-3xl font-display text-warm-white mb-2">Edit Profile</h1>
        <div className="gold-rule mb-8" />

        <div className="space-y-8">
          <div className="bg-navy-900 border border-navy-700/50 p-6">
            <h2 className="text-lg font-display text-warm-white mb-4">Profile Image</h2>
            <ImageUpload
              currentImage={profile.profile_image}
              onUploaded={handleImageUploaded}
            />
          </div>

          <div className="bg-navy-900 border border-navy-700/50 p-6">
            <h2 className="text-lg font-display text-warm-white mb-4">Profile Template</h2>
            <p className="text-sm text-muted mb-4">Upload a JavaScript template to customize your profile page.</p>
            <TemplateUpload
              currentTemplate={profile.profile_template}
              onUploaded={handleTemplateUploaded}
            />
          </div>

          <div className="bg-navy-900 border border-navy-700/50 p-6">
            <h2 className="text-lg font-display text-warm-white mb-4">Profile Details</h2>
            <ProfileEditForm
              initialData={{
                display_name: profile.display_name || "",
                date_of_birth: profile.date_of_birth || "",
                phone: profile.phone || "",
                address: profile.address || "",
                profile_html: profile.profile_html || "",
                profile_public: !!profile.profile_public,
              }}
              onSave={handleSave}
            />
          </div>

          <div className="flex gap-4">
            <Link
              href="/profile"
              className="border border-navy-600 text-muted px-5 py-2 text-sm font-medium tracking-wider uppercase hover:text-warm-white hover:border-navy-500 transition-all duration-300"
            >
              Back to Profile
            </Link>
            <Link
              href="/dashboard"
              className="border border-navy-600 text-muted px-5 py-2 text-sm font-medium tracking-wider uppercase hover:text-warm-white hover:border-navy-500 transition-all duration-300"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
