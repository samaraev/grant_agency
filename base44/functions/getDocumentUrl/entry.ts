import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { requireAdminOrDemo } from '../../shared/guards.ts';
import { currentActor, writeAudit } from '../../shared/audit.ts';

// Временная ссылка на файл живёт 10 минут.
const TTL_SECONDS = 600;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    const denied = await requireAdminOrDemo(base44);
    if (denied) return denied;

    const body = await req.json().catch(() => ({}));
    const documentId = String(body?.document_id || '').trim();
    if (!documentId) return Response.json({ error: 'document_id' }, { status: 400 });

    const doc = await base44.asServiceRole.entities.Document.get(documentId).catch((e) =>
      e.status === 404 ? null : Promise.reject(e)
    );
    if (!doc) return Response.json({ error: 'not_found' }, { status: 404 });

    const actor = await currentActor(base44);
    const meta = { lead_id: doc.lead_id || '', doc_type: doc.doc_type || 'other' };

    let url = '';
    let expiresAt = null;
    let source = '';

    if (doc.file_ref) {
      // Приватное хранилище Base44: выдаём короткоживущую подписанную ссылку.
      const signed = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
        file_uri: doc.file_ref,
        expires_in: TTL_SECONDS,
      });
      url = signed?.signed_url || '';
      if (!url) return Response.json({ error: 'storage_unavailable' }, { status: 502 });
      expiresAt = new Date(Date.now() + TTL_SECONDS * 1000).toISOString();
      source = 'storage';
    } else if (doc.external_link) {
      // Документ хранится вне приложения: сроком жизни ссылки мы не управляем.
      url = doc.external_link;
      source = 'external';
    } else {
      return Response.json({ error: 'no_file' }, { status: 400 });
    }

    await writeAudit(base44, {
      actor,
      action: 'document.url_issued',
      entity: 'Document',
      entity_id: doc.id,
      meta: { ...meta, source },
    });

    return Response.json({ url, expires_at: expiresAt, source });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}