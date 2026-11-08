import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { t } from '@/lib/i18n';

const FIELD =
  'h-[40px] w-full border border-white/10 bg-[#1f272b] px-3 text-[13px] text-white focus:border-[#c8102e] focus:outline-none';

const FIELDS = [
  { key: 'phone', label: 'phone' },
  { key: 'email', label: 'email' },
  { key: 'office_address', label: 'office' },
  { key: 'office_landmark', label: 'landmark' },
  { key: 'working_hours', label: 'hours' },
  { key: 'telegram', label: 'telegram' },
  { key: 'whatsapp', label: 'whatsapp' },
  { key: 'vk', label: 'vk' },
  { key: 'admin_email', label: 'adminEmail' },
];

export default function SettingsAdmin() {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    base44.entities.SiteSettings.list({ limit: 1 })
      .then((page) => setRecord(page?.items?.[0] || { ...t.settings }))
      .catch(() => setRecord({ ...t.settings }))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {};
      FIELDS.forEach((field) => {
        payload[field.key] = record?.[field.key] || '';
      });
      if (record?.id) await base44.entities.SiteSettings.update(record.id, payload);
      else {
        const created = await base44.entities.SiteSettings.create(payload);
        setRecord(created);
      }
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="eyebrow">{t.admin.marker}</div>
      <h1 className="mt-3 text-[26px] font-bold text-white">{t.admin.settings.title}</h1>
      <p className="mt-2 text-[13px] text-[#8f9a9f]">{t.admin.settings.subtitle}</p>

      {loading || !record ? (
        <div className="mt-8 h-40 animate-pulse border border-white/10 bg-[#263033]" />
      ) : (
        <div className="mt-8 max-w-2xl border border-white/10 bg-[#263033] p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map((field) => (
              <div key={field.key} className={field.key === 'office_address' ? 'sm:col-span-2' : ''}>
                <label htmlFor={`set-${field.key}`} className="eyebrow mb-2 block">
                  {t.admin.settings[field.label]}
                </label>
                <input
                  id={`set-${field.key}`}
                  value={record[field.key] || ''}
                  onChange={(event) => setRecord({ ...record, [field.key]: event.target.value })}
                  className={FIELD}
                />
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="min-h-[42px] bg-[#c8102e] px-5 text-[13px] font-semibold text-white disabled:opacity-60"
            >
              {saving ? t.admin.common.loading : t.admin.settings.save}
            </button>
            {saved ? <span className="text-[12px] text-[#f4a7b0]">{t.admin.settings.saved}</span> : null}
          </div>
        </div>
      )}
    </div>
  );
}