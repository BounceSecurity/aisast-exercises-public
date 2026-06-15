import { useState, useRef } from "react";

interface TemplateUploadProps {
  currentTemplate: string | null;
  onUploaded: (path: string) => void;
}

export default function TemplateUpload({ currentTemplate, onUploaded }: TemplateUploadProps) {
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
      const res = await fetch("/api/profile/template/upload", {
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

  const filename = currentTemplate ? currentTemplate.split("/").pop() : null;

  return (
    <div className="space-y-4">
      {filename && (
        <div className="mb-4">
          <p className="text-xs font-medium text-muted tracking-wider uppercase mb-2">Current Template</p>
          <p className="text-sm text-warm-white" data-testid="current-template">{filename}</p>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-muted tracking-wider uppercase mb-2">
          Upload Template
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".js"
          onChange={handleFileUpload}
          disabled={uploading}
          className="block w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:border file:border-navy-600 file:text-sm file:font-medium file:bg-navy-900 file:text-warm-white hover:file:border-navy-500 file:cursor-pointer file:transition-all file:duration-300"
          data-testid="template-upload-input"
        />
      </div>

      {error && (
        <p className="text-coral text-sm" data-testid="template-upload-error">{error}</p>
      )}

      {uploading && (
        <p className="text-muted text-sm">Uploading...</p>
      )}
    </div>
  );
}
