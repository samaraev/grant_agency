/**
 * Воронки (Pipelines) для интерфейса: ключи, вывод из типа и подписи.
 * Правило вывода зеркалит inferPipeline() из base44/shared/leadFunnel.ts —
 * единственный источник истины для формы, бэкфилла и серверных функций.
 */

export const PIPELINE_KEYS = ['owner_sale', 'buyer_search', 'rental'];

const TYPE_TO_PIPELINE = {
  owner_appraise: 'owner_sale',
  owner_sell: 'owner_sale',
  buyer_buy: 'buyer_search',
  buyer_check: 'buyer_search',
  rent: 'rental',
  general: 'owner_sale',
};

const FALLBACK = {
  owner_sale: { ru: 'Продажа собственника', en: 'Owner sale' },
  buyer_search: { ru: 'Подбор для покупателя', en: 'Buyer search' },
  rental: { ru: 'Аренда', en: 'Rental' },
};

/** Воронка по типу обращения: owner_* → owner_sale, buyer_* → buyer_search, rent → rental. */
export function pipelineForType(type) {
  return TYPE_TO_PIPELINE[type] || 'owner_sale';
}

/** Воронка обращения: сохранённая, иначе выведенная из типа (старые записи без поля). */
export function pipelineOf(lead) {
  const stored = lead?.pipeline;
  return PIPELINE_KEYS.includes(stored) ? stored : pipelineForType(lead?.type);
}

/** Подпись воронки: из справочника Pipeline, иначе встроенная. */
export function pipelineTitle(pipeline, lang, pipelines = []) {
  const key = PIPELINE_KEYS.includes(pipeline) ? pipeline : 'owner_sale';
  const record = pipelines.find((item) => item.key === key);
  const title = lang === 'en' ? record?.title_en : record?.title_ru;
  return title || (lang === 'en' ? FALLBACK[key].en : FALLBACK[key].ru);
}