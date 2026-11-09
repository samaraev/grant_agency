import { useEffect, useMemo, useState } from 'react';
import { Download, Plus, Search, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import BuildingForm from '@/components/admin/BuildingForm';
import { base44 } from '@/api/base44Client';
import { downloadCsv, parseCsv, toCsv } from '@/lib/csv';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const CSV_COLUMNS = [
  'address',
  'property_type',
  'deal_type',
  'price',
  'area',
  'district',
  'street',
  'house_number',
  'year_built',
  'series_or_type',
  'floors',
  'entrances',
  'apartments_count',
  'description',
  'features',
  'latitude',
  'longitude',
  'is_priority',
  'expert_verified',
  'verified_at',
  'verified_by',
];

export default function BuildingsAdmin() {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importReport, setImportReport] = useState(null);
  const [importing, setImporting] = useState(false);

  const load = () => {
    setLoading(true);
    base44.entities.Building.list({ sort: '-updated_at', limit: 500 })
      .then((page) => setBuildings(page?.items || []))
      .catch(() => setBuildings([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return buildings;
    return buildings.filter((item) =>
      `${item.address} ${item.district || ''}`.toLowerCase().includes(query)
    );
  }, [buildings, search]);

  const exportCsv = () => {
    const rows = buildings.map((item) => ({
      ...item,
      features: (item.features || []).join('; '),
    }));
    const columns = [...CSV_COLUMNS.map((key) => ({ key, label: key })), { key: 'is_published', label: 'is_published' }];
    downloadCsv('buildings.csv', toCsv(rows, columns));
  };

  const importCsv = async (file) => {
    if (!file) return;
    setImporting(true);
    setImportReport(null);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      const byAddress = new Map(buildings.map((item) => [String(item.address).toLowerCase(), item]));
      const toCreate = [];
      const toUpdate = [];

      rows.forEach((row) => {
        if (!row.address) return;
        const payload = {
          address: row.address,
          property_type: row.property_type || 'residential',
          deal_type: row.deal_type || 'sale',
          price: row.price ? Number(row.price) : null,
          area: row.area ? Number(row.area) : null,
          district: row.district || '',
          street: row.street || '',
          house_number: row.house_number || '',
          year_built: row.year_built ? Number(row.year_built) : null,
          series_or_type: row.series_or_type || '',
          floors: row.floors ? Number(row.floors) : null,
          entrances: row.entrances ? Number(row.entrances) : null,
          apartments_count: row.apartments_count ? Number(row.apartments_count) : null,
          description: row.description || '',
          features: (row.features || '')
            .split(';')
            .map((line) => line.trim())
            .filter(Boolean),
          latitude: row.latitude ? Number(row.latitude) : null,
          longitude: row.longitude ? Number(row.longitude) : null,
          ...(row.is_priority ? { is_priority: row.is_priority === 'true' } : {}),
          ...(row.expert_verified ? { expert_verified: row.expert_verified === 'true' } : {}),
          ...(row.verified_at ? { verified_at: row.verified_at } : {}),
          ...(row.verified_by ? { verified_by: row.verified_by } : {}),
          updated_at: new Date().toISOString().slice(0, 10),
        };
        const existing = byAddress.get(row.address.toLowerCase());
        if (existing) toUpdate.push({ id: existing.id, ...payload });
        else toCreate.push({ ...payload, is_published: row.is_published !== 'false', photos: [] });
      });

      if (toCreate.length) await base44.entities.Building.bulkCreate(toCreate);
      if (toUpdate.length) await base44.entities.Building.bulkUpdate(toUpdate);

      setImportReport({ created: toCreate.length, updated: toUpdate.length, failed: rows.length - toCreate.length - toUpdate.length });
      load();
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">{t.admin.marker}</div>
          <h1 className="mt-3 text-[26px] font-bold text-white">{t.admin.buildings.title}</h1>
          <p className="mt-2 max-w-2xl text-[13px] text-[#8f9a9f]">{t.admin.buildings.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="flex min-h-[40px] items-center gap-2 border border-white/15 px-4 text-[12.5px] text-white hover:border-[#c9b28c]"
          >
            <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            {t.admin.buildings.import}
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="flex min-h-[40px] items-center gap-2 border border-white/15 px-4 text-[12.5px] text-white hover:border-[#c9b28c]"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            {t.admin.buildings.export}
          </button>
          <button
            type="button"
            onClick={() => setEditing({})}
            className="flex min-h-[40px] items-center gap-2 bg-[#c8102e] px-4 text-[12.5px] font-semibold text-white"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            {t.admin.buildings.add}
          </button>
        </div>
      </div>

      <div className="relative mt-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6f7a7f]" aria-hidden="true" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t.admin.buildings.searchPlaceholder}
          className="h-[40px] w-full border border-white/10 bg-[#1f272b] pl-9 pr-3 text-[13px] text-white placeholder:text-[#6f7a7f] focus:border-[#c8102e] focus:outline-none"
        />
      </div>

      <div className="mt-4 overflow-x-auto border border-white/10">
        <table className={cn('w-full text-left', !loading && filtered.length ? 'min-w-[720px]' : '')}>
          <thead className="bg-[#1f272b] text-[10.5px] uppercase tracking-[0.14em] text-[#778287]">
            <tr>
              <th className="px-4 py-3 font-medium">{t.admin.buildings.columns.address}</th>
              <th className="px-4 py-3 font-medium">{t.admin.buildings.columns.district}</th>
              <th className="px-4 py-3 font-medium">{t.admin.buildings.columns.year}</th>
              <th className="px-4 py-3 font-medium">{t.admin.buildings.columns.published}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/8 text-[13px]">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-[#8f9a9f]">
                  {t.admin.common.loading}
                </td>
              </tr>
            ) : filtered.length ? (
              filtered.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setEditing(item)}
                  className="cursor-pointer bg-[#1a2025] hover:bg-white/[0.03]"
                >
                  <td className="px-4 py-3 text-white">{item.address}</td>
                  <td className="px-4 py-3 text-[#b0b8bc]">{item.district || '—'}</td>
                  <td className="px-4 py-3 text-[#8f9a9f]">{item.year_built || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        item.is_published
                          ? 'bg-green-500/15 px-2 py-1 text-[10.5px] uppercase tracking-[0.1em] text-green-300'
                          : 'bg-white/10 px-2 py-1 text-[10.5px] uppercase tracking-[0.1em] text-[#9aa4a8]'
                      }
                    >
                      {item.is_published ? t.admin.buildings.published : t.admin.buildings.draft}
                    </span>
                    {item.is_featured ? (
                      <span className="ml-2 bg-[#c9b28c]/15 px-2 py-1 text-[10.5px] uppercase tracking-[0.1em] text-[#c9b28c]">
                        {t.admin.buildings.homeBadge}
                        {item.featured_order ? ` ${item.featured_order}` : ''}
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-[#8f9a9f]">
                  {t.admin.buildings.empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing ? (
        <BuildingForm
          building={editing.id ? editing : null}
          open={Boolean(editing)}
          onOpenChange={(open) => !open && setEditing(null)}
          onSaved={load}
          onDeleted={load}
        />
      ) : null}

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-[560px] border-white/10 bg-[#263033]">
          <DialogTitle className="text-[18px] font-bold text-white">
            {t.admin.buildings.importDialog.title}
          </DialogTitle>
          <p className="text-[12.5px] leading-relaxed text-[#b0b8bc]">
            {t.admin.buildings.importDialog.text}
          </p>
          <label className="mt-4 flex min-h-[42px] cursor-pointer items-center gap-2 border border-white/15 px-4 text-[12.5px] text-white">
            <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            {importing ? t.admin.buildings.importDialog.running : t.admin.buildings.importDialog.file}
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) => importCsv(event.target.files?.[0])}
            />
          </label>
          <button
            type="button"
            onClick={() =>
              downloadCsv(
                'buildings-template.csv',
                toCsv(
                  [
                    {
                      address: 'ул. Примерная, 1',
                      district: 'Центральный',
                      street: 'ул. Примерная',
                      house_number: '1',
                      year_built: 1970,
                      series_or_type: 'Панель',
                      floors: 9,
                      entrances: 4,
                      apartments_count: 144,
                      description: 'Описание дома',
                      features: 'Первая особенность; Вторая особенность',
                      latitude: 54.1938,
                      longitude: 37.6178,
                    },
                  ],
                  CSV_COLUMNS.map((key) => ({ key, label: key }))
                )
              )
            }
            className="mt-3 text-[12px] text-[#c9b28c] hover:text-white"
          >
            {t.admin.buildings.importDialog.template}
          </button>
          {importReport ? (
            <p className="mt-4 border border-white/10 bg-[#1f272b] px-3 py-2 text-[12px] text-[#d7dcde]">
              {t.admin.buildings.importDialog.result
                .replace('{created}', importReport.created)
                .replace('{updated}', importReport.updated)
                .replace('{failed}', importReport.failed)}
            </p>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}