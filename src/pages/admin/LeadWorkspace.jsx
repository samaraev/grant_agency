import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { dateLocale, t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { STATUS_TONE, normalizeStatus, statusLabel } from '@/lib/leadStatus';
import LeadOverviewTab from '@/components/admin/lead/LeadOverviewTab';
import LeadCommunicationsTab from '@/components/admin/lead/LeadCommunicationsTab';
import LeadAnalysisTab from '@/components/admin/lead/LeadAnalysisTab';
import LeadMeetingsTab from '@/components/admin/lead/LeadMeetingsTab';
import LeadHistoryTab from '@/components/admin/lead/LeadHistoryTab';

const TABS = ['overview', 'communications', 'analysis', 'meetings', 'history'];

export default function LeadWorkspace() {
  const { id } = useParams();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [tab, setTab] = useState('overview');

  const load = useCallback(() => {
    base44.entities.Lead.get(id)
      .then(setLead)
      .catch(() => setMissing(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <div className="h-40 animate-pulse border border-white/10 bg-[#263033]" />;
  }

  if (missing || !lead) {
    return (
      <div>
        <Link to="/admin/leads" className="inline-flex items-center gap-2 text-[12.5px] text-[#8f9a9f] hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {t.admin.leads.workspace.back}
        </Link>
        <p className="mt-6 border border-white/10 bg-[#263033] p-6 text-[13px] text-[#b0b8bc]">
          {t.admin.leads.workspace.notFound}
        </p>
      </div>
    );
  }

  return (
    <div>
      <Link to="/admin/leads" className="inline-flex items-center gap-2 text-[12.5px] text-[#8f9a9f] hover:text-white">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        {t.admin.leads.workspace.back}
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">{t.admin.leads.detail.title}</div>
          <h1 className="mt-2 text-[24px] font-bold text-white">
            {lead.name} · {lead.phone}
          </h1>
          <p className="mt-1 text-[12.5px] text-[#8f9a9f]">
            {new Date(lead.created_date).toLocaleString(dateLocale())} · {lead.source || 'direct'}
          </p>
        </div>
        <span
          className={cn(
            'px-2.5 py-1 text-[10.5px] uppercase tracking-[0.1em]',
            STATUS_TONE[normalizeStatus(lead.status)] || 'bg-white/10 text-[#9aa4a8]'
          )}
        >
          {statusLabel(lead.status, t)}
        </span>
      </div>

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-white/10">
        {TABS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              'shrink-0 border-b-2 px-3 py-2.5 text-[12.5px] whitespace-nowrap transition-colors',
              tab === key
                ? 'border-[#c8102e] text-white'
                : 'border-transparent text-[#8f9a9f] hover:text-white'
            )}
          >
            {t.admin.leads.workspace.tabs[key]}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === 'overview' ? <LeadOverviewTab lead={lead} onSaved={setLead} /> : null}
        {tab === 'communications' ? (
          <LeadCommunicationsTab lead={lead} onLeadChange={setLead} onMeetings={() => setTab('meetings')} />
        ) : null}
        {tab === 'analysis' ? <LeadAnalysisTab lead={lead} /> : null}
        {tab === 'meetings' ? <LeadMeetingsTab lead={lead} /> : null}
        {tab === 'history' ? <LeadHistoryTab lead={lead} /> : null}
      </div>
    </div>
  );
}