import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { requireAdmin } from '../../shared/guards.ts';

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/avif', 'image/jpeg', 'image/png', 'image/webp']);
const DOCUMENT_TYPES = new Set([
  ...IMAGE_TYPES,
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
]);

export default async function (req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const denied = await requireAdmin(base44, req);
    if (denied) return denied;

    const form = await req.formData().catch(() => null);
    const file = form?.get('file');
    const visibility = form?.get('visibility');
    if (!(file instanceof File) || !['public', 'private'].includes(String(visibility))) {
      return Response.json({ error: 'Invalid upload' }, { status: 400 });
    }
    if (!file.size || file.size > MAX_FILE_SIZE) {
      return Response.json({ error: 'File size is not allowed' }, { status: 400 });
    }
    const allowedTypes = visibility === 'public' ? IMAGE_TYPES : DOCUMENT_TYPES;
    if (!allowedTypes.has(file.type)) {
      return Response.json({ error: 'File type is not allowed' }, { status: 400 });
    }

    const result = visibility === 'public'
      ? await base44.asServiceRole.integrations.Core.UploadPublicFile({ file })
      : await base44.asServiceRole.integrations.Core.UploadPrivateFile({ file });
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    console.error('adminUpload request failed');
    return Response.json({ error: 'Upload failed' }, { status: 500 });
  }
}
