import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const ALLOWED_TYPES = ['owner_appraise', 'owner_sell', 'buyer_buy', 'buyer_check', 'general', 'rent'];
const ALLOWED_CONTACTS = ['phone', 'telegram', 'whatsapp'];
const ALLOWED_CLUSTERS = ['khamovniki', 'other'];
const ALLOWED_TIMELINES = ['asap', 'month', 'quarter', 'later', 'undecided'];
const ALLOWED_TIMEFRAMES = ['asap', '1_3_months', '3_6_months', 'later', 'unknown'];

const TIME_BY_SELL = {
  asap: 'asap',
  month: '1_3_months',
  quarter: '3_6_months',
  later: 'later',
  undecided: 'unknown',
};

const TYPE_ROLES = {
  owner_appraise: 'owner',
  owner_sell: 'owner',
  buyer_buy: 'buyer',
  buyer_check: 'buyer',
  rent: 'tenant',
};

// Не более 5 обращений за 10 минут с одного адреса и с одного телефона.
const attempts = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const REPEAT_WINDOW_MS = 24 * 60 * 60 * 1000;

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

function targetTokens(value) {
  return String(value || '')
    .toLowerCase()
    .split(/[,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
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

    // Дополнительная проверка по базе: память процесса сбрасывается между инстансами.
    const recentWindow = new Date(Date.now() - WINDOW_MS).toISOString();
    const recentByPhone = await base44.asServiceRole.entities.Lead.filter(
      { phone: rawPhone, created_date: { $gte: recentWindow } },
      { limit: MAX_PER_WINDOW + 1 }
    ).catch(() => ({ items: [] }));
    if ((recentByPhone?.items || []).length >= MAX_PER_WINDOW) {
      return Response.json({ error: 'rate_limited' }, { status: 429 });
    }

    const preferred = ALLOWED_CONTACTS.includes(body.preferred_contact)
      ? body.preferred_contact
      : 'phone';

    const utm = body.utm && typeof body.utm === 'object' ? body.utm : {};
    const source =
      [utm.utm_source, utm.utm_medium, utm.utm_campaign].filter(Boolean).join(' / ') ||
      clean(body.referrer, 200) ||
      'direct';

    const sellTimeline = ALLOWED_TIMELINES.includes(body.sell_timeline) ? body.sell_timeline : null;
    const timeframeHint = ALLOWED_TIMEFRAMES.includes(body.timeframe_hint)
      ? body.timeframe_hint
      : TIME_BY_SELL[sellTimeline] || 'unknown';

    // Настройки агентства: целевые районы и улицы, ответственный по умолчанию.
    const settingsPage = await base44.asServiceRole.entities.AdminSettings.list({ limit: 1 }).catch(
      () => null
    );
    const agency = settingsPage?.items?.[0] || {};
    const targetDistricts = targetTokens(agency.target_districts);
    const targetStreets = (agency.target_streets || []).map((item) => String(item).toLowerCase().trim()).filter(Boolean);

    const addressText = clean(body.address_text, 200);

    // Если адрес совпал с домом в базе — сохраняем связь.
    let building = null;
    if (body.building_id) {
      building = await base44.entities.Building.get(body.building_id).catch(() => null);
    } else if (addressText) {
      const page = await base44.entities.Building.filter({ address: addressText }, { limit: 1 }).catch(
        () => null
      );
      building = page?.items?.[0] || null;
    }

    const haystack = [building?.district, building?.street, addressText]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const inTarget =
      Boolean(haystack) &&
      (targetDistricts.some((token) => haystack.includes(token)) ||
        targetStreets.some((token) => haystack.includes(token)));
    const areaFlag = inTarget ? 'in_target' : 'unknown';
    const cluster = ALLOWED_CLUSTERS.includes(body.cluster)
      ? body.cluster
      : inTarget
        ? 'khamovniki'
        : 'other';

    // Повторное обращение того же человека за сутки.
    const repeatWindow = new Date(Date.now() - REPEAT_WINDOW_MS).toISOString();
    const previous = await base44.asServiceRole.entities.Lead.filter(
      { phone: rawPhone, created_date: { $gte: repeatWindow } },
      { limit: 1 }
    ).catch(() => ({ items: [] }));
    const isRepeat = (previous?.items || []).length > 0;

    const consentAt = clean(body.consent_at, 40) || new Date().toISOString();
    const consentVersion = clean(body.consent_text_version, 60) || '152fz-form-v1';

    const lead = await base44.entities.Lead.create({
      type,
      person_role: TYPE_ROLES[type] || 'other',
      area_flag: areaFlag,
      timeframe_hint: timeframeHint,
      cluster,
      sell_timeline: sellTimeline,
      agreement: 'none',
      building_id: building?.id || null,
      address_text: addressText,
      name,
      phone: rawPhone,
      preferred_contact: preferred,
      message: clean(body.message, 1500),
      status: 'new_inquiry',
      source,
      client_id: clean(body.client_id, 100),
      utm_source: clean(utm.utm_source, 120),
      utm_medium: clean(utm.utm_medium, 120),
      utm_campaign: clean(utm.utm_campaign, 120),
      utm_term: clean(utm.utm_term, 120),
      utm_content: clean(utm.utm_content, 120),
      referrer: clean(body.referrer, 300),
      page_path: clean(body.page_path, 200),
      responsible: clean(agency.default_responsible, 160),
      consent_at: consentAt,
      consent_text_version: consentVersion,
      is_repeat: isRepeat,
      is_meaningful: false,
    });

    // Первая запись в истории статусов.
    try {
      await base44.asServiceRole.entities.StatusHistory.create({
        lead_id: lead.id,
        from_status: '',
        to_status: 'new_inquiry',
        changed_by: 'site',
        note: 'Обращение с сайта',
      });
    } catch {
      // История не должна отменять сохранённое обращение.
    }

    // Уведомление администратору — не мешает приёму обращения.
    try {
      const settingsPageSite = await base44.entities.SiteSettings.list({ limit: 1 });
      const settings = settingsPageSite?.items?.[0] || {};
      const adminEmail = agency.default_responsible || settings.admin_email || settings.email;
      if (adminEmail) {
        const typeLabels = {
          owner_appraise: 'Оценить квартиру',
          owner_sell: 'Продать',
          buyer_buy: 'Купить',
          buyer_check: 'Проверить дом',
          general: 'Общий вопрос',
          rent: 'Аренда',
        };
        const roleLabels = {
          owner: 'собственник',
          buyer: 'покупатель',
          tenant: 'арендатор',
          other: 'другое',
        };
        const areaLabels = {
          in_target: `в целевом кластере (${clean(agency.target_districts, 120) || 'Хамовники'})`,
          outside: 'вне целевого кластера',
          unknown: 'не определено',
        };
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: adminEmail,
          subject: `Новое обращение: ${typeLabels[type] || type} — ${addressText || 'без адреса'}`,
          body: [
            `Тип: ${typeLabels[type] || type}`,
            `Роль: ${roleLabels[TYPE_ROLES[type] || 'other']}`,
            `Имя: ${name}`,
            `Телефон: ${rawPhone}`,
            `Удобная связь: ${preferred}`,
            `Адрес: ${addressText || 'не указан'}`,
            `Кластер: ${cluster === 'khamovniki' ? 'Хамовники' : 'другой район'}`,
            `Зона: ${areaLabels[areaFlag]}`,
            `Срок: ${timeframeHint}`,
            `Сроки продажи из формы: ${sellTimeline || 'не указаны'}`,
            `Повторное обращение за сутки: ${isRepeat ? 'да' : 'нет'}`,
            `Ответственный: ${clean(agency.default_responsible, 160) || 'не назначен'}`,
            building ? `Дом в базе: ${building.address || building.id}` : 'Дома нет в базе',
            `Сообщение: ${clean(body.message, 1500) || '—'}`,
            `Источник: ${source}`,
            `UTM term / content: ${clean(utm.utm_term, 120) || '—'} / ${clean(utm.utm_content, 120) || '—'}`,
            `ClientID: ${clean(body.client_id, 100) || '—'}`,
            `Страница: ${clean(body.page_path, 200)}`,
            `Согласие: ${consentVersion} от ${consentAt}`,
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