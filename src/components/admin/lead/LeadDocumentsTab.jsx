import { useCallback, useEffect, useState } from 'react';
import { Download, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { dateLocale, t } from '@/lib/i18n';
import { docTypeLabel, formatSize } from '@/lib/documents';
import DocumentUploadDialog from '@/components/admin/lead/DocumentUploadDialog';

export default function LeadDocumentsTab({ lead }) {
  const copy = t.admin.documents;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    base44.entities.Document.filter({ lead_id: lead.id }, { sort: '-created_date', limit: 100 })
      .then((page) => setItems(page?.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [lead.id]);

  useEffect(load, [load]);

  useEffect(() => {
    base44.auth.me()
      .then((me) => setUserEmail(me?.email || ''))
      .catch(() => setUserEmail(''));
  }, []);

  const openDoc = async (doc, asDownload) => {
    setBusy(doc.id);
    setError('');
    try {
      const response = await base44.functions.invoke('getDocumentUrl', { document_id: doc.id });
      const url = response?.data?.url;
      if (!url) throw new Error('no_url');

      if (asDownload) {
        const link = window.document.createElement('a');
        link.href = url;
        link.download = doc.title || 'document';
        link.rel = 'noopener';
        window.document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (e) {
      setError(copy.openError);
    } finally {
      setBusy('');
    }
  };

  const remove = async (doc) => {
    if (!window.confirm(copy.confirmDelete)) return;
    setBusy(doc.id);
    setError('');
    try {
      await base44.functions.invoke('deleteDocument', { document_id: doc.id });
      load();
    } catch (e) {
      setError(copy.deleteError);
    } finally {
      setBusy('');
    }
  };

  return (
    <div>
      <p className="border-l-2 border-[#c9b28c] bg-[#263033] px-4 py-3 text-[12px] leading-relaxed text-[#b0b8bc]">
        {copy.caution}
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[13px] uppercase tracking-[0.14em] text-[#8f9a9f]">{copy.title}</h2>
        <button
          type="button"
          onClick={() => setDialog(true)}
          className="flex min-h-[38px] items-center gap-2 bg-[#c8102e] px-4 text-[12.5px] font-semibold text-white"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          {copy.upload}
        </button>
      </div>

      {error ? <p className="mt-3 text-[12px] text-[#ff8a96]">{error}</p> : null}

      {loading ? (
        <p className="mt-4 text-[13px] text-[#8f9a9f]">{t.admin.common.loading}</p>
      ) : items.length === 0 ? (
        <p className="mt-4 text-[13px] text-[#8f9a9f]">{copy.empty}</p>
      ) : (
        <div className="mt-4 overflow-x-auto border border-white/10">
          <table className="w-full min-w-[720px] text-left text-[12.5px]">
            <thead className="bg-[#263033] text-[10.5px] uppercase tracking-[0.1em] text-[#8f9a9f]">
              <tr>
                <th className="px-3 py-2.5 font-medium">{copy.columns.title}</th>
                <th className="px-3 py-2.5 font-medium">{copy.columns.type}</th>
                <th className="px-3 py-2.5 font-medium">{copy.columns.author}</th>
                <th className="px-3 py-2.5 font-medium">{copy.columns.date}</th>
                <th className="px-3 py-2.5 font-medium">{copy.columns.size}</th>
                <th className="px-3 py-2.5 text-right font-medium">{copy.columns.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8 bg-[#1a2025]">
              {items.map((doc) => (
                <tr key={doc.id} className={busy === doc.id ? 'opacity-60' : undefined}>
                  <td className="px-3 py-3 text-white">
                    {doc.title}
                    {doc.notes ? (
                      <span className="mt-0.5 block text-[11.5px] text-[#6f7a7f]">{doc.notes}</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 text-[#b0b8bc]">{docTypeLabel(doc.doc_type, t)}</td>
                  <td className="px-3 py-3 text-[#b0b8bc]">{doc.uploaded_by || '—'}</td>
                  <td className="px-3 py-3 text-[#8f9a9f]">
                    {doc.created_at || doc.created_date
                      ? new Date(doc.created_at || doc.created_date).toLocaleDateString(dateLocale())
                      : '—'}
                  </td>
                  <td className="px-3 py-3 text-[#8f9a9f]">
                    {doc.file_ref ? formatSize(doc.file_size) : copy.external}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => openDoc(doc, false)}
                        disabled={busy === doc.id}
                        className="flex items-center gap-1.5 text-[12px] text-[#c9b28c] hover:text-white"
                      >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        {copy.actions.open}
                      </button>
                      <button
                        type="button"
                        onClick={() => openDoc(doc, true)}
                        disabled={busy === doc.id}
                        className="flex items-center gap-1.5 text-[12px] text-[#9aa4a8] hover:text-white"
                      >
                        <Download className="h-3.5 w-3.5" aria-hidden="true" />
                        {copy.actions.download}
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(doc)}
                        disabled={busy === doc.id}
                        className="flex items-center gap-1.5 text-[12px] text-[#9aa4a8] hover:text-[#ff8a96]"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        {copy.actions.delete}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DocumentUploadDialog
        open={dialog}
        leadId={lead.id}
        userEmail={userEmail}
        onClose={() => setDialog(false)}
        onUploaded={() => {
          setDialog(false);
          load();
        }}
      />
    </div>
  );
}