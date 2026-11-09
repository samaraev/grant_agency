import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { t } from '@/lib/i18n';
import { DOC_TYPES } from '@/lib/documents';

const FIELD =
  'h-[38px] w-full border border-white/10 bg-[#1f272b] px-3 text-[13px] text-white focus:border-[#c8102e] focus:outline-none';
const AREA =
  'w-full resize-none border border-white/10 bg-[#1f272b] p-3 text-[13px] text-white focus:border-[#c8102e] focus:outline-none';
const LABEL = 'mb-1 block text-[11px] uppercase tracking-[0.12em] text-[#8f9a9f]';

export default function DocumentUploadDialog({ open, leadId, userEmail, onClose, onUploaded }) {
  const copy = t.admin.documents;
  const fileInput = useRef(null);
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState('other');
  const [file, setFile] = useState(null);
  const [link, setLink] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle('');
    setDocType('other');
    setFile(null);
    setLink('');
    setNotes('');
    setError('');
    if (fileInput.current) fileInput.current.value = '';
  }, [open]);

  const save = async () => {
    if (!title.trim()) {
      setError(copy.titleRequired);
      return;
    }
    if (!file && !link.trim()) {
      setError(copy.fileRequired);
      return;
    }

    setSaving(true);
    setError('');
    try {
      let fileRef = '';
      if (file) {
        const uploaded = await base44.integrations.Core.UploadPrivateFile({ file });
        fileRef = uploaded?.file_uri || '';
        if (!fileRef) throw new Error('upload_failed');
      }

      const now = new Date().toISOString();
      await base44.entities.Document.create({
        lead_id: leadId,
        title: title.trim(),
        doc_type: docType,
        file_ref: fileRef,
        external_link: fileRef ? '' : link.trim(),
        file_size: file ? file.size : undefined,
        uploaded_by: userEmail || '',
        notes: notes.trim(),
        created_at: now,
        updated_at: now,
      });

      onUploaded();
    } catch (e) {
      setError(copy.uploadError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? null : onClose())}>
      <DialogContent className="max-w-[520px] border-white/10 bg-[#1f272b] p-0">
        <DialogTitle className="border-b border-white/10 px-5 py-4 text-[15px] font-semibold text-white">
          {copy.dialog.title}
        </DialogTitle>

        <div className="space-y-3 px-5 py-4">
          <div>
            <span className={LABEL}>{copy.dialog.name}</span>
            <input className={FIELD} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <span className={LABEL}>{copy.dialog.type}</span>
            <select className={FIELD} value={docType} onChange={(e) => setDocType(e.target.value)}>
              {DOC_TYPES.map((type) => (
                <option key={type} value={type}>
                  {copy.types[type]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className={LABEL}>{copy.dialog.file}</span>
            <input
              ref={fileInput}
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-[12.5px] text-[#b0b8bc] file:mr-3 file:border-0 file:bg-[#263033] file:px-3 file:py-2 file:text-[12.5px] file:text-white"
            />
            <p className="mt-1 text-[11px] text-[#5f696d]">{copy.privateHint}</p>
          </div>

          <div>
            <span className={LABEL}>{copy.dialog.link}</span>
            <input
              className={FIELD}
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://"
              disabled={Boolean(file)}
            />
          </div>

          <div>
            <span className={LABEL}>{copy.dialog.notes}</span>
            <textarea className={AREA} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          {error ? <p className="text-[12px] text-[#ff8a96]">{error}</p> : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-white/10 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[38px] border border-white/15 px-4 text-[12.5px] text-[#b0b8bc] hover:text-white"
          >
            {copy.dialog.cancel}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="min-h-[38px] bg-[#c8102e] px-4 text-[12.5px] font-semibold text-white disabled:opacity-60"
          >
            {saving ? copy.dialog.uploading : copy.dialog.submit}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}