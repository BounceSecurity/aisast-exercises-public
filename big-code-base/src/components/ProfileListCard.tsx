import Link from "next/link";

interface ProfileListCardProps {
  profile: {
    id: number;
    username: string;
    display_name: string | null;
    profile_image: string | null;
  };
}

export default function ProfileListCard({ profile }: ProfileListCardProps) {
  return (
    <Link
      href={`/profile/${profile.id}`}
      className="block bg-navy-900 border border-navy-700/50 p-4 hover:border-gold-500/50 transition-all duration-300"
      data-testid={`profile-card-${profile.username}`}
    >
      <div className="flex items-center gap-4">
        {profile.profile_image ? (
          <img
            src={profile.profile_image}
            alt={profile.display_name || profile.username}
            className="w-12 h-12 object-cover border border-navy-700/50"
          />
        ) : (
          <div className="w-12 h-12 bg-navy-800 border border-navy-700/50 flex items-center justify-center text-muted text-lg font-display">
            {(profile.display_name || profile.username).charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h3 className="text-sm font-display text-warm-white">
            {profile.display_name || profile.username}
          </h3>
          <p className="text-xs text-muted">@{profile.username}</p>
        </div>
      </div>
    </Link>
  );
}
