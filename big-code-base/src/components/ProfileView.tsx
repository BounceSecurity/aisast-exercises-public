interface ProfileViewProps {
  profile: {
    id: number;
    username: string;
    display_name: string | null;
    profile_image: string | null;
    profile_html: string | null;
    date_of_birth: string | null;
    phone: string | null;
    address: string | null;
    template_content?: string;
  };
}

export default function ProfileView({ profile }: ProfileViewProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-navy-900 border border-navy-700/50 p-6">
        <div className="flex items-start gap-6">
          {profile.profile_image && (
            <img
              src={profile.profile_image}
              alt={profile.display_name || profile.username}
              className="w-24 h-24 object-cover border border-navy-700/50"
              data-testid="profile-image"
            />
          )}
          <div>
            <h2
              className="text-2xl font-display text-warm-white"
              data-testid="profile-display-name"
            >
              {profile.display_name || profile.username}
            </h2>
            <p className="text-sm text-muted mt-1">@{profile.username}</p>
          </div>
        </div>
      </div>

      {profile.profile_html && (
        <div className="bg-navy-900 border border-navy-700/50 p-6">
          <h3 className="text-xs font-medium text-muted tracking-wider uppercase mb-4">
            About
          </h3>
          <div
            className="text-warm-white font-body prose-warm"
            data-testid="profile-html-content"
            dangerouslySetInnerHTML={{ __html: profile.profile_html }}
          />
        </div>
      )}

      {profile.template_content && (
        <div className="bg-navy-900 border border-navy-700/50 p-6">
          <h3 className="text-xs font-medium text-muted tracking-wider uppercase mb-4">
            Custom Content
          </h3>
          <div
            className="text-warm-white font-body prose-warm"
            data-testid="template-content"
            dangerouslySetInnerHTML={{ __html: profile.template_content }}
          />
        </div>
      )}

      <div className="bg-navy-900 border border-navy-700/50 p-6">
        <h3 className="text-xs font-medium text-muted tracking-wider uppercase mb-4">
          Details
        </h3>
        <dl className="space-y-3">
          {profile.date_of_birth && (
            <div className="flex">
              <dt className="text-sm font-medium text-muted tracking-wider uppercase w-40">
                Date of Birth
              </dt>
              <dd className="text-sm text-warm-white" data-testid="profile-dob">
                {profile.date_of_birth}
              </dd>
            </div>
          )}
          {profile.phone && (
            <div className="flex">
              <dt className="text-sm font-medium text-muted tracking-wider uppercase w-40">
                Phone
              </dt>
              <dd className="text-sm text-warm-white" data-testid="profile-phone">
                {profile.phone}
              </dd>
            </div>
          )}
          {profile.address && (
            <div className="flex">
              <dt className="text-sm font-medium text-muted tracking-wider uppercase w-40">
                Address
              </dt>
              <dd className="text-sm text-warm-white" data-testid="profile-address">
                {profile.address}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
