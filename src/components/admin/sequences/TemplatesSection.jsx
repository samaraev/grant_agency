import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { t } from '@/lib/i18n';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import TemplateDialog from './TemplateDialog';

const preview = (template) => {
  const text = String(template.body || '').replace(/\s+/g, ' ').trim();
  return text.length > 150 ? `${text.slice(0, 150)}…` : text;
};

// Сетка без горизонтальной прокрутки: на телефоне карточка в столбик, на широком экране — строки таблицы.
const COLS = 'lg:grid-cols-[minmax(0,1fr)_7rem_minmax(0,1.4fr)_minmax(0,1fr)_6rem] lg:gap-x-3';
const GRID_HEAD = `hidden border-b border-white/10 px-4 py-3 text-[10.5px] uppercase tracking-[0.14em] text-[#778287] lg:grid ${COLS}`;
const GRID_ROW = `grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 border-b border-white/8 px-4 py-3 last:border-b-0 lg:items-start ${COLS}`;

/** Шаблоны сообщений: на них ссылаются сценарии по названию и каналу. */
export default function TemplatesSection({ templates = [], rows = [], loading = false, onChanged }) {
  const c = t.admin.sequences.templates;
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const usedBy = (template) =>
    rows.filter((row) => row.template_key === template.name && row.channel === template.channel);

  const remove = async () => {
    if (!removing) return;
    setDeleting(true);
    setError('');
    try {
      await base44.entities.MessageTemplate.delete(removing.id);
      setRemoving(null);
      onChanged?.();
    } catch (err) {
      setError(err?.message || c.confirm.error);
    } finally {
      setDeleting(false);
    }
  };

  const removingUsage = removing ? usedBy(removing) : [];

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-[19px] font-bold text-white">{c.title}</h2>
          <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-[#8f9a9f]">{c.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing({})}
          className="flex min-h-[38px] items-center gap-2 border border-white/15 px-4 text-[12.5px] text-white hover:border-[#c9b28c]"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          {c.create}
        </button>
      </div>

      <div className="mt-4 border border-white/10 bg-[#263033]">
        <div className={GRID_HEAD}>
          <span>{c.columns.name}</span>
          <span className="lg:col-start-2">{c.columns.channel}</span>
          <span className="lg:col-start-3">{c.columns.body}</span>
          <span className="lg:col-start-4">{c.columns.used}</span>
          <span className="lg:col-start-5 lg:text-right">{c.columns.actions}</span>
        </div>

        {loading ? (
          <p className="px-4 py-6 text-[13px] text-[#8f9a9f]">{t.admin.common.loading}</p>
        ) : templates.length ? (
          templates.map((template) => {
            const usage = usedBy(template);
            return (
              <div key={template.id} className={GRID_ROW}>
                <div className="col-start-1 row-start-1 min-w-0 [overflow-wrap:anywhere] text-[13px] leading-snug text-white">
                  {template.name}
                </div>
                <div className="col-start-1 row-start-2 min-w-0 text-[11.5px] text-[#c9b28c] lg:col-start-2 lg:row-start-1 lg:text-[12.5px]">
                  {c.channels[template.channel] || template.channel}
                </div>
                <div className="col-start-1 row-start-3 min-w-0 text-[12px] leading-relaxed lg:col-start-3 lg:row-start-1">
                  {template.subject ? <div className="text-white">{template.subject}</div> : null}
                  <div className="text-[#8f9a9f]">{preview(template) || '—'}</div>
                </div>
                <div className="col-start-1 row-start-4 min-w-0 text-[11.5px] text-[#8f9a9f] lg:col-start-4 lg:row-start-1 lg:text-[12px]">
                  {usage.length
                    ? usage
                        .map(
                          (row) =>
                            `${t.admin.sequences.keys[row.key] || row.key} · ${
                              c.channels[row.channel] || row.channel
                            }`
                        )
                        .join(', ')
                    : c.unused}
                </div>
                <div className="col-start-2 row-start-1 flex items-center justify-end gap-1 justify-self-end lg:col-start-5 lg:row-start-1">
                  <button
                    type="button"
                    onClick={() => setEditing(template)}
                    aria-label={`${c.edit}: ${template.name}`}
                    title={c.edit}
                    className="flex h-8 w-8 items-center justify-center text-[#9aa4a8] transition-colors hover:text-white"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setRemoving(template);
                    }}
                    aria-label={`${c.delete}: ${template.name}`}
                    title={c.delete}
                    className="flex h-8 w-8 items-center justify-center text-[#9aa4a8] transition-colors hover:text-[#ff8a96]"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="px-4 py-6 text-[13px] text-[#8f9a9f]">{c.empty}</p>
        )}
      </div>

      <TemplateDialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        template={editing?.id ? editing : null}
        templates={templates}
        used={Boolean(editing?.id) && usedBy(editing).length > 0}
        onSaved={onChanged}
      />

      <AlertDialog
        open={Boolean(removing)}
        onOpenChange={(open) => {
          if (!open) {
            setRemoving(null);
            setError('');
          }
        }}
      >
        <AlertDialogContent className="border-white/10 bg-[#263033]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[18px] font-bold text-white">{c.confirm.title}</AlertDialogTitle>
            <AlertDialogDescription className="text-[12.5px] leading-relaxed text-[#b0b8bc]">
              {c.confirm.text.replace('{name}', removing?.name || '')}
              {removingUsage.length ? (
                <span className="mt-2 block text-[#ff8a96]">
                  {c.confirm.used.replace(
                    '{names}',
                    removingUsage
                      .map((row) => `${t.admin.sequences.keys[row.key] || row.key} · ${row.channel}`)
                      .join(', ')
                  )}
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error ? <p className="text-[12px] text-[#ff8a96]">{error}</p> : null}
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/15 bg-transparent text-white hover:bg-white/5">
              {c.confirm.cancel}
            </AlertDialogCancel>
            <button
              type="button"
              onClick={remove}
              disabled={deleting}
              className="min-h-[38px] bg-[#c8102e] px-4 text-[12.5px] font-semibold text-white disabled:opacity-60"
            >
              {deleting ? c.confirm.deleting : c.confirm.confirm}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}