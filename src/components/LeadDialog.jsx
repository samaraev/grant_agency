import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import LeadForm from '@/components/LeadForm';
import { t } from '@/lib/i18n';

export default function LeadDialog({ open, onOpenChange, initial = {} }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[calc(100%-1.5rem)] max-w-[620px] overflow-y-auto border-white/10 bg-[#263033] p-0 sm:w-full">
        <div className="border-b border-white/10 px-5 py-5 sm:px-7">
          <div className="eyebrow">{t.lead.title}</div>
          <DialogTitle className="mt-2 text-[22px] font-bold text-white">
            {t.lead.modalSubtitle}
          </DialogTitle>
        </div>
        <div className="px-5 py-6 sm:px-7">
          <LeadForm
            key={`${initial.type || ''}-${initial.address || ''}-${initial.building_id || ''}-${initial.cluster || ''}`}
            defaultType={initial.type}
            defaultAddress={initial.address}
            buildingId={initial.building_id}
            cluster={initial.cluster || null}
            onSuccess={() => {}}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}