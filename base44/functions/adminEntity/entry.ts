import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { requireAdmin } from '../../shared/guards.ts';

const ENTITIES = new Set([
  'AdminSettings',
  'AuditLog',
  'Building',
  'Communication',
  'Document',
  'Events',
  'IntegrationSettings',
  'LaunchItem',
  'Lead',
  'Meeting',
  'MessageTemplate',
  'OwnerAnalysis',
  'Pipeline',
  'RejectionReason',
  'Report',
  'SequenceSetting',
  'Service',
  'SiteSettings',
  'StatusHistory',
  'Task',
  'TeamMember',
]);

const METHODS = new Set([
  'aggregate',
  'bulkCreate',
  'bulkUpdate',
  'count',
  'create',
  'delete',
  'filter',
  'get',
  'list',
  'update',
  'updateMany',
]);

export default async function (req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const denied = await requireAdmin(base44, req);
    if (denied) return denied;

    const rawBody = await req.text();
    if (rawBody.length > 1_000_000) {
      return Response.json({ error: 'Request too large' }, { status: 413 });
    }
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }
    if (
      !body ||
      typeof body.entity !== 'string' ||
      !ENTITIES.has(body.entity) ||
      typeof body.method !== 'string' ||
      !METHODS.has(body.method) ||
      !Array.isArray(body.args) ||
      body.args.length > 3
    ) {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }

    const result = await base44.asServiceRole.entities[body.entity][body.method](...body.args);
    return Response.json({ result }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    console.error('adminEntity request failed');
    return Response.json({ error: 'Administrative request failed' }, { status: 500 });
  }
}
