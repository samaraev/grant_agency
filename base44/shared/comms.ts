// Провайдеры связи: SMS и телефония. Ключи читаются из секретов приложения.
import { secrets } from 'base44:runtime';
import md5 from 'npm:blueimp-md5@2.19.0';

export const SMS_PROVIDERS = ['none', 'smsru', 'smsc', 'twilio'];
export const TELEPHONY_PROVIDERS = ['none', 'zadarma', 'novofon', 'telphin', 'mango'];

const TIMEOUT = 12000;

export function readSecret(name) {
  try {
    const value = secrets.get(name);
    return value ? String(value) : '';
  } catch {
    return '';
  }
}

export function digits(value) {
  return String(value || '').replace(/\D/g, '');
}

/** Подстановки в шаблонах: {имя} {адрес} {ответственный} {телефон}. */
export function mergeTemplate(templateText, lead) {
  const map = {
    '{имя}': lead?.name || '',
    '{адрес}': lead?.address_text || '',
    '{ответственный}': lead?.responsible || '',
    '{телефон}': lead?.phone || '',
  };
  return Object.keys(map).reduce(
    (acc, key) => acc.split(key).join(map[key]),
    String(templateText || '')
  );
}

export function smsConfigured(provider) {
  if (provider === 'smsru') return Boolean(readSecret('SMSRU_API_ID'));
  if (provider === 'smsc') return Boolean(readSecret('SMSC_LOGIN') && readSecret('SMSC_PASSWORD'));
  if (provider === 'twilio') {
    return Boolean(
      readSecret('TWILIO_ACCOUNT_SID') && readSecret('TWILIO_AUTH_TOKEN') && readSecret('TWILIO_FROM')
    );
  }
  return false;
}

export function telephonyConfigured(provider) {
  if (provider === 'zadarma') return Boolean(readSecret('ZADARMA_KEY') && readSecret('ZADARMA_SECRET'));
  if (provider === 'novofon') return Boolean(readSecret('NOVOFON_KEY') && readSecret('NOVOFON_SECRET'));
  if (provider === 'telphin') return Boolean(readSecret('TELPHIN_TOKEN'));
  if (provider === 'mango') return Boolean(readSecret('MANGO_API_KEY') && readSecret('MANGO_API_SALT'));
  return false;
}

export function providersStatus() {
  return {
    sms: SMS_PROVIDERS.map((id) => ({ id, configured: id === 'none' ? false : smsConfigured(id) })),
    telephony: TELEPHONY_PROVIDERS.map((id) => ({
      id,
      configured: id === 'none' ? false : telephonyConfigured(id),
    })),
    email: true,
    webhook: Boolean(readSecret('COMMS_WEBHOOK_TOKEN')),
  };
}

/** Отправка SMS через выбранного провайдера. */
export async function sendSmsVia(provider, to, text, sender) {
  const phone = digits(to);
  if (!phone) return { ok: false, error: 'Нет номера телефона' };

  if (provider === 'smsru') {
    const apiId = readSecret('SMSRU_API_ID');
    const url =
      `https://sms.ru/sms/send?api_id=${encodeURIComponent(apiId)}&to=${phone}` +
      `&msg=${encodeURIComponent(text)}&json=1` +
      (sender ? `&sender=${encodeURIComponent(sender)}` : '');
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) });
    const data = await res.json().catch(() => ({}));
    if (data?.status === 'OK') {
      const first = Object.values(data.sms || {})[0] || {};
      return { ok: true, provider_id: String(first?.sms_id || '') };
    }
    return { ok: false, error: data?.status_text || `sms.ru: ${res.status}` };
  }

  if (provider === 'smsc') {
    const url =
      `https://smsc.ru/sys/send.php?login=${encodeURIComponent(readSecret('SMSC_LOGIN'))}` +
      `&psw=${encodeURIComponent(readSecret('SMSC_PASSWORD'))}` +
      `&phones=${phone}&mes=${encodeURIComponent(text)}&fmt=3` +
      (sender ? `&sender=${encodeURIComponent(sender)}` : '');
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) });
    const data = await res.json().catch(() => ({}));
    if (data?.error) return { ok: false, error: String(data.error) };
    return { ok: true, provider_id: String(data?.id || '') };
  }

  if (provider === 'twilio') {
    const sid = readSecret('TWILIO_ACCOUNT_SID');
    const body = new URLSearchParams({
      To: `+${phone}`,
      From: readSecret('TWILIO_FROM'),
      Body: text,
    });
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${sid}:${readSecret('TWILIO_AUTH_TOKEN')}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
      signal: AbortSignal.timeout(TIMEOUT),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.sid) return { ok: true, provider_id: String(data.sid) };
    return { ok: false, error: data?.message || `twilio: ${res.status}` };
  }

  return { ok: false, error: 'Провайдер SMS не настроен' };
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/** Звонок в два шага: провайдер звонит администратору, затем клиенту. */
export async function callVia(provider, adminNumber, leadNumber) {
  const admin = digits(adminNumber);
  const lead = digits(leadNumber);
  if (!admin) return { ok: false, error: 'Не указан номер администратора в настройках интеграций' };
  if (!lead) return { ok: false, error: 'У клиента нет телефона' };

  if (provider === 'zadarma' || provider === 'novofon') {
    const host = provider === 'zadarma' ? 'api.zadarma.com' : 'api.novofon.com';
    const key = readSecret(provider === 'zadarma' ? 'ZADARMA_KEY' : 'NOVOFON_KEY');
    const secret = readSecret(provider === 'zadarma' ? 'ZADARMA_SECRET' : 'NOVOFON_SECRET');
    const method = '/v1/request/callback/';
    const query = `from=${encodeURIComponent(admin)}&to=${encodeURIComponent(lead)}`;
    const sign = md5(`${method}${query}${md5(query)}${secret}`);
    const res = await fetch(`https://${host}${method}`, {
      method: 'POST',
      headers: {
        Authorization: `${key}:${sign}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: query,
      signal: AbortSignal.timeout(TIMEOUT),
    });
    const data = await res.json().catch(() => ({}));
    if (data?.status === 'success') return { ok: true, provider_id: String(data.call_id || '') };
    return { ok: false, error: data?.message || `${provider}: ${res.status}` };
  }

  if (provider === 'telphin') {
    const res = await fetch('https://apiproxy.telphin.ru/api/ver1.0/user/calls', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${readSecret('TELPHIN_TOKEN')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ caller: admin, callee: lead, type: 'callback' }),
      signal: AbortSignal.timeout(TIMEOUT),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) return { ok: true, provider_id: String(data?.id || data?.call_id || '') };
    return { ok: false, error: data?.message || `telphin: ${res.status}` };
  }

  if (provider === 'mango') {
    const key = readSecret('MANGO_API_KEY');
    const salt = readSecret('MANGO_API_SALT');
    const json = JSON.stringify({ command: 'call', from: { extension: admin }, to: { number: lead } });
    const sign = await sha256Hex(`${key}${json}${salt}`);
    const res = await fetch('https://app.mango-office.ru/vpbx/commands/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ vpbx_api_key: key, sign, json }),
      signal: AbortSignal.timeout(TIMEOUT),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && (data?.result === 1000 || data?.success)) {
      return { ok: true, provider_id: String(data?.data || data?.call_id || '') };
    }
    return { ok: false, error: data?.message || `mango: ${res.status}` };
  }

  return { ok: false, error: 'Провайдер телефонии не настроен' };
}