import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const FIELD =
  'h-[40px] w-full border border-white/10 bg-[#1f272b] px-3 text-[13px] text-white focus:border-[#c8102e] focus:outline-none';

const EMPTY = { title: '', short_description: '', audience: 'all', status: 'active', sort_order: 10 };

export default function ServicesAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState(null);

  const load = () => {
    setLoading(true);
    base44.entities.Service.list({ sort: 'sort_order', limit: 100 })
      .then((page) => setItems(page?.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const save = async () => {
    if (!draft?.title) return;
    const payload = {
      title: draft.title,
      short_description: draft.short_description,
      audience: draft.audience,
      status: draft.status,
      sort_order: Number(draft.sort_order) || 0,
    };
    if (draft.id) await base44.entities.Service.update(draft.id, payload);
    else await base44.entities.Service.create(payload);
    setDraft(null);
    load();
  };

  const remove = async (id) => {
    await base44.entities.Service.delete(id);
    load();
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">{t.admin.marker}</div>
          <h1 className="mt-3 text-[26px] font-bold text-white">{t.admin.services.title}</h1>
          <p className="mt-2 text-[13px] text-[#8f9a9f]">{t.admin.services.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => setDraft({ ...EMPTY })}
          className="flex min-h-[40px] items-center gap-2 bg-[#c8102e] px-4 text-[12.5px] font-semibold text-white"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          {t.admin.services.add}
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="h-24 animate-pulse border border-white/10 bg-[#263033]" />
        ) : items.length ? (
          items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-start justify-between gap-4 border border-white/10 bg-[#263033] p-4"
            >
              <div className="max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'px-2 py-0.5 text-[10px] uppercase tracking-[0.14em]',
                      item.status === 'planned' ? 'bg-white/10 text-[#b0b8bc]' : 'bg-[#c8102e] text-white'
                    )}
                  >
                    {t.admin.services.statusLabels[item.status] || item.status}
                  </span>
                  <span className="text-[10.5px] uppercase tracking-[0.14em] text-[#778287]">
                    {t.admin.services.audienceLabels[item.audience] || item.audience}
                  </span>
                </div>
                <h3 className="mt-2 text-[15.5px] font-semibold text-white">{item.title}</h3>
                <p className="mt-1 text-[13px] text-[#b0b8bc]">{item.short_description}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDraft({ ...item })}
                  className="min-h-[36px] border border-white/15 px-3 text-[12px] text-white"
                >
                  {t.admin.common.edit}
                </button>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  aria-label={t.admin.common.delete}
                  className="flex min-h-[36px] items-center border border-white/10 px-3 text-[#8f9a9f] hover:border-[#c8102e] hover:text-[#c9b28c]"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-[13px] text-[#8f9a9f]">{t.admin.services.empty}</p>
        )}
      </div>

      <Dialog open={Boolean(draft)} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-w-[560px] border-white/10 bg-[#263033]">
          <DialogTitle className="text-[18px] font-bold text-white">{t.admin.services.form.title}</DialogTitle>
          {draft ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="sv-title" className="eyebrow mb-2 block">
                  {t.admin.services.form.name}
                </label>
                <input
                  id="sv-title"
                  value={draft.title}
                  onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                  className={FIELD}
                />
              </div>
              <div>
                <label htmlFor="sv-desc" className="eyebrow mb-2 block">
                  {t.admin.services.form.short}
                </label>
                <textarea
                  id="sv-desc"
                  value={draft.short_description}
                  onChange={(event) => setDraft({ ...draft, short_description: event.target.value })}
                  rows={3}
                  className="w-full resize-none border border-white/10 bg-[#1f272b] p-3 text-[13px] text-white focus:border-[#c8102e] focus:outline-none"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label htmlFor="sv-audience" className="eyebrow mb-2 block">
                    {t.admin.services.form.audience}
                  </label>
                  <select
                    id="sv-audience"
                    value={draft.audience}
                    onChange={(event) => setDraft({ ...draft, audience: event.target.value })}
                    className={FIELD}
                  >
                    <option value="owner">{t.admin.services.audienceLabels.owner}</option>
                    <option value="buyer">{t.admin.services.audienceLabels.buyer}</option>
                    <option value="all">{t.admin.services.audienceLabels.all}</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="sv-status" className="eyebrow mb-2 block">
                    {t.admin.services.form.status}
                  </label>
                  <select
                    id="sv-status"
                    value={draft.status}
                    onChange={(event) => setDraft({ ...draft, status: event.target.value })}
                    className={FIELD}
                  >
                    <option value="active">{t.admin.services.statusLabels.active}</option>
                    <option value="planned">{t.admin.services.statusLabels.planned}</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="sv-order" className="eyebrow mb-2 block">
                    {t.admin.services.form.order}
                  </label>
                  <input
                    id="sv-order"
                    type="number"
                    value={draft.sort_order}
                    onChange={(event) => setDraft({ ...draft, sort_order: event.target.value })}
                    className={FIELD}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={save}
                  className="min-h-[42px] bg-[#c8102e] px-5 text-[13px] font-semibold text-white"
                >
                  {t.admin.services.form.save}
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