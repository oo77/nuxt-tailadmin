/**
 * Утилиты для работы с временем без конвертации часовых поясов.
 * 
 * Эти функции используются для сохранения локального времени "как есть"
 * без автоматической конвертации JavaScript Date объектов в UTC.
 */

/**
 * Конвертирует ISO строку в формат MySQL DATETIME без изменения часового пояса.
 * "2025-12-23T10:00:00.000Z" -> "2025-12-23 10:00:00"
 * 
 * @param isoString - ISO строка времени
 * @returns Строка в формате MySQL DATETIME
 */
export function isoToMySqlDatetime(isoString: string): string {
  const datePart = isoString.substring(0, 10); // "2025-12-23"
  const timePart = isoString.substring(11, 19); // "10:00:00"
  return `${datePart} ${timePart}`;
}

/**
 * Конвертирует MySQL DATETIME (как Date объект) обратно в ISO строку
 * без конвертации часового пояса.
 * 
 * MySQL хранит "2025-12-23 10:00:00", драйвер создаёт Date с локальным временем,
 * но toISOString() конвертирует в UTC. Эта функция сохраняет время "как есть".
 * 
 * @param date - Date объект из MySQL
 * @returns ISO строка с сохранённым локальным временем
 */
export function dateToLocalIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
}

/**
 * Создаёт ISO строку из даты и времени без конвертации UTC.
 * Используется на клиенте для формирования времени перед отправкой на сервер.
 * 
 * @param dateStr - Дата в формате YYYY-MM-DD
 * @param timeStr - Время в формате HH:MM
 * @returns ISO строка
 */
export function toLocalISOString(dateStr: string, timeStr: string): string {
  return `${dateStr}T${timeStr}:00.000Z`;
}
