/**
 * Проверка администратора для серверных функций.
 *
 * TODO(demo-mode): админ-панель сейчас открыта без входа (GATE_DISABLED в
 * src/pages/admin/AdminLayout.jsx), поэтому запрос без сессии пропускается —
 * тот же режим, что и в существующих функциях CRM.
 * Когда защита /admin будет включена, заменить тело на строгую проверку:
 *   const user = await base44.auth.me();
 *   if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
 *   return null;
 *
 * Возвращает null, если доступ разрешён, иначе готовый Response с 403.
 */
export async function requireAdminOrDemo(base44) {
  const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
  // ВРЕМЕННО (демо): работаем и без входа. Для продакшена вернуть обязательную авторизацию.
  if (user && user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
  return null;
}