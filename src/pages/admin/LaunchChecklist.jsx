import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { t, dateLocale } from '@/lib/i18n';
import { LAUNCH_DEFAULTS, LAUNCH_GROUPS } from '@/lib/launchDefaults';
import { cn } from '@/lib/utils';

const Field =
  'h-[32px] w-full border border-white/10 bg-[#1f272b] px-2 text-[11.5px] text-white focus:border-[#c8102e] focus:outline-none';

export default function LaunchChecklist() {
  const copy = t.admin.launch;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState({ group: 'contract', title: '' });

  const load = () =>
    base44.entities.LaunchItem.list({ sort: 'sort_order', limit: 300 })
      .then((page) => setItems(page?.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const progress = useMemo(() => {
    const done = items.filter((item) => item.status === 'done').length;
    return { done, total: items.length, percent: items.length ? Math.round((done / items.length) * 100) : 0 };
  }, [items]);

  const seed = async () => {
    setBusy(true);
    try {
      const created = await base44.entities.LaunchItem.bulkCreate(LAUNCH_DEFAULTS);
      setItems(created || []);
    } finally {
      setBusy(false);
    }
  };

  const add = async () => {
    if (!draft.title.trim()) return;
    setBusy(true);
    try {
      const record = await base44.entities.LaunchItem.create({
        group: draft.group,
        title: draft.title.trim(),
        status: 'todo',
        sort_order: items.filter((item) => item.group === draft.group).length,
      });
      setItems((prev) => [...prev, record]);
      setDraft({ ...draft, title: '' });
    } finally {
      setBusy(false);
    }
  };

  const patch = async (item, data) => {
    const updated = await base44.entities.LaunchItem.update(item.id, data);
    setItems((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
  };

  const remove = async (item) => {
    await base44.entities.LaunchItem.delete(item.id);
    setItems((prev) => prev.filter((row) => row.id !== item.id));
  };

  return (
    <div>
      <div className="eyebrow">{t.admin.marker}</div>
      <h1 className="mt-3 text-[26px] font-bold text-white">{copy.title}</h1>
      <p className="mt-2 max-w-[640px] text-[13px] text-[#8f9a9f]">{copy.subtitle}</p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="min-w-[160px] flex-1">
          <div className="h-[6px] w-full bg-white/10">
            <div className="h-full bg-[#c8102e]" style={{ width: `${progress.percent}%` }} />
          </div>
        </div>
        <span className="text-[12px] text-[#b0b8bc]">
          {copy.progress}: {progress.done} / {progress.total} · {progress.percent}%
        </span>
        {items.length === 0 ? (
          <button
            type="button"
            onClick={seed}
            disabled={busy}
            className="min-h-[34px] bg-[#c8102e] px-3 text-[12px] font-semibold text-white disabled:opacity-50"
          >
            {busy ? copy.seeding : copy.seed}
          </button>
        ) : null}
      </div>

      {loading ? (
        <div className="mt-6 h-40 animate-pulse border border-white/10 bg-[#263033]" />
      ) : items.length === 0 ? (
        <p className="mt-6 text-[13px] text-[#8f9a9f]">{copy.empty}</p>
      ) : (
        <div className="mt-6 space-y-4">
          {LAUNCH_GROUPS.map((group) => {
            const groupItems = items.filter((item) => item.group === group);
            if (!groupItems.length) return null;
            return (
              <section key={group} className="border border-white/10 bg-[#263033]">
                <div className="border-b border-white/10 px-4 py-3 text-[12px] uppercase tracking-[0.12em] text-[#c9b28c]">
                  {copy.groups[group]}
                </div>
                <ul className="divide-y divide-white/8">
                  {groupItems.map((item) => (
                    <li key={item.id} className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          defaultValue={item.title}
                          onBlur={(event) => {
                            const value = event.target.value.trim();
                            if (value && value !== item.title) patch(item, { title: value });
                          }}
                          className={cn(
                            'min-w-[180px] flex-1 bg-transparent text-[13px] focus:outline-none',
                            item.status === 'done' ? 'text-[#8f9a9f] line-through' : 'text-white'
                          )}
                          aria-label={copy.item}
                        />
                        <select
                          value={item.status || 'todo'}
                          onChange={(event) => patch(item, { status: event.target.value })}
                          aria-label={copy.statuses[item.status] || copy.statuses.todo}
                          className="h-[30px] border border-white/10 bg-[#1f272b] px-2 text-[11.5px] text-white focus:outline-none"
                        >
                          {Object.entries(copy.statuses).map(([key, label]) => (
                            <option key={key} value={key} className="bg-[#1f272b]">
                              {label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => remove(item)}
                          className="min-h-[30px] px-2 text-[11.5px] text-[#8f9a9f] hover:text-white"
                        >
                          {copy.delete}
                        </button>
                      </div>
                      <div className="mt-2 grid gap-2 sm:grid-cols-3">
                        <input
                          defaultValue={item.owner || ''}
                          placeholder={copy.owner}
                          onBlur={(event) => {
                            if (event.target.value !== (item.owner || '')) patch(item, { owner: event.target.value });
                          }}
                          className={Field}
                        />
                        <input
                          type="date"
                          defaultValue={item.due_date ? String(item.due_date).slice(0, 10) : ''}
                          aria-label={copy.due}
                          onBlur={(event) => {
                            if (event.target.value !== String(item.due_date || '').slice(0, 10)) {
                              patch(item, { due_date: event.target.value });
                            }
                          }}
                          className={Field}
                        />
                        <input
                          defaultValue={item.notes || ''}
                          placeholder={copy.notes}
                          onBlur={(event) => {
                            if (event.target.value !== (item.notes || '')) patch(item, { notes: event.target.value });
                          }}
                          className={Field}
                        />
                      </div>
                      {item.due_date ? (
                        <div className="mt-1 text-[10.5px] text-[#6f7a7f]">
                          {copy.due}: {new Date(item.due_date).toLocaleDateString(dateLocale())}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}

          <div className="border border-white/10 bg-[#263033] p-4">
            <div className="text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">{copy.add}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <select
                value={draft.group}
                onChange={(event) => setDraft({ ...draft, group: event.target.value })}
                aria-label={copy.groups.contract}
                className="h-[36px] min-w-[180px] border border-white/10 bg-[#1f272b] px-2 text-[12px] text-white focus:outline-none"
              >
                {LAUNCH_GROUPS.map((group) => (
                  <option key={group} value={group} className="bg-[#1f272b]">
                    {copy.groups[group]}
                  </option>
                ))}
              </select>
              <input
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                placeholder={copy.item}
                className="h-[36px] min-w-[180px] flex-1 border border-white/10 bg-[#1f272b] px-3 text-[12.5px] text-white focus:border-[#c8102e] focus:outline-none"
              />
              <button
                type="button"
                onClick={add}
                disabled={busy || !draft.title.trim()}
                className="min-h-[36px] bg-[#c8102e] px-4 text-[12px] font-semibold text-white disabled:opacity-50"
              >
                {copy.add}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}