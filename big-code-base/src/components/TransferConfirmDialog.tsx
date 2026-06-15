import { useState } from "react";

interface TransferDetails {
  recipient: string;
  amount: number;
  description: string;
}

interface TransferConfirmDialogProps {
  transferDetails: TransferDetails;
  onConfirm: (password: string) => void;
  onCancel: () => void;
  error?: string;
  loading?: boolean;
}

export default function TransferConfirmDialog({
  transferDetails,
  onConfirm,
  onCancel,
  error,
  loading,
}: TransferConfirmDialogProps) {
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(password);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" data-testid="confirm-dialog">
      <div className="bg-navy-900 border border-navy-700/50 p-8 max-w-md w-full mx-4 animate-fade-in">
        <h2 className="text-xl font-display text-warm-white mb-4">
          Confirm Transfer
        </h2>
        <div className="gold-rule mb-6" />

        <div className="space-y-3 mb-6">
          <div className="flex justify-between">
            <span className="text-sm text-muted tracking-wider uppercase">
              Recipient
            </span>
            <span
              className="text-sm text-warm-white"
              data-testid="confirm-recipient"
            >
              {transferDetails.recipient}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted tracking-wider uppercase">
              Amount
            </span>
            <span
              className="text-sm text-gold-400 font-semibold"
              data-testid="confirm-amount"
            >
              ${transferDetails.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          {transferDetails.description && (
            <div className="flex justify-between">
              <span className="text-sm text-muted tracking-wider uppercase">
                Description
              </span>
              <span className="text-sm text-warm-white">
                {transferDetails.description}
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="confirm-password"
              className="block text-sm font-medium text-muted tracking-wider uppercase mb-1"
            >
              Enter your password to confirm
            </label>
            <input
              id="confirm-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              data-testid="confirm-password"
              className="w-full bg-surface border border-navy-600 text-warm-white px-4 py-3 text-sm font-body placeholder:text-muted/50 focus:outline-none focus:border-gold-500 transition-colors"
            />
          </div>

          {error && (
            <p className="text-coral text-sm" data-testid="confirm-error">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              data-testid="confirm-submit"
              className="bg-gold-500 text-navy-950 px-5 py-2 text-sm font-semibold tracking-wider uppercase hover:bg-gold-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Confirming..." : "Confirm Transfer"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              data-testid="confirm-cancel"
              className="border border-navy-600 text-muted px-5 py-2 text-sm font-medium tracking-wider uppercase hover:text-warm-white hover:border-navy-500 transition-all duration-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
