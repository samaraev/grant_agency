import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { callVia, providersStatus, sendSmsVia, smsConfigured, telephonyConfigured } from '../../shared/comms.ts';

function text(value, max = 2000) {
  return String(value === undefined || value === null ? '' : value).trim().slice(0, max);
}

/** Состояние провайдеров и тестовая отправка для страницы «Интеграции». */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    // ВРЕМЕННО (демо): проверка связи доступна и без входа. Для продакшена вернуть проверку роли.
    if (user && user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const kind = text(body.kind, 20) || 'status';

    const settingsPage = await base44.asServiceRole.entities.AdminSettings.list({ limit: 1 }).catch(() => null);
    const settings = settingsPage?.items?.[0] || {};
    const status = providersStatus();

    if (kind === 'status') {
      return Response.json({ ok: true, status, testNumber: text(settings.call_first_number, 40) });
    }

    if (kind === 'email') {
      try {
        const result = await base44.asServiceRole.integrations.Core.SendEmail({
          to: user?.email || text(settings.admin_email, 160),
          subject: 'Проверка связи — ГРАНТ',
          body: 'Это тестовое письмо из админки. Если вы его видите, отправка писем работает.',
          category: 'transactional',
        });
        const ok = !(result && result.success === false);
        return Response.json({ ok, error: ok ? '' : result.message || 'send_failed' });
      } catch (error) {
        return Response.json({ ok: false, error: error.message });
      }
    }

    const testNumber = text(settings.call_first_number, 40);
    if (!testNumber) {
      return Response.json({ ok: false, error: 'Укажите номер администратора в настройках' }, { status: 400 });
    }

    if (kind === 'sms') {
      const provider = text(settings.sms_provider, 40) || 'none';
      if (!smsConfigured(provider)) {
        return Response.json({ ok: false, error: 'Провайдер SMS не настроен' });
      }
      const result = await sendSmsVia(provider, testNumber, 'Тест связи: SMS из админки ГРАНТ.', settings.sms_sender);
      return Response.json({ ok: result.ok, error: result.error || '' });
    }

    if (kind === 'call') {
      const provider = text(settings.telephony_provider, 40) || 'none';
      if (!telephonyConfigured(provider)) {
        return Response.json({ ok: false, error: 'Провайдер телефонии не настроен' });
      }
      const result = await callVia(provider, testNumber, testNumber);
      return Response.json({ ok: result.ok, error: result.error || '' });
    }

    return Response.json({ error: 'Неизвестный тип проверки' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}