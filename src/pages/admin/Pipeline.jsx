import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getLanguage, t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { PIPELINE_KEYS, pipelineTitle } from '@/lib/pipeline';
import { needsTransitionData } from '@/lib/leadStatus';
import LeadsKanban from '@/components/admin/leads/LeadsKanban';
import StatusTransitionDialog from '@/components/admin/leads/StatusTransitionDialog';

const DEFAULT_PIPELINE = 'owner_sale';

/** Воронка: та же канбан-доска, что в /admin/leads, но по одной воронке. */
export default function Pipeline() {
  const copy = t.admin.pipeline;
  const [params, setParams] = useSearchParams();
  const [pipelines, setPipelines] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [transition, setTransition] = useState(null);

  const requested = params.get('pipeline') || '';
  const available = pipelines.length ? pipelines.map((item) => item.key) : PIPELINE_KEYS;
  const pipeline = available.includes(requested)
    ? requested
    : available.includes(DEFAULT_PIPELINE)
      ? DEFAULT_PIPELINE
      : available[0];

  useEffect(() => {
    base44.entities.Pipeline.filter({ is_active: true }, { sort: 'sort_order', limit: 20 })
      .then((page) => setPipelines(page?.items || []))
      .catch(() => setPipelines([]));
  }, []);

  // Выбранная воронка хранится в адресе: ссылку на вид можно передать коллеге.
  useEffect(() => {
    if (params.get('pipeline') === pipeline) return;
    const next = new URLSearchParams(params);
    next.set('pipeline', pipeline);
    setParams(next, { replace: true });
  }, [pipeline, params, setParams]);

  const load = useCallback(() => {
    setLoading(true);
    base44.entities.Lead.filter({ pipeline }, { sort: '-created_date', limit: 300 })
      .then((page) => setLeads(page?.items || []))
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }, [pipeline]);

  useEffect(load, [load]);

  const replaceLead = (updated) => {
    if (!updated) return;
    setLeads((prev) => prev.map((lead) => (lead.id === updated.id ? updated : lead)));
  };

  const applyStatus = async (lead, nextStatus) => {
    setError('');
    try {
      const res = await base44.functions.invoke('changeLeadStatus', {
        lead_id: lead.id,
        status: nextStatus,
        payload: {},
        note: '',
      });
      replaceLead(res?.data?.lead);
      return true;
    } catch (err) {
      setError(err?.response?.data?.error || t.admin.leads.transition.error);
      return false;
    }
  };

  // Правила перехода те же, что в /admin/leads: обязательные данные собирает диалог.
  const onMove = (lead, nextStatus) => {
    if (needsTransitionData(lead, nextStatus)) {
      setTransition({ lead, status: nextStatus });
      return;
    }
    applyStatus(lead, nextStatus);
  };

  const select = (key) => {
    const next = new URLSearchParams(params);
    next.set('pipeline', key);
    setParams(next);
  };

  return (
    <div>
      <Link
        to="/admin/leads"
        className="inline-flex items-center gap-2 text-[12.5px] text-[#8f9a9f] hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        {copy.backToLeads}
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">{t.admin.marker}</div>
          <h1 className="mt-3 text-[26px] font-bold text-white">{copy.title}</h1>
          <p className="mt-2 text-[13px] text-[#8f9a9f]">{copy.subtitle}</p>
        </div>
        <div className="flex flex-wrap border border-white/15">
          {available.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => select(key)}
              aria-pressed={pipeline === key}
              className={cn(
                'min-h-[40px] px-3 text-[12.5px]',
                pipeline === key ? 'bg-[#c8102e] text-white' : 'text-[#9aa4a8] hover:text-white'
              )}
            >
              {pipelineTitle(key, getLanguage(), pipelines)}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="mt-4 border border-[#c9b28c]/40 px-3 py-2 text-[12.5px] text-[#c9b28c]">{error}</p>
      ) : null}

      <div className="mt-5">
        {loading ? (
          <div className="h-52 animate-pulse border border-white/10 bg-[#263033]" />
        ) : (
          <LeadsKanban leads={leads} onMove={onMove} pipeline={pipeline} />
        )}
      </div>

      <StatusTransitionDialog
        transition={transition}
        onClose={() => setTransition(null)}
        onDone={(updated) => {
          replaceLead(updated);
          setTransition(null);
        }}
      />
    </div>
  );
}