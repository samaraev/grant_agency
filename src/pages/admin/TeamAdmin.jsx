import { useEffect, useState } from 'react';
import { Plus, Trash2, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Image } from '@/components/ui/image';
import { base44 } from '@/api/base44Client';
import { t } from '@/lib/i18n';

const FIELD =
  'h-[40px] w-full border border-white/10 bg-[#1f272b] px-3 text-[13px] text-white focus:border-[#c8102e] focus:outline-none';

const EMPTY = { name: '', role: '', local_bio: '', photo_url: '', is_public: true };

export default function TeamAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState(null);
  const [uploading, setUploading] = useState(false);

  const load = () => {
    setLoading(true);
    base44.entities.TeamMember.list({ limit: 100 })
      .then((page) => setItems(page?.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const save = async () => {
    if (!draft?.name) return;
    const payload = {
      name: draft.name,
      role: draft.role,
      local_bio: draft.local_bio,
      photo_url: draft.photo_url,
      is_public: Boolean(draft.is_public),
    };
    if (draft.id) await base44.entities.TeamMember.update(draft.id, payload);
    else await base44.entities.TeamMember.create(payload);
    setDraft(null);
    load();
  };

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setDraft((current) => ({ ...current, photo_url: file_url }));
    } finally {
      setUploading(false);
    }
  };

  const remove = async (id) => {
    await base44.entities.TeamMember.delete(id);
    load();
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">{t.admin.marker}</div>
          <h1 className="mt-3 text-[26px] font-bold text-white">{t.admin.team.title}</h1>
          <p className="mt-2 text-[13px] text-[#8f9a9f]">{t.admin.team.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => setDraft({ ...EMPTY })}
          className="flex min-h-[40px] items-center gap-2 bg-[#c8102e] px-4 text-[12.5px] font-semibold text-white"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          {t.admin.team.add}
        </button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="h-32 animate-pulse border border-white/10 bg-[#263033]" />
        ) : items.length ? (
          items.map((member) => (
            <div key={member.id} className="border border-white/10 bg-[#263033] p-4">
              <div className="flex items-center gap-3">
                {member.photo_url ? (
                  <Image src={member.photo_url} alt={member.name} className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center border border-white/15 text-[14px] font-bold text-[#f4a7b0]">
                    {member.name.slice(0, 1)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="truncate text-[14.5px] font-semibold text-white">{member.name}</div>
                  <div className="truncate text-[11.5px] text-[#8f9a9f]">{member.role}</div>
                </div>
              </div>
              <p className="mt-3 line-clamp-3 text-[12.5px] leading-relaxed text-[#b0b8bc]">
                {member.local_bio}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDraft({ ...member })}
                  className="min-h-[34px] border border-white/15 px-3 text-[12px] text-white"
                >
                  {t.admin.common.edit}
                </button>
                <button
                  type="button"
                  onClick={() => remove(member.id)}
                  aria-label={t.admin.common.delete}
                  className="flex min-h-[34px] items-center border border-white/10 px-3 text-[#8f9a9f] hover:border-[#c8102e] hover:text-[#f4a7b0]"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <span className="ml-auto text-[10.5px] uppercase tracking-[0.14em] text-[#778287]">
                  {member.is_public ? 'public' : 'hidden'}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-[13px] text-[#8f9a9f]">{t.admin.team.empty}</p>
        )}
      </div>

      <Dialog open={Boolean(draft)} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-w-[560px] border-white/10 bg-[#263033]">
          <DialogTitle className="text-[18px] font-bold text-white">{t.admin.team.form.title}</DialogTitle>
          {draft ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="tm-name" className="eyebrow mb-2 block">
                    {t.admin.team.form.name}
                  </label>
                  <input
                    id="tm-name"
                    value={draft.name}
                    onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                    className={FIELD}
                  />
                </div>
                <div>
                  <label htmlFor="tm-role" className="eyebrow mb-2 block">
                    {t.admin.team.form.role}
                  </label>
                  <input
                    id="tm-role"
                    value={draft.role}
                    onChange={(event) => setDraft({ ...draft, role: event.target.value })}
                    className={FIELD}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="tm-bio" className="eyebrow mb-2 block">
                  {t.admin.team.form.bio}
                </label>
                <textarea
                  id="tm-bio"
                  value={draft.local_bio}
                  onChange={(event) => setDraft({ ...draft, local_bio: event.target.value })}
                  rows={4}
                  className="w-full resize-none border border-white/10 bg-[#1f272b] p-3 text-[13px] text-white focus:border-[#c8102e] focus:outline-none"
                />
              </div>
              <div>
                <div className="eyebrow mb-2">{t.admin.team.form.photo}</div>
                <label className="flex min-h-[42px] cursor-pointer items-center gap-2 border border-white/15 px-4 text-[12.5px] text-white">
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  {uploading ? t.admin.common.loading : t.admin.team.form.upload}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => upload(event.target.files?.[0])}
                  />
                </label>
                {draft.photo_url ? (
                  <Image src={draft.photo_url} alt={draft.name} className="mt-3 h-20 w-20 rounded-full object-cover" />
                ) : null}
              </div>
              <label className="flex items-center gap-3 text-[13px] text-[#d7dcde]">
                <input
                  type="checkbox"
                  checked={Boolean(draft.is_public)}
                  onChange={(event) => setDraft({ ...draft, is_public: event.target.checked })}
                  className="h-4 w-4 accent-[#c8102e]"
                />
                {t.admin.team.form.isPublic}
              </label>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={save}
                  className="min-h-[42px] bg-[#c8102e] px-5 text-[13px] font-semibold text-white"
                >
                  {t.admin.team.form.save}
                </button>
                <button
                  type="button"
                  onClick={() => setDraft(null)}
                  className="min-h-[42px] border border-white/15 px-4 text-[13px] text-[#d7dcde]"
                >
                  {t.admin.common.cancel}
                </button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}