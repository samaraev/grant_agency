import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { CLIENT_GOAL_KEYS, goalId, readMetricaSettings } from '../../shared/metrica.ts';

/**
 * Публичная конфигурация счётчика для сайта: включён ли счётчик, его номер и
 * сопоставленные цели браузерных событий. Токена и админских данных здесь нет,
 * поэтому функцию может вызывать любой посетитель (нужно для initMetrica).
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const settings = await readMetricaSettings(base44);

    const goals: Record<string, number> = {};
    CLIENT_GOAL_KEYS.forEach((key) => {
      const id = goalId(settings, key);
      if (id) goals[key] = id;
    });

    return Response.json({
      ok: true,
      enabled: settings.enabled && Boolean(settings.counterId),
      counter_id: settings.counterId || '',
      goals,
    });
  } catch (error) {
    return Response.json({ ok: false, enabled: false, counter_id: '', goals: {}, error: error.message });
  }
}