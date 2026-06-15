import { useState } from "react";

interface TransferFormProps {
  onSubmit: (data: {
    recipient: string;
    amount: number;
    description: string;
  }) => void;
  loading?: boolean;
  error?: string;
  success?: string;
}

export default function TransferForm({
  onSubmit,
  loading,
  error,
  success,
}: TransferFormProps) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      recipient,
      amount: parseFloat(amount),
      description,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="recipient"
          className="block text-sm font-medium text-muted tracking-wider uppercase mb-1"
        >
          Recipient
        </label>
        <input
          id="recipient"
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          required
          placeholder="Username or external account"
          data-testid="transfer-recipient"
          className="w-full bg-surface border border-navy-600 text-warm-white px-4 py-3 text-sm font-body placeholder:text-muted/50 focus:outline-none focus:border-gold-500 transition-colors"
        />
      </div>

      <div>
        <label
          htmlFor="amount"
          className="block text-sm font-medium text-muted tracking-wider uppercase mb-1"
        >
          Amount
        </label>
        <input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          min="0.01"
          step="0.01"
          placeholder="0.00"
          data-testid="transfer-amount"
          className="w-full bg-surface border border-navy-600 text-warm-white px-4 py-3 text-sm font-body placeholder:text-muted/50 focus:outline-none focus:border-gold-500 transition-colors"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-muted tracking-wider uppercase mb-1"
        >
          Description (optional)
        </label>
        <input
          id="description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Payment for..."
          data-testid="transfer-description"
          className="w-full bg-surface border border-navy-600 text-warm-white px-4 py-3 text-sm font-body placeholder:text-muted/50 focus:outline-none focus:border-gold-500 transition-colors"
        />
      </div>

      {error && (
        <p className="text-coral text-sm" data-testid="transfer-error">
          {error}
        </p>
      )}

      {success && (
        <p className="text-emerald text-sm" data-testid="transfer-success">
          {success}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        data-testid="transfer-submit"
        className="bg-gold-500 text-navy-950 px-5 py-2 text-sm font-semibold tracking-wider uppercase hover:bg-gold-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Processing..." : "Send Transfer"}
      </button>
    </form>
  );
}
