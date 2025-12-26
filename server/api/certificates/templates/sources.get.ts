/**
 * GET /api/certificates/templates/sources
 * Получить список доступных источников данных для переменных
 */

import { getAvailableVariableSources } from '../../../utils/certificateGenerator';

export default defineEventHandler(async () => {
  const sources = getAvailableVariableSources();

  // Группируем по категориям
  const grouped = sources.reduce((acc: Record<string, { value: string; label: string }[]>, source) => {
    if (!acc[source.group]) {
      acc[source.group] = [];
    }
    acc[source.group].push({
      value: source.value,
      label: source.label,
    });
    return acc;
  }, {});

  return {
    success: true,
    sources,
    grouped,
  };
});
