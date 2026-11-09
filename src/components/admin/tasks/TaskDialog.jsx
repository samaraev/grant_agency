import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { t } from '@/lib/i18n';
import { TASK_PRIORITIES, asDate, leadLabel } from '@/lib/tasks';

const FIELD =
  'h-[38px] w-full border border-white/10 bg-[#1f272b] px-3 text-[13px] text-white focus:border-[#c8102e] focus:outline-none';
const AREA =
  'w-full resize-none border border-white/10 bg-[#1f272b] p-3 text-[13px] text-white focus:border-[#c8102e] focus:outline-none';

const labelOf = (lead) => (lead ? leadLabel(lead) : '');

export default function TaskDialog({ open, task, defaultLeadId, leads, assignees, onClose, onSaved }) {
  const copy = t.admin.tasks;
  const [leadQuery, setLeadQuery] = useState('');
  const [leadId, setLeadId] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [assignee, setAssignee] = useState('');
  const [priority, setPriority] = useState('normal');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const initialLead = task?.lead_id || defaultLeadId || '';
    const due = asDate(task?.due_at);
    setLeadId(initialLead);
    setLeadQuery(labelOf(leads.find((lead) => lead.id === initialLead)));
    setTitle(task?.title || '');
    setDate(due ? due.toISOString().slice(0, 10) : '');
    setTime(due ? due.toTimeString().slice(0, 5) : '10:00');
    setAssignee(task?.assignee || '');
    setPriority(task?.priority || 'normal');
    setNotes(task?.notes || '');
    setError('');
  }, [open, task, defaultLeadId, leads]);

  const pickLead = (value) => {
    setLeadQuery(value);
    const match = leads.find((lead) => labelOf(lead) === value);
    setLeadId(match ? match.id : '');
  };

  const save = async () => {
    const dueAt = date ? new Date(`${date}T${time || '10:00'}:00`).toISOString() : '';
    if (!title.trim() || !dueAt) {
      setError(copy.required);
      return;
    }
    setSaving(true);
    setError('');
    const stamp = new Date().toISOString();
    try {
      const payload = {
        title: title.trim(),
        due_at: dueAt,
        assignee: assignee.trim(),
        priority,
        notes,
        lead_id: leadId || null,
        updated_at: stamp,
      };
      const saved = task
        ? await base44.entities.Task.update(task.id, payload)
        : await base44.entities.Task.create({
            ...payload,
            status: 'open',
            reminder_sent: false,
            created_at: stamp,
            created_by: assignees.currentUserEmail || '',
          });
      onSaved(saved);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => (value ? null : onClose())}>
      <DialogContent className="max-h-[92vh] w-[calc(100%-1.5rem)] max-w-[640px] overflow-y-auto border-white/10 bg-[#263033]">
        <DialogTitle className="text-[18px] font-bold text-white">
          {task ? copy.edit : copy.create}
        </DialogTitle>

        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="task-lead" className="mb-1 block text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
              {copy.lead}
            </label>
            <input
              id="task-lead"
              list="task-lead-options"
              value={leadQuery}
              onChange={(event) => pickLead(event.target.value)}
              placeholder={copy.leadPlaceholder}
              className={FIELD}
            />
            <datalist id="task-lead-options">
              {leads.map((lead) => (
                <option key={lead.id} value={labelOf(lead)} />
              ))}
            </datalist>
          </div>

          <div>
            <label htmlFor="task-title" className="mb-1 block text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
              {copy.titleField}
            </label>
            <input
              id="task-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={FIELD}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="task-date" className="mb-1 block text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
                {copy.date}
              </label>
              <input
                id="task-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className={FIELD}
              />
            </div>
            <div>
              <label htmlFor="task-time" className="mb-1 block text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
                {copy.time}
              </label>
              <input
                id="task-time"
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                className={FIELD}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="task-assignee"
                className="mb-1 block text-[10.5px] uppercase tracking-[0.16em] text-[#778287]"
              >
                {copy.assignee}
              </label>
              <input
                id="task-assignee"
                list="task-assignee-options"
                value={assignee}
                onChange={(event) => setAssignee(event.target.value)}
                placeholder={copy.assigneePlaceholder}
                className={FIELD}
              />
              <datalist id="task-assignee-options">
                {assignees.options.map((email) => (
                  <option key={email} value={email} />
                ))}
              </datalist>
            </div>
            <div>
              <label
                htmlFor="task-priority"
                className="mb-1 block text-[10.5px] uppercase tracking-[0.16em] text-[#778287]"
              >
                {copy.priority}
              </label>
              <select
                id="task-priority"
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
                className={FIELD}
              >
                {TASK_PRIORITIES.map((key) => (
                  <option key={key} value={key} className="bg-[#1f272b]">
                    {copy.priorities[key]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="task-notes" className="mb-1 block text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
              {copy.notes}
            </label>
            <textarea
              id="task-notes"
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className={AREA}
            />
          </div>

          {error ? <p className="text-[12.5px] text-[#ff8a96]">{error}</p> : null}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="min-h-[38px] bg-[#c8102e] px-4 text-[12.5px] font-semibold text-white disabled:opacity-60"
            >
              {saving ? t.admin.common.loading : copy.save}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[38px] border border-white/15 px-4 text-[12.5px] text-[#b0b8bc] hover:text-white"
            >
              {copy.cancel}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}