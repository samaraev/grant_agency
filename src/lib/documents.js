// Документы обращений: типы и вспомогательные функции для интерфейса.

export const DOC_TYPES = ['contract', 'passport', 'extract', 'valuation', 'other'];

export function docTypeLabel(type, t) {
  return t.admin.documents.types[type] || t.admin.documents.types.other;
}

/** Размер файла в человекочитаемом виде; «—», если он неизвестен. */
export function formatSize(bytes) {
  const size = Number(bytes);
  if (!size || size < 0) return '—';
  if (size < 1024) return `${size} Б`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} КБ`;
  return `${(size / (1024 * 1024)).toFixed(1)} МБ`;
}