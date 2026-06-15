interface ProfileCardProps {
  username: string;
  role: string;
  secretQuestion1: string;
  secretQuestion2: string;
}

export default function ProfileCard({
  username,
  role,
  secretQuestion1,
  secretQuestion2,
}: ProfileCardProps) {
  return (
    <div className="bg-navy-900 border border-navy-700/50 p-6">
      <h2 className="text-lg font-display text-warm-white mb-4">Profile Information</h2>
      <dl className="space-y-4">
        <div className="flex">
          <dt className="text-sm font-medium text-muted tracking-wider uppercase w-48">Username</dt>
          <dd className="text-sm text-warm-white" data-testid="profile-username">{username}</dd>
        </div>
        <div className="flex">
          <dt className="text-sm font-medium text-muted tracking-wider uppercase w-48">Role</dt>
          <dd className="text-sm text-warm-white" data-testid="profile-role">{role}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-muted tracking-wider uppercase mb-1">Security Question 1</dt>
          <dd className="text-sm text-warm-white/70 ml-4" data-testid="profile-sq1">
            {secretQuestion1}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-muted tracking-wider uppercase mb-1">Security Question 2</dt>
          <dd className="text-sm text-warm-white/70 ml-4" data-testid="profile-sq2">
            {secretQuestion2}
          </dd>
        </div>
      </dl>
    </div>
  );
}
