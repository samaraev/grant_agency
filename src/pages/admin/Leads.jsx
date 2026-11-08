import { useEffect, useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import LeadDetail from '@/pages/admin/LeadDetail';
import { downloadCsv, toCsv } from '@/lib/csv';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const STATUS_CLASS = {
  new: 'bg-blue-500/15 text-blue-300',
  contacted: 'bg-yellow-500/15 text-yellow-300',
  meeting_set: 'bg-purple-500/15 text-purple-300',
  closed: 'bg-green-500/15 text-green-300',
  spam: 'bg-white/10 text-[#9aa4a8]',
};

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [source, setSource] = useState('');
  const [sortDesc, setSortDesc] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = () => {
    setLoading(true);
    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    base44.entities.Lead.filter(query, {
      sort: sortDesc ? '-created_date' : 'created_date',
      limit: 300,
    })
      .then((page) => setLeads(page?.items || []))
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [status, type, sortDesc]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return leads.filter((lead) => {
      if (from && new Date(lead.created_date) < new Date(`${from}T00:00:00`)) return false;
      if (source && (lead.source || 'direct') !== source) return false;
      if (!query) return true;
      return `${lead.name || ''} ${lead.phone || ''} ${lead.address_text || ''}`
        .toLowerCase()
        .includes(query);
    });
  }, [leads, search, from, source]);

  const sources = useMemo(
    () => [...new Set(leads.map((lead) => lead.source || 'direct'))].sort(),
    [leads]
  );

  const exportCsv = () => {
    const columns = [
      { key: 'created_date', label: 'Дата' },
      { key: 'type', label: 'Тип' },
      { key: 'name', label: 'Имя' },
      { key: 'phone', label: 'Телефон' },
      { key: 'address_text', label: 'Адрес' },
      { key: 'status', label: 'Статус' },
      { key: 'source', label: 'Источник' },
      { key: 'is_meaningful', label: 'Содержательный' },
      { key: 'message', label: 'Сообщение' },
      { key: 'admin_notes', label: 'Заметки' },
    ];
    const rows = filtered.map((lead) => ({
      ...lead,
      is_meaningful: lead.is_meaningful ? 'да' : 'нет',
    }));
    downloadCsv('leads.csv', toCsv(rows, columns));
  };

  const onSaved = (updated) => {
    setLeads((prev) => prev.map((lead) => (lead.id === updated.id ? updated : lead)));
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">{t.admin.marker}</div>
          <h1 className="mt-3 text-[26px] font-bold text-white">{t.admin.leads.title}</h1>
          <p className="mt-2 text-[13px] text-[#8f9a9f]">{t.admin.leads.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="flex min-h-[40px] items-center gap-2 border border-white/15 px-4 text-[12.5px] text-white hover:border-[#f4a7b0]"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          {t.admin.leads.export}
        </button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6f7a7f]" aria-hidden="true" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t.admin.leads.search}
            className="h-[40px] w-full border border-white/10 bg-[#1f272b] pl-9 pr-3 text-[13px] text-white placeholder:text-[#6f7a7f] focus:border-[#c8102e] focus:outline-none"
          />
        </div>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-[40px] border border-white/10 bg-[#1f272b] px-3 text-[13px] text-white focus:border-[#c8102e] focus:outline-none"
        >
          <option value="">{t.admin.leads.allStatuses}</option>
          {Object.entries(t.admin.leads.statuses).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={type}
          onChange={(event) => setType(event.target.value)}
          className="h-[40px] border border-white/10 bg-[#1f272b] px-3 text-[13px] text-white focus:border-[#c8102e] focus:outline-none"
        >
          <option value="">{t.admin.leads.allTypes}</option>
          {Object.entries(t.lead.types).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={source}
          onChange={(event) => setSource(event.target.value)}
          aria-label={t.admin.leads.allSources}
          className="h-[40px] border border-white/10 bg-[#1f272b] px-3 text-[13px] text-white focus:border-[#c8102e] focus:outline-none"
        >
          <option value="">{t.admin.leads.allSources}</option>
          {sources.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
          aria-label={t.admin.leads.dateFrom}
          className="h-[40px] border border-white/10 bg-[#1f272b] px-3 text-[13px] text-white focus:border-[#c8102e] focus:outline-none"
        />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setSortDesc((value) => !value)}
          className="text-[11.5px] uppercase tracking-[0.14em] text-[#8f9a9f] hover:text-white"
        >
          {t.admin.leads.columns.created} {sortDesc ? '↓' : '↑'}
        </button>
        <span className="text-[11.5px] text-[#6f7a7f]">{filtered.length}</span>
      </div>

      <div className="mt-4 overflow-x-auto border border-white/10">
        <table className="w-full min-w-[860px] text-left">
          <thead className="bg-[#1f272b] text-[10.5px] uppercase tracking-[0.14em] text-[#778287]">
            <tr>
              <th className="px-4 py-3 font-medium">{t.admin.leads.columns.created}</th>
              <th className="px-4 py-3 font-medium">{t.admin.leads.columns.name}</th>
              <th className="px-4 py-3 font-medium">{t.admin.leads.columns.phone}</th>
              <th className="px-4 py-3 font-medium">{t.admin.leads.columns.type}</th>
              <th className="px-4 py-3 font-medium">{t.admin.leads.columns.address}</th>
              <th className="px-4 py-3 font-medium">{t.admin.leads.columns.source}</th>
              <th className="px-4 py-3 font-medium">{t.admin.leads.columns.status}</th>
              <th className="px-4 py-3 font-medium">{t.admin.leads.columns.meaningful}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/8 text-[13px]">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-[#8f9a9f]">
                  {t.admin.common.loading}
                </td>
              </tr>
            ) : filtered.length ? (
              filtered.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => setSelected(lead)}
                  className="cursor-pointer bg-[#1a2025] hover:bg-white/[0.03]"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-[#8f9a9f]">
                    {new Date(lead.created_date).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-4 py-3 text-white">{lead.name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-[#d7dcde]">{lead.phone}</td>
                  <td className="px-4 py-3 text-[#d7dcde]">{t.lead.types[lead.type] || lead.type}</td>
                  <td className="px-4 py-3 text-[#b0b8bc]">{lead.address_text || '—'}</td>
                  <td className="px-4 py-3 text-[#8f9a9f]">{lead.source || 'direct'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'px-2 py-1 text-[10.5px] uppercase tracking-[0.1em]',
                        STATUS_CLASS[lead.status] || 'bg-white/10 text-[#9aa4a8]'
                      )}
                    >
                      {t.admin.leads.statuses[lead.status] || lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={async (event) => {
                        event.stopPropagation();
                        const updated = await base44.entities.Lead.update(lead.id, {
                          is_meaningful: !lead.is_meaningful,
                        });
                        onSaved(updated);
                      }}
                      className={cn(
                        'min-h-[26px] border px-2 text-[11px]',
                        lead.is_meaningful
                          ? 'border-[#c8102e] bg-[#c8102e] text-white'
                          : 'border-white/15 text-[#8f9a9f]'
                      )}
                      aria-pressed={Boolean(lead.is_meaningful)}
                    >
                      {lead.is_meaningful ? '✓' : '—'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-[#8f9a9f]">
                  {t.admin.leads.empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <LeadDetail
        lead={selected}
        onClose={() => setSelected(null)}
        onSaved={(updated) => {
          onSaved(updated);
          setSelected(updated);
        }}
      />
    </div>
  );
}