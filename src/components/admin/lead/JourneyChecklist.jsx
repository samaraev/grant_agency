import { Check } from 'lucide-react';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { journeyProgress } from '@/lib/leadJourney';

/** Путь по воронке: шаги зависят от роли человека. */
export default function JourneyChecklist({ lead }) {
  const { group, steps, stopped } = journeyProgress(lead);
  const labels = t.admin.leads.workspace.journey[group];

  return (
    <div className="border border-white/10 bg-[#1f272b] p-4">
      <div className="eyebrow">{t.admin.leads.workspace.journey.title}</div>
      {stopped ? <p className="mt-2 text-[12px] text-[#c9b28c]">{t.admin.leads.workspace.journey.stopped}</p> : null}
      <ol className="mt-3 space-y-1.5">
        {steps.map((step) => (
          <li key={step.index} className="flex items-center gap-2.5 text-[12.5px]">
            <span
              className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center border text-[10px]',
                step.done ? 'border-[#c8102e] bg-[#c8102e] text-white' : 'border-white/20 text-[#6f7a7f]'
              )}
            >
              {step.done ? <Check className="h-3 w-3" aria-hidden="true" /> : step.index + 1}
            </span>
            <span className={step.done ? 'text-white' : 'text-[#8f9a9f]'}>{labels[step.index]}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}