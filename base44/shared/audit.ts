/**
 * Запись в журнал доступа (AuditLog).
 * Журнал пишется только из серверных функций; сбой записи не должен отменять действие.
 */

export async function currentActor(base44) {
  const me = await base44.auth.me().catch(() => null);
  return me?.email || 'demo';
}

export async function writeAudit(base44, { actor, action, entity, entity_id, meta }) {
  try {
    await base44.asServiceRole.entities.AuditLog.create({
      actor: actor || 'demo',
      action,
      entity,
      entity_id,
      meta: meta || {},
      at: new Date().toISOString(),
    });
  } catch {
    // Журнал не должен ломать основное действие.
  }
}