import { useState, FormEvent } from "react";

interface ImportResult {
  message: string;
  count: number;
  transactions: Array<{
    date: string;
    recipient: string;
    amount: number;
    description: string;
  }>;
}

export default function XmlImportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!file) {
      setError("Please select an XML file");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/transactions/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Import failed");
        return;
      }

      setResult(data);
      setFile(null);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-navy-900 border border-navy-700/50 p-6">
        <h2 className="text-lg font-display text-warm-white mb-4">
          XML Schema
        </h2>
        <p className="text-sm text-muted mb-4">
          Download the transaction schema to see the expected XML format.
        </p>
        <a
          href="/api/transactions/schema"
          download="transactions.xsd"
          className="inline-block border border-navy-600 text-muted px-5 py-2 text-sm font-medium tracking-wider uppercase hover:text-warm-white hover:border-navy-500 transition-all duration-300"
          data-testid="download-schema"
        >
          Download Schema (XSD)
        </a>
      </div>

      <div className="bg-navy-900 border border-navy-700/50 p-6">
        <h2 className="text-lg font-display text-warm-white mb-4">
          Import Transactions
        </h2>

        {error && (
          <div
            className="bg-coral/10 border border-coral/30 text-coral px-4 py-3 text-sm mb-4"
            data-testid="import-error"
          >
            {error}
          </div>
        )}

        {result && (
          <div
            className="bg-emerald/10 border border-emerald/30 text-emerald px-4 py-3 text-sm mb-4"
            data-testid="import-success"
          >
            {result.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="xml-file"
              className="block text-xs font-medium text-muted tracking-wider uppercase mb-2"
            >
              XML File
            </label>
            <input
              id="xml-file"
              type="file"
              accept=".xml"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:border file:border-navy-600 file:text-sm file:font-medium file:bg-navy-900 file:text-warm-white hover:file:border-navy-500 file:cursor-pointer file:transition-all file:duration-300"
              data-testid="xml-file-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !file}
            className="bg-gold-500 text-navy-950 px-5 py-2 text-sm font-semibold tracking-wider uppercase hover:bg-gold-400 disabled:opacity-50 transition-all duration-300"
            data-testid="import-submit"
          >
            {loading ? "Importing..." : "Import Transactions"}
          </button>
        </form>
      </div>

      {result && result.transactions.length > 0 && (
        <div className="bg-navy-900 border border-navy-700/50 p-6">
          <h2 className="text-lg font-display text-warm-white mb-4">
            Imported Transactions
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="imported-transactions">
              <thead className="border-b border-navy-700">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium text-muted tracking-wider uppercase text-left">
                    Date
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-muted tracking-wider uppercase text-left">
                    Recipient
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-muted tracking-wider uppercase text-left">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-muted tracking-wider uppercase text-left">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.transactions.map((tx, i) => (
                  <tr
                    key={i}
                    className="border-b border-navy-800/50"
                  >
                    <td className="px-4 py-3 text-sm text-warm-white">
                      {tx.date}
                    </td>
                    <td className="px-4 py-3 text-sm text-warm-white">
                      {tx.recipient}
                    </td>
                    <td className="px-4 py-3 text-sm text-warm-white">
                      ${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted">
                      {tx.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
