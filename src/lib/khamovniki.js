/** Хамовники — первый кластер агентства. Определяем по названию района в базе. */
export function isKhamovniki(building) {
  const district = String(building?.district || '').toLowerCase();
  return district.includes('хамовник') || district.includes('khamovnik');
}

/** Приоритетные и проверенные дома идут первыми. */
export function byPriority(a, b) {
  return (
    Number(Boolean(b.is_priority)) - Number(Boolean(a.is_priority)) ||
    Number(Boolean(b.expert_verified)) - Number(Boolean(a.expert_verified))
  );
}

export function publishedKhamovniki(buildings = []) {
  return buildings.filter((item) => item.is_published !== false && isKhamovniki(item)).sort(byPriority);
}

/** Избранная подборка главной: шесть домов справочника в заданном порядке. */
export function featuredBuildings(buildings = []) {
  return buildings
    .filter((item) => item.is_featured && item.is_published !== false)
    .sort((a, b) => (a.featured_order || 99) - (b.featured_order || 99));
}