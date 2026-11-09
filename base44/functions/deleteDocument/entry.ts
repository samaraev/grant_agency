import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { requireAdminOrDemo } from '../../shared/guards.ts';
import { currentActor, writeAudit } from '../../shared/audit.ts';

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

    await base44.asServiceRole.entities.Document.delete(documentId);

    await writeAudit(base44, {
      actor: await currentActor(base44),
      action: 'document.deleted',
      entity: 'Document',
      entity_id: documentId,
      meta: { title: doc.title || '', doc_type: doc.doc_type || 'other', lead_id: doc.lead_id || '' },
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}