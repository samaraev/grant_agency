// Деньги сделки: валюта, комиссия и форматирование. Одна точка для карточки, таблицы, CSV и отчётов.

export const CURRENCIES = ['RUB', 'USD', 'EUR'];

const SYMBOLS = { RUB: '₽', USD: '$', EUR: '€' };
const numberFormat = new Intl.NumberFormat('ru-RU');

export function dealCurrency(lead) {
  const value = lead?.deal_currency;
  return CURRENCIES.includes(value) ? value : 'RUB';
}

export function currencySymbol(currency) {
  return SYMBOLS[CURRENCIES.includes(currency) ? currency : 'RUB'];
}

/** Комиссия в деньгах: сумма × процент. Никогда не хранится, считается на месте. */
export function commissionAmount(value, percent) {
  const sum = Number(value);
  const rate = Number(percent);
  if (!Number.isFinite(sum) || !Number.isFinite(rate) || sum <= 0 || rate <= 0) return null;
  return Math.round((sum * rate) / 100);
}

/** Комиссия по обращению, если заполнены сумма и процент. */
export function leadCommission(lead) {
  return commissionAmount(lead?.deal_value, lead?.commission_percent);
}

/** «1 200 000 ₽». Без валюты — просто число; пустое значение — прочерк. */
export function formatMoney(amount, currency) {
  if (amount === null || amount === undefined || amount === '') return '—';
  const value = Number(amount);
  if (!Number.isFinite(value)) return '—';
  const number = numberFormat.format(value);
  return currency ? `${number} ${currencySymbol(currency)}` : number;
}