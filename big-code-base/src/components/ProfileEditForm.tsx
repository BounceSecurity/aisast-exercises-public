import { useState } from "react";
import { containsProfanity } from "@/lib/profanityFilter";
import RichTextEditor from "@/components/RichTextEditor";

interface ProfileData {
  display_name: string;
  date_of_birth: string;
  phone: string;
  address: string;
  profile_html: string;
  profile_public: boolean;
}

interface ProfileEditFormProps {
  initialData: ProfileData;
  onSave: (data: ProfileData) => Promise<void>;
}

export default function ProfileEditForm({ initialData, onSave }: ProfileEditFormProps) {
  const [formData, setFormData] = useState<ProfileData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  function validate(): Record<string, string> {
    const newErrors: Record<string, string> = {};

    if (formData.display_name && containsProfanity(formData.display_name)) {
      newErrors.display_name = "Display name contains inappropriate language";
    }

    if (formData.date_of_birth) {
      const date = new Date(formData.date_of_birth);
      if (isNaN(date.getTime())) {
        newErrors.date_of_birth = "Please enter a valid date";
      } else if (date >= new Date()) {
        newErrors.date_of_birth = "Date of birth must be in the past";
      }
    }

    if (formData.phone) {
      const phoneClean = formData.phone.replace(/[\s\-\(\)\+]/g, "");
      if (!/^\d+$/.test(phoneClean)) {
        newErrors.phone = "Phone number must contain only digits";
      }
    }

    if (formData.address && formData.address.length > 500) {
      newErrors.address = "Address must be 500 characters or less";
    }

    return newErrors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(false);

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
      setSuccess(true);
    } catch {
      setErrors({ form: "Failed to save profile" });
    } finally {
      setSaving(false);
    }
  }

  function handleChange(field: keyof ProfileData, value: string | boolean) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      delete next.form;
      return next;
    });
    setSuccess(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="profile-edit-form">
      <div>
        <label htmlFor="display_name" className="block text-xs font-medium text-muted tracking-wider uppercase mb-2">
          Display Name
        </label>
        <input
          id="display_name"
          type="text"
          value={formData.display_name}
          onChange={(e) => handleChange("display_name", e.target.value)}
          className="w-full bg-surface border border-navy-600 px-4 py-3 text-sm text-warm-white placeholder:text-muted/50 focus:border-gold-500 focus:outline-none transition-colors"
          data-testid="display-name-input"
        />
        <p className="text-muted text-xs mt-1">Display names are subject to a content filter.</p>
        {errors.display_name && (
          <p className="text-coral text-sm mt-1" data-testid="display-name-error">{errors.display_name}</p>
        )}
      </div>

      <div>
        <label htmlFor="date_of_birth" className="block text-xs font-medium text-muted tracking-wider uppercase mb-2">
          Date of Birth
        </label>
        <input
          id="date_of_birth"
          type="date"
          value={formData.date_of_birth}
          onChange={(e) => handleChange("date_of_birth", e.target.value)}
          className="w-full bg-surface border border-navy-600 px-4 py-3 text-sm text-warm-white focus:border-gold-500 focus:outline-none transition-colors"
          data-testid="dob-input"
        />
        {errors.date_of_birth && (
          <p className="text-coral text-sm mt-1" data-testid="dob-error">{errors.date_of_birth}</p>
        )}
      </div>

      <div>
        <label htmlFor="phone" className="block text-xs font-medium text-muted tracking-wider uppercase mb-2">
          Phone
        </label>
        <input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          className="w-full bg-surface border border-navy-600 px-4 py-3 text-sm text-warm-white placeholder:text-muted/50 focus:border-gold-500 focus:outline-none transition-colors"
          data-testid="phone-input"
        />
        {errors.phone && (
          <p className="text-coral text-sm mt-1" data-testid="phone-error">{errors.phone}</p>
        )}
      </div>

      <div>
        <label htmlFor="address" className="block text-xs font-medium text-muted tracking-wider uppercase mb-2">
          Address
        </label>
        <textarea
          id="address"
          value={formData.address}
          onChange={(e) => handleChange("address", e.target.value)}
          rows={3}
          className="w-full bg-surface border border-navy-600 px-4 py-3 text-sm text-warm-white placeholder:text-muted/50 focus:border-gold-500 focus:outline-none transition-colors resize-none"
          data-testid="address-input"
        />
        {errors.address && (
          <p className="text-coral text-sm mt-1" data-testid="address-error">{errors.address}</p>
        )}
      </div>

      <div>
        <label htmlFor="profile_html" className="block text-xs font-medium text-muted tracking-wider uppercase mb-2">
          About Me
        </label>
        <RichTextEditor
          value={formData.profile_html}
          onChange={(html) => handleChange("profile_html", html)}
          testId="profile-html-input"
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          id="profile_public"
          type="checkbox"
          checked={formData.profile_public}
          onChange={(e) => handleChange("profile_public", e.target.checked)}
          className="w-4 h-4 accent-gold-500"
          data-testid="profile-public-input"
        />
        <label htmlFor="profile_public" className="text-xs font-medium text-muted tracking-wider uppercase">
          Make profile public
        </label>
      </div>

      {errors.form && (
        <p className="text-coral text-sm" data-testid="form-error">{errors.form}</p>
      )}

      {success && (
        <p className="text-emerald text-sm" data-testid="save-success">Profile saved successfully</p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="bg-gold-500 text-navy-950 px-5 py-2 text-sm font-semibold tracking-wider uppercase hover:bg-gold-400 transition-all duration-300 disabled:opacity-50"
        data-testid="save-profile-button"
      >
        {saving ? "Saving..." : "Save Profile"}
      </button>
    </form>
  );
}
