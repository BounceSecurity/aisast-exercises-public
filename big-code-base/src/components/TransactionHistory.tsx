interface Transaction {
  id: number;
  from_user_id: number;
  to_user_id: number | null;
  to_account: string | null;
  amount: number;
  description: string | null;
  created_at: string;
  from_username: string;
  to_username: string | null;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  currentUsername: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "Z");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export default function TransactionHistory({
  transactions,
  currentUsername,
}: TransactionHistoryProps) {
  if (transactions.length === 0) {
    return (
      <div className="bg-navy-900 border border-navy-700/50 p-8 text-center">
        <p className="text-muted font-body">No transactions found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-navy-900 border border-navy-700/50">
      <table className="w-full" data-testid="transactions-table">
        <thead className="border-b border-navy-700">
          <tr>
            <th className="px-4 py-3 text-xs font-medium text-muted tracking-wider uppercase text-left">
              Date
            </th>
            <th className="px-4 py-3 text-xs font-medium text-muted tracking-wider uppercase text-left">
              From
            </th>
            <th className="px-4 py-3 text-xs font-medium text-muted tracking-wider uppercase text-left">
              To
            </th>
            <th className="px-4 py-3 text-xs font-medium text-muted tracking-wider uppercase text-right">
              Amount
            </th>
            <th className="px-4 py-3 text-xs font-medium text-muted tracking-wider uppercase text-left">
              Description
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => {
            const isOutgoing = tx.from_username === currentUsername;
            const recipientDisplay =
              tx.to_username || tx.to_account || "Unknown";

            return (
              <tr
                key={tx.id}
                className="border-b border-navy-800/50 hover:bg-navy-800/30 transition-colors"
                data-testid={`transaction-row-${tx.id}`}
              >
                <td className="px-4 py-3 text-sm text-muted">
                  {formatDate(tx.created_at)}
                </td>
                <td className="px-4 py-3 text-sm text-warm-white">
                  {tx.from_username}
                </td>
                <td className="px-4 py-3 text-sm text-warm-white">
                  {recipientDisplay}
                </td>
                <td
                  className={`px-4 py-3 text-sm text-right font-semibold ${
                    isOutgoing ? "text-coral" : "text-emerald"
                  }`}
                >
                  {isOutgoing ? "-" : "+"}
                  {formatCurrency(Math.abs(tx.amount))}
                </td>
                <td className="px-4 py-3 text-sm text-muted">
                  {tx.description || "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
