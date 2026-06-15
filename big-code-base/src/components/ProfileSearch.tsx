import { useState, useEffect, useRef } from "react";

interface ProfileSearchProps {
  onResults: (results: Array<Record<string, unknown>>) => void;
  onClear: () => void;
}

export default function ProfileSearch({ onResults, onClear }: ProfileSearchProps) {
  const [query, setQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      onClear();
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/profiles/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          onResults(data);
        }
      } catch {
        onClear();
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, onResults, onClear]);

  return (
    <div className="mb-6">
      <label
        htmlFor="profile-search"
        className="block text-xs font-medium text-muted tracking-wider uppercase mb-2"
      >
        Search Profiles
      </label>
      <input
        id="profile-search"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by username, display name, or address..."
        className="w-full bg-surface border border-navy-600 text-warm-white px-4 py-3 focus:border-gold-500 focus:outline-none transition-colors"
        data-testid="profile-search-input"
      />
    </div>
  );
}
