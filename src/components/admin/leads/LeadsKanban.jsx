import { useState } from 'react';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { FUNNEL_STAGES, normalizeStatus } from '@/lib/leadStatus';

function LeadCard({ lead }) {
  return (
    <div className="border border-white/10 bg-[#263033] p-3">
      <div className="truncate text-[12.5px] font-semibold text-white">{lead.name || '—'}</div>
      <div className="mt-0.5 text-[11.5px] text-[#b0b8bc]">{lead.phone}</div>
      {lead.address_text ? (
        <div className="mt-1 truncate text-[11px] text-[#8f9a9f]">{lead.address_text}</div>
      ) : null}
      <div className="mt-2 flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.1em] text-[#6f7a7f]">
        <span className="truncate">{lead.source || 'direct'}</span>
        {lead.next_action_date ? (
          <span className="shrink-0 text-[#c9b28c]">{lead.next_action_date}</span>
        ) : null}
      </div>
    </div>
  );
}

function Cards({ leads }) {
  return leads.map((lead, index) => (
    <Draggable key={lead.id} draggableId={lead.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="cursor-grab"
        >
          <LeadCard lead={lead} />
        </div>
      )}
    </Draggable>
  ));
}

function Column({ status, leads }) {
  return (
    <div className="w-[210px] shrink-0">
      <div className="flex items-center justify-between gap-2 bg-[#1f272b] px-2.5 py-2">
        <span className="truncate text-[10.5px] uppercase tracking-[0.1em] text-[#b0b8bc]">
          {t.admin.leads.statuses[status]}
        </span>
        <span className="text-[11px] text-[#6f7a7f]">{leads.length}</span>
      </div>
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn('min-h-[140px] space-y-2 p-1.5', snapshot.isDraggingOver && 'bg-white/[0.04]')}
          >
            <Cards leads={leads} />
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

function RefusalLane({ leads, open, onToggle }) {
  return (
    <div className={cn('shrink-0 border-l border-white/10', open ? 'w-[210px]' : 'w-[44px]')}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-1 bg-[#1f272b] px-2 py-2 text-[10.5px] uppercase tracking-[0.1em] text-[#8f9a9f] hover:text-white"
      >
        {open ? (
          <span className="truncate">{t.admin.leads.lane.nonTarget}</span>
        ) : (
          <span className="[writing-mode:vertical-rl]">{t.admin.leads.lane.nonTarget}</span>
        )}
        <span className="flex shrink-0 items-center gap-1 text-[11px]">
          {leads.length}
          {open ? <ChevronUp className="h-3 w-3" aria-hidden="true" /> : <ChevronDown className="h-3 w-3" aria-hidden="true" />}
        </span>
      </button>
      <Droppable droppableId="non_target">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn('min-h-[140px] space-y-2 p-1.5', snapshot.isDraggingOver && 'bg-white/[0.04]')}
          >
            {open ? <Cards leads={leads} /> : null}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default function LeadsKanban({ leads, onMove }) {
  const [laneOpen, setLaneOpen] = useState(false);
  const grouped = { non_target: [] };
  FUNNEL_STAGES.forEach((status) => {
    grouped[status] = [];
  });
  leads.forEach((lead) => {
    const key = normalizeStatus(lead.status);
    (grouped[key] || grouped.new_inquiry).push(lead);
  });

  const handleDragEnd = (result) => {
    const { destination, draggableId } = result;
    if (!destination) return;
    const lead = leads.find((item) => item.id === draggableId);
    if (!lead || normalizeStatus(lead.status) === destination.droppableId) return;
    onMove(lead, destination.droppableId);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-2 overflow-x-auto pb-3">
        {FUNNEL_STAGES.map((status) => (
          <Column key={status} status={status} leads={grouped[status]} />
        ))}
        <RefusalLane leads={grouped.non_target} open={laneOpen} onToggle={() => setLaneOpen((value) => !value)} />
      </div>
    </DragDropContext>
  );
}