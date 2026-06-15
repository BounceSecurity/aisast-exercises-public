import { useState, useRef } from "react";

interface ImageUploadProps {
  currentImage: string | null;
  onUploaded: (path: string) => void;
}

export default function ImageUpload({ currentImage, onUploaded }: ImageUploadProps) {
  const [remoteUrl, setRemoteUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/profile/image/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Upload failed");
        return;
      }

      const data = await res.json();
      onUploaded(data.path);
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoteUpload() {
    if (!remoteUrl.trim()) return;

    setUploading(true);
    setError("");

    try {
      const res = await fetch("/api/profile/image/remote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: remoteUrl }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Remote upload failed");
        return;
      }

      const data = await res.json();
      onUploaded(data.path);
      setRemoteUrl("");
    } catch {
      setError("Remote upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      {currentImage && (
        <div className="mb-4">
          <p className="text-xs font-medium text-muted tracking-wider uppercase mb-2">Current Image</p>
          <img
            src={currentImage}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border border-navy-700/50"
            data-testid="profile-image-preview"
          />
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-muted tracking-wider uppercase mb-2">
          Upload from Device
        </label>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          disabled={uploading}
          className="block w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:border file:border-navy-600 file:text-sm file:font-medium file:bg-navy-900 file:text-warm-white hover:file:border-navy-500 file:cursor-pointer file:transition-all file:duration-300"
          data-testid="file-upload-input"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-muted tracking-wider uppercase mb-2">
          Upload from URL
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={remoteUrl}
            onChange={(e) => setRemoteUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            disabled={uploading}
            className="flex-1 bg-surface border border-navy-600 px-4 py-3 text-sm text-warm-white placeholder:text-muted/50 focus:border-gold-500 focus:outline-none transition-colors"
            data-testid="remote-url-input"
          />
          <button
            type="button"
            onClick={handleRemoteUpload}
            disabled={uploading || !remoteUrl.trim()}
            className="bg-gold-500 text-navy-950 px-5 py-2 text-sm font-semibold tracking-wider uppercase hover:bg-gold-400 transition-all duration-300 disabled:opacity-50"
            data-testid="remote-url-submit"
          >
            Fetch
          </button>
        </div>
      </div>

      {error && (
        <p className="text-coral text-sm" data-testid="image-upload-error">{error}</p>
      )}

      {uploading && (
        <p className="text-muted text-sm">Uploading...</p>
      )}
    </div>
  );
}
