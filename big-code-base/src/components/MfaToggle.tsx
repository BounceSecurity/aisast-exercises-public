import { useState } from "react";

interface MfaToggleProps {
  enabled: boolean;
  onToggle: (newState: boolean) => void;
}

export default function MfaToggle({ enabled, onToggle }: MfaToggleProps) {
  const [mfaEnabled, setMfaEnabled] = useState(enabled);
  const [updating, setUpdating] = useState(false);

  const handleToggle = () => {
    const newState = !mfaEnabled;
    setUpdating(true);

    fetch("/api/profile/mfa", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: newState }),
    })
      .then((res) => {
        if (res.ok) {
          setMfaEnabled(newState);
          onToggle(newState);
        }
      })
      .finally(() => {
        setUpdating(false);
      });
  };

  return (
    <div className="bg-navy-900 border border-navy-700/50 p-6">
      <h2 className="text-lg font-display text-warm-white mb-4">Multi-Factor Authentication</h2>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={mfaEnabled}
            onChange={handleToggle}
            disabled={updating}
            data-testid="mfa-toggle"
            className="w-5 h-5 accent-gold-500"
          />
          <span className="text-sm text-warm-white" data-testid="mfa-status">
            MFA is {mfaEnabled ? "enabled" : "disabled"}
          </span>
        </label>
        {updating && <span className="text-muted text-sm">Updating...</span>}
      </div>
    </div>
  );
}
