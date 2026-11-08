import { t } from '@/lib/i18n';

const numberFormat = new Intl.NumberFormat('ru-RU');

export const PROPERTY_GROUPS = {
  offices: ['office', 'corporate_housing'],
  residences: ['apartment', 'penthouse'],
  estates: ['dacha', 'estate'],
};

export function formatPrice(building) {
  if (!building?.price) return t.common.priceOnRequest;
  const amount = `${numberFormat.format(building.price)} ₽`;
  return building.deal_type === 'rent' ? `${amount} ${t.common.perMonth}` : amount;
}

export function formatArea(building) {
  return building?.area ? `${numberFormat.format(building.area)} ${t.common.sqm}` : '';
}

export function propertyTypeLabel(building) {
  return t.propertyTypes[building?.property_type] || t.propertyTypes.residential;
}

export function dealLabel(building) {
  return t.deals[building?.deal_type] || t.deals.sale;
}