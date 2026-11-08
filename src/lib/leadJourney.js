// Путь человека по воронке: какие ступени уже пройдены при текущем статусе.
import { statusIndex } from '@/lib/leadStatus';

/** Индекс ступени воронки, начиная с которой шаг считается пройденным. */
export const JOURNEY = {
  owner: [0, 3, 4, 5, 5, 6, 7, 8],
  buyer: [0, 3, 4, 5, 6, 8],
  generic: [0, 3, 4, 6, 8],
};

export function journeyGroup(role) {
  if (role === 'owner') return 'owner';
  if (role === 'buyer') return 'buyer';
  return 'generic';
}

/** Шаги пути с отметкой «пройден» для текущего статуса. */
export function journeyProgress(lead) {
  const group = journeyGroup(lead?.person_role);
  const current = statusIndex(lead?.status);
  const steps = JOURNEY[group].map((at, index) => ({ at, index, done: current >= at }));
  return { group, steps, stopped: current < 0 };
}