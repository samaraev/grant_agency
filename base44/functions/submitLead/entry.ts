import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const ALLOWED_TYPES = ['owner_appraise', 'owner_sell', 'buyer_buy', 'buyer_check', 'general'];
const ALLOWED_CONTACTS = ['phone', 'telegram', 'whatsapp'];
const ALLOWED_CLUSTERS = ['khamovniki', 'other'];
const ALLOWED_TIMELINES = ['asap', 'month', 'quarter', 'later', 'undecided'];

// Простое ограничение частоты обращений: не более 5 с одного адреса за 10 минут.
const attempts = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

function tooManyAttempts(ip) {
  const now = Date.now();
  const list = (attempts.get(ip) || []).filter((time) => now - time < WINDOW_MS);
  list.push(now);
  attempts.set(ip, list);
  if (attempts.size > 2000) attempts.clear();
  return list.length > MAX_PER_WINDOW;
}

function clean(value, max) {
  return String(value || '').trim().slice(0, max);
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Ловушка для ботов: поле скрыто от людей.
    if (body.honeypot) return Response.json({ ok: true });

    const type = ALLOWED_TYPES.includes(body.type) ? body.type : 'general';
    const name = clean(body.name, 80);
    const rawPhone = clean(body.phone, 40);
    const digits = rawPhone.replace(/\D/g, '');

    if (name.length < 2) return Response.json({ error: 'name' }, { status: 400 });
    if (digits.length !== 11) return Response.json({ error: 'phone' }, { status: 400 });
    if (body.consent !== true) return Response.json({ error: 'consent' }, { status: 400 });

    const ip =
      (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    if (tooManyAttempts(ip)) {
      return Response.json({ error: 'rate_limited' }, { status: 429 });
    }

    const preferred = ALLOWED_CONTACTS.includes(body.preferred_contact)
      ? body.preferred_contact
      : 'phone';

    const utm = body.utm || {};
    const source =
      [utm.utm_source, utm.utm_medium, utm.utm_campaign].filter(Boolean).join(' / ') ||
      clean(body.referrer, 200) ||
      'direct';

    const addressText = clean(body.address_text, 200);
    const cluster = ALLOWED_CLUSTERS.includes(body.cluster) ? body.cluster : 'other';
    const sellTimeline = ALLOWED_TIMELINES.includes(body.sell_timeline) ? body.sell_timeline : null;

    // Если адрес совпал с домом в базе — сохраняем связь.
    let buildingId = null;
    if (body.building_id) {
      const building = await base44.entities.Building.get(body.building_id).catch(() => null);
      if (building) buildingId = building.id;
    } else if (addressText) {
      const page = await base44.entities.Building.filter({ address: addressText }, { limit: 1 }).catch(
        () => null
      );
      if (page?.items?.length) buildingId = page.items[0].id;
    }

    const personRole =
      type === 'owner_appraise' || type === 'owner_sell'
        ? 'owner'
        : type === 'buyer_buy' || type === 'buyer_check'
          ? 'buyer'
          : 'other';
    const timeframeBySell = {
      asap: 'asap',
      month: '1_3_months',
      quarter: '3_6_months',
      later: 'later',
      undecided: 'unknown',
    };

    const lead = await base44.entities.Lead.create({
      type,
      person_role: personRole,
      area_flag: cluster === 'khamovniki' ? 'in_target' : 'unknown',
      timeframe_hint: timeframeBySell[sellTimeline] || 'unknown',
      cluster,
      sell_timeline: sellTimeline,
      agreement: 'none',
      building_id: buildingId,
      address_text: addressText,
      name,
      phone: rawPhone,
      preferred_contact: preferred,
      message: clean(body.message, 1500),
      status: 'new_inquiry',
      source,
      utm_source: clean(utm.utm_source, 120),
      utm_medium: clean(utm.utm_medium, 120),
      utm_campaign: clean(utm.utm_campaign, 120),
      utm_term: clean(utm.utm_term, 120),
      utm_content: clean(utm.utm_content, 120),
      consent_at: new Date().toISOString(),
      consent_text_version: '152fz-form-v1',
      referrer: clean(body.referrer, 300),
      page_path: clean(body.page_path, 200),
      is_meaningful: false,
    });

    // Уведомление администратору — не мешает приёму обращения.
    try {
      const settingsPage = await base44.entities.SiteSettings.list({ limit: 1 });
      const settings = settingsPage?.items?.[0] || {};
      const adminEmail = settings.admin_email || settings.email;
      if (adminEmail) {
        const typeLabels = {
          owner_appraise: 'Оценить квартиру',
          owner_sell: 'Продать',
          buyer_buy: 'Купить',
          buyer_check: 'Проверить дом',
          general: 'Общий вопрос',
        };
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: adminEmail,
          subject: `Новое обращение: ${typeLabels[type] || type} — ${addressText || 'без адреса'}`,
          body: [
            `Тип: ${typeLabels[type] || type}`,
            `Имя: ${name}`,
            `Телефон: ${rawPhone}`,
            `Удобная связь: ${preferred}`,
            `Адрес: ${addressText || 'не указан'}`,
            `Кластер: ${cluster === 'khamovniki' ? 'Хамовники' : 'другой район'}`,
            `Сроки продажи: ${sellTimeline || 'не указаны'}`,
            buildingId ? `Дом в базе: ${buildingId}` : 'Дома нет в базе',
            `Сообщение: ${clean(body.message, 1500) || '—'}`,
            `Источник: ${source}`,
            `Страница: ${clean(body.page_path, 200)}`,
          ].join('\n'),
          category: 'transactional',
        });
      }
    } catch {
      // Отправка письма не должна отменять сохранённое обращение.
    }

    return Response.json({ ok: true, id: lead.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}