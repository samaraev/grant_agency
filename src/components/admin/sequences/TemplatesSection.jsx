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

      <div className="mt-4 overflow-x-auto border border-white/10 bg-[#263033]">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="border-b border-white/10 text-[10.5px] uppercase tracking-[0.14em] text-[#778287]">
              <th className="px-4 py-3 font-medium">{c.columns.name}</th>
              <th className="px-3 py-3 font-medium">{c.columns.channel}</th>
              <th className="px-3 py-3 font-medium">{c.columns.body}</th>
              <th className="px-3 py-3 font-medium">{c.columns.used}</th>
              <th className="px-3 py-3 text-right font-medium">{c.columns.actions}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-[13px] text-[#8f9a9f]">
                  {t.admin.common.loading}
                </td>
              </tr>
            ) : templates.length ? (
              templates.map((template) => {
                const usage = usedBy(template);
                return (
                  <tr key={template.id} className="border-b border-white/8 last:border-b-0">
                    <td className="px-4 py-3 align-top text-[13px] text-white">{template.name}</td>
                    <td className="px-3 py-3 align-top text-[12.5px] text-[#c9b28c]">
                      {c.channels[template.channel] || template.channel}
                    </td>
                    <td className="max-w-[420px] px-3 py-3 align-top text-[12px] leading-relaxed text-[#d7dcde]">
                      {template.subject ? (
                        <div className="text-white">{template.subject}</div>
                      ) : null}
                      <div className="text-[#8f9a9f]">{preview(template) || '—'}</div>
                    </td>
                    <td className="px-3 py-3 align-top text-[12px] text-[#8f9a9f]">
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
                    </td>
                    <td className="px-3 py-3 align-top">
                      <div className="flex items-center justify-end gap-1">
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
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-[13px] text-[#8f9a9f]">
                  {c.empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
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