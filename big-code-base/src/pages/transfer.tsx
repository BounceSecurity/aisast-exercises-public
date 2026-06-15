import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useUser } from "@/lib/UserContext";
import TransferForm from "@/components/TransferForm";
import TransferConfirmDialog from "@/components/TransferConfirmDialog";

export default function TransferPage() {
  const router = useRouter();
  const { user, loading: contextLoading, refresh } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [transferId, setTransferId] = useState<number | null>(null);
  const [pendingTransfer, setPendingTransfer] = useState<{
    recipient: string;
    amount: number;
    description: string;
  } | null>(null);
  const [confirmError, setConfirmError] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    if (contextLoading) return;
    if (!user) {
      router.replace("/login");
    }
  }, [user, contextLoading, router]);

  const processConfirm = async (id: number, transferData: { recipient: string; amount: number; description: string }) => {
    const confirmRes = await fetch("/api/transfers/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transfer_id: id }),
    });

    const confirmBody = await confirmRes.json();

    if (!confirmRes.ok) {
      return { error: confirmBody.error || "Transfer failed" };
    }

    return { balance: confirmBody.balance, transferData };
  };

  const handleSubmit = async (data: {
    recipient: string;
    amount: number;
    description: string;
  }) => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/transfers/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const body = await res.json();

      if (!res.ok) {
        setError(body.error || "Transfer failed");
        setLoading(false);
        return;
      }

      if (body.requires_confirmation) {
        setTransferId(body.transfer_id);
        setPendingTransfer(data);
        setLoading(false);
        return;
      }

      const result = await processConfirm(body.transfer_id, data);

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      setSuccess(
        `Transfer of $${data.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} to ${data.recipient} completed. New balance: $${result.balance!.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      );
      refresh();
    } catch {
      setError("An error occurred. Please try again.");
    }

    setLoading(false);
  };

  const handleConfirm = async (password: string) => {
    setConfirmError("");
    setConfirmLoading(true);

    try {
      const verifyRes = await fetch("/api/auth/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const verifyBody = await verifyRes.json();

      if (!verifyRes.ok || !verifyBody.valid) {
        setConfirmError("Invalid password");
        setConfirmLoading(false);
        return;
      }

      const result = await processConfirm(transferId!, pendingTransfer!);

      if (result.error) {
        setConfirmError(result.error);
        setConfirmLoading(false);
        return;
      }

      setTransferId(null);
      setPendingTransfer(null);
      setSuccess(
        `Transfer of $${pendingTransfer!.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} to ${pendingTransfer!.recipient} completed. New balance: $${result.balance!.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      );
      refresh();
    } catch {
      setConfirmError("An error occurred. Please try again.");
    }

    setConfirmLoading(false);
  };

  const handleCancel = () => {
    setTransferId(null);
    setPendingTransfer(null);
    setConfirmError("");
  };

  if (contextLoading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <p className="text-muted font-body tracking-wide">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-navy-950 p-8">
      <div className="max-w-lg mx-auto animate-fade-in">
        <h1 className="text-3xl font-display text-warm-white mb-2">
          Transfer Funds
        </h1>
        <div className="gold-rule mb-8" />

        <div className="bg-navy-900 border border-navy-700/50 p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm text-muted tracking-wider uppercase">
              Available Balance
            </span>
            <span
              className="text-lg font-semibold text-gold-400"
              data-testid="current-balance"
            >
              ${user.balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <TransferForm
            onSubmit={handleSubmit}
            loading={loading}
            error={error}
            success={success}
          />
        </div>

        {transferId && pendingTransfer && (
          <TransferConfirmDialog
            transferDetails={pendingTransfer}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            error={confirmError}
            loading={confirmLoading}
          />
        )}
      </div>
    </div>
  );
}
