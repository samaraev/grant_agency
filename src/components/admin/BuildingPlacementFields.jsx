import { t } from '@/lib/i18n';

const FIELD =
  'h-[38px] w-full border border-white/10 bg-[#1f272b] px-3 text-[13px] text-white focus:border-[#c8102e] focus:outline-none disabled:opacity-40';

const GROUPS = ['park_kultury', 'frunzenskaya', 'plushchiha', 'other'];

/** Где дом появляется на сайте: каталог, главная, приоритетный блок. */
export default function BuildingPlacementFields({ draft, onChange }) {
  const copy = t.admin.buildings.form;

  return (
    <div className="border border-white/10 bg-[#1f272b]/50 p-4">
      <div className="eyebrow mb-3">{copy.placement}</div>

      <div className="space-y-3">
        <label className="flex items-start gap-3 text-[13px] text-[#d7dcde]">
          <input
            type="checkbox"
            checked={Boolean(draft.is_published)}
            onChange={(event) => onChange({ is_published: event.target.checked })}
            className="mt-0.5 h-4 w-4 accent-[#c8102e]"
          />
          {copy.published}
        </label>

        <label className="flex items-start gap-3 text-[13px] text-[#d7dcde]">
          <input
            type="checkbox"
            checked={Boolean(draft.is_priority)}
            onChange={(event) => onChange({ is_priority: event.target.checked })}
            className="mt-0.5 h-4 w-4 accent-[#c8102e]"
          />
          {copy.isPriority}
        </label>

        <label className="flex items-start gap-3 text-[13px] text-[#d7dcde]">
          <input
            type="checkbox"
            checked={Boolean(draft.is_featured)}
            onChange={(event) => onChange({ is_featured: event.target.checked })}
            className="mt-0.5 h-4 w-4 accent-[#c8102e]"
          />
          {copy.featuredOnHome}
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="b-featured-order" className="eyebrow mb-2 block">
              {copy.featuredOrder}
            </label>
            <input
              id="b-featured-order"
              type="number"
              min="1"
              value={draft.featured_order ?? ''}
              onChange={(event) => onChange({ featured_order: event.target.value })}
              disabled={!draft.is_featured}
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor="b-neighborhood-group" className="eyebrow mb-2 block">
              {copy.neighborhoodGroup}
            </label>
            <select
              id="b-neighborhood-group"
              value={draft.neighborhood_group || 'other'}
              onChange={(event) => onChange({ neighborhood_group: event.target.value })}
              className={FIELD}
            >
              {GROUPS.map((group) => (
                <option key={group} value={group} className="bg-[#1f272b]">
                  {copy.neighborhoodGroups[group]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}