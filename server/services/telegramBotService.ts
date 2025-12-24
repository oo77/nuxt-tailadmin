/**
 * Telegram Bot Service - Логика обработки сообщений
 * FSM регистрации и обработчики команд
 */

import {
  getBot,
  sendMessage,
  sendMessageWithContactButton,
  BOT_MESSAGES,
  validateName,
  validatePhone,
  normalizePhone,
  formatStudentsList,
  formatSchedule,
  createOrganizationsKeyboard,
  type FormattedStudent,
  type FormattedScheduleEvent,
} from '../utils/telegramBot';
import {
  getOrCreateSession,
  updateSession,
  deleteSession,
  type SessionState,
} from '../repositories/telegramSessionRepository';
import {
  createRepresentative,
  getRepresentativeByTelegramChatId,
  updateLastActivity,
  type Representative,
} from '../repositories/representativeRepository';
import {
  getAllOrganizations,
  getOrganizationById,
  searchOrganizations,
  getOrCreateOrganizationByName,
} from '../repositories/organizationRepository';

// ============================================================================
// ТИПЫ
// ============================================================================

interface TelegramMessage {
  message_id: number;
  from?: {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
  };
  chat: {
    id: number;
    type: string;
    title?: string;
    username?: string;
    first_name?: string;
    last_name?: string;
  };
  date: number;
  text?: string;
  contact?: {
    phone_number: string;
    first_name: string;
    last_name?: string;
    user_id?: number;
  };
}

interface TelegramCallbackQuery {
  id: string;
  from: {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
  };
  message?: TelegramMessage;
  chat_instance: string;
  data?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

// ============================================================================
// ОСНОВНОЙ ОБРАБОТЧИК
// ============================================================================

/**
 * Обработать входящее обновление от Telegram
 */
export async function handleUpdate(update: TelegramUpdate): Promise<void> {
  try {
    // Обработка callback query (нажатие inline кнопки)
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
      return;
    }

    // Обработка текстового сообщения
    if (update.message) {
      await handleMessage(update.message);
      return;
    }

    console.log('[TelegramBot] Неизвестный тип обновления:', update);
  } catch (error) {
    console.error('[TelegramBot] Ошибка обработки обновления:', error);
  }
}

/**
 * Обработать текстовое сообщение
 */
async function handleMessage(message: TelegramMessage): Promise<void> {
  const chatId = String(message.chat.id);
  const text = message.text?.trim() || '';
  const username = message.from?.username || null;

  console.log(`[TelegramBot] Сообщение от ${chatId}: ${text}`);

  // Обработка команд
  if (text.startsWith('/')) {
    await handleCommand(chatId, text, username);
    return;
  }

  // Обработка контакта (отправка номера телефона)
  if (message.contact) {
    await handleContactMessage(chatId, message.contact.phone_number, username);
    return;
  }

  // Обработка обычного текста в зависимости от состояния FSM
  await handleTextMessage(chatId, text, username);
}

/**
 * Обработать команду
 */
async function handleCommand(chatId: string, command: string, username: string | null): Promise<void> {
  // Убираем @ и имя бота если есть
  const cleanCommand = command.split('@')[0].toLowerCase();

  switch (cleanCommand) {
    case '/start':
      await commandStart(chatId, username);
      break;
    case '/status':
      await commandStatus(chatId);
      break;
    case '/students':
      await commandStudents(chatId);
      break;
    case '/schedule':
      await commandSchedule(chatId);
      break;
    case '/help':
      await commandHelp(chatId);
      break;
    default:
      await sendMessage(chatId, BOT_MESSAGES.HELP);
  }
}

// ============================================================================
// КОМАНДЫ
// ============================================================================

/**
 * Команда /start - начало работы
 */
async function commandStart(chatId: string, username: string | null): Promise<void> {
  // Проверяем, зарегистрирован ли уже пользователь
  const representative = await getRepresentativeByTelegramChatId(chatId);
  
  if (representative) {
    // Уже зарегистрирован - показываем статус
    await sendMessage(chatId, BOT_MESSAGES.ALREADY_REGISTERED);
    await commandStatus(chatId);
    return;
  }

  // Начинаем регистрацию
  const session = await getOrCreateSession(chatId);
  
  // Отправляем приветствие
  await sendMessage(chatId, BOT_MESSAGES.WELCOME);
  
  // Переводим в состояние ожидания ФИО
  await updateSession(chatId, {
    state: 'awaiting_name',
    data: { username },
  });
  
  await sendMessage(chatId, BOT_MESSAGES.ASK_NAME);
  
  console.log(`[TelegramBot] Начата регистрация для chatId: ${chatId}`);
}

/**
 * Команда /status - статус заявки
 */
async function commandStatus(chatId: string): Promise<void> {
  const representative = await getRepresentativeByTelegramChatId(chatId);
  
  if (!representative) {
    // Проверяем, может быть в процессе регистрации
    const session = await getOrCreateSession(chatId);
    
    if (session.state === 'pending_approval') {
      await sendMessage(chatId, BOT_MESSAGES.STATUS_PENDING);
    } else {
      await sendMessage(chatId, BOT_MESSAGES.ERROR_NOT_REGISTERED);
    }
    return;
  }

  switch (representative.status) {
    case 'pending':
      await sendMessage(chatId, BOT_MESSAGES.STATUS_PENDING);
      break;
    case 'approved':
      await sendMessage(chatId, BOT_MESSAGES.STATUS_APPROVED);
      await updateLastActivity(representative.id);
      break;
    case 'blocked':
      await sendMessage(chatId, BOT_MESSAGES.STATUS_BLOCKED(representative.blockedReason || ''));
      break;
  }
}

/**
 * Команда /students - список слушателей
 */
async function commandStudents(chatId: string): Promise<void> {
  const representative = await getRepresentativeByTelegramChatId(chatId);
  
  if (!representative || representative.status !== 'approved') {
    await sendMessage(chatId, BOT_MESSAGES.ERROR_NO_PERMISSION);
    return;
  }

  try {
    // Получаем студентов организации
    const students = await getStudentsForRepresentative(representative);
    const message = formatStudentsList(students);
    await sendMessage(chatId, message);
    await updateLastActivity(representative.id);
  } catch (error) {
    console.error('[TelegramBot] Ошибка получения студентов:', error);
    await sendMessage(chatId, BOT_MESSAGES.ERROR_GENERAL);
  }
}

/**
 * Команда /schedule - расписание
 */
async function commandSchedule(chatId: string): Promise<void> {
  const representative = await getRepresentativeByTelegramChatId(chatId);
  
  if (!representative || representative.status !== 'approved') {
    await sendMessage(chatId, BOT_MESSAGES.ERROR_NO_PERMISSION);
    return;
  }

  try {
    // Получаем расписание для организации
    const schedule = await getScheduleForRepresentative(representative);
    const message = formatSchedule(schedule);
    await sendMessage(chatId, message);
    await updateLastActivity(representative.id);
  } catch (error) {
    console.error('[TelegramBot] Ошибка получения расписания:', error);
    await sendMessage(chatId, BOT_MESSAGES.ERROR_GENERAL);
  }
}

/**
 * Команда /help - справка
 */
async function commandHelp(chatId: string): Promise<void> {
  await sendMessage(chatId, BOT_MESSAGES.HELP);
}

// ============================================================================
// FSM - ОБРАБОТКА ТЕКСТОВЫХ СООБЩЕНИЙ
// ============================================================================

/**
 * Обработать текстовое сообщение в зависимости от состояния FSM
 */
async function handleTextMessage(chatId: string, text: string, username: string | null): Promise<void> {
  const session = await getOrCreateSession(chatId);
  
  switch (session.state) {
    case 'awaiting_name':
      await handleNameInput(chatId, text, session.data);
      break;
    case 'awaiting_phone':
      await handlePhoneInput(chatId, text, session.data);
      break;
    case 'awaiting_organization':
      await handleOrganizationInput(chatId, text, session.data);
      break;
    case 'pending_approval':
      await sendMessage(chatId, BOT_MESSAGES.STATUS_PENDING);
      break;
    case 'completed':
    case 'idle':
    default:
      // Для зарегистрированных пользователей показываем справку
      await sendMessage(chatId, BOT_MESSAGES.HELP);
  }
}

/**
 * Обработка ввода ФИО
 */
async function handleNameInput(chatId: string, name: string, sessionData: Record<string, any>): Promise<void> {
  if (!validateName(name)) {
    await sendMessage(chatId, BOT_MESSAGES.INVALID_NAME);
    return;
  }

  // Сохраняем ФИО и переходим к следующему шагу
  await updateSession(chatId, {
    state: 'awaiting_phone',
    data: { ...sessionData, fullName: name.trim() },
  });

  // Отправляем сообщение с кнопкой "Отправить контакт"
  await sendMessageWithContactButton(chatId, BOT_MESSAGES.ASK_PHONE);
  
  console.log(`[TelegramBot] chatId ${chatId}: ФИО сохранено - ${name}`);
}

/**
 * Обработка ввода телефона
 */
async function handlePhoneInput(chatId: string, phone: string, sessionData: Record<string, any>): Promise<void> {
  const normalized = normalizePhone(phone);
  
  if (!validatePhone(normalized)) {
    await sendMessage(chatId, BOT_MESSAGES.INVALID_PHONE);
    return;
  }

  // Сохраняем телефон и переходим к выбору организации
  await updateSession(chatId, {
    state: 'awaiting_organization',
    data: { ...sessionData, phone: normalized },
  });

  // Получаем список организаций для выбора
  const organizations = await getAllOrganizations();
  
  if (organizations.length > 0) {
    // Показываем кнопки с организациями (максимум 10)
    const topOrganizations = organizations.slice(0, 10).map(org => ({
      id: org.id,
      name: org.name.length > 30 ? org.name.substring(0, 27) + '...' : org.name,
    }));
    
    const keyboard = createOrganizationsKeyboard(topOrganizations);
    await sendMessage(chatId, BOT_MESSAGES.ASK_ORGANIZATION, { replyMarkup: keyboard });
  } else {
    await sendMessage(chatId, BOT_MESSAGES.ASK_ORGANIZATION);
  }
  
  console.log(`[TelegramBot] chatId ${chatId}: телефон сохранён - ${normalized}`);
}

/**
 * Обработка контакта (кнопка отправки номера)
 */
async function handleContactMessage(chatId: string, phoneNumber: string, username: string | null): Promise<void> {
  const session = await getOrCreateSession(chatId);
  
  if (session.state !== 'awaiting_phone') {
    return;
  }

  const normalized = normalizePhone(phoneNumber);
  await handlePhoneInput(chatId, normalized, session.data);
}

/**
 * Обработка ввода/выбора организации
 */
async function handleOrganizationInput(chatId: string, organizationName: string, sessionData: Record<string, any>): Promise<void> {
  try {
    // Получаем или создаём организацию
    const organization = await getOrCreateOrganizationByName(organizationName);
    
    // Создаём заявку представителя
    await createRepresentativeFromSession(chatId, sessionData, organization.id);
    
    console.log(`[TelegramBot] chatId ${chatId}: организация выбрана - ${organization.name}`);
  } catch (error) {
    console.error('[TelegramBot] Ошибка создания представителя:', error);
    await sendMessage(chatId, BOT_MESSAGES.ERROR_GENERAL);
  }
}

// ============================================================================
// CALLBACK QUERY - INLINE КНОПКИ
// ============================================================================

/**
 * Обработать нажатие inline кнопки
 */
async function handleCallbackQuery(query: TelegramCallbackQuery): Promise<void> {
  const chatId = String(query.from.id);
  const data = query.data || '';

  console.log(`[TelegramBot] Callback от ${chatId}: ${data}`);

  // Отвечаем на callback (убираем loading)
  const bot = getBot();
  if (bot) {
    await bot.api.answerCallbackQuery(query.id);
  }

  // Обработка выбора организации
  if (data.startsWith('org_')) {
    const organizationId = data.substring(4);
    await handleOrganizationSelection(chatId, organizationId);
  }
}

/**
 * Обработка выбора организации из кнопок
 */
async function handleOrganizationSelection(chatId: string, organizationId: string): Promise<void> {
  const session = await getOrCreateSession(chatId);
  
  if (session.state !== 'awaiting_organization') {
    return;
  }

  try {
    const organization = await getOrganizationById(organizationId);
    
    if (!organization) {
      await sendMessage(chatId, BOT_MESSAGES.ERROR_GENERAL);
      return;
    }

    // Создаём заявку представителя
    await createRepresentativeFromSession(chatId, session.data, organization.id);
    
    console.log(`[TelegramBot] chatId ${chatId}: организация выбрана по ID - ${organization.name}`);
  } catch (error) {
    console.error('[TelegramBot] Ошибка при выборе организации:', error);
    await sendMessage(chatId, BOT_MESSAGES.ERROR_GENERAL);
  }
}

/**
 * Создать представителя из данных сессии
 */
async function createRepresentativeFromSession(
  chatId: string,
  sessionData: Record<string, any>,
  organizationId: string
): Promise<void> {
  try {
    // Проверяем, не зарегистрирован ли уже этот chat_id
    const existing = await getRepresentativeByTelegramChatId(chatId);
    if (existing) {
      // Уже зарегистрирован - показываем статус
      await sendMessage(chatId, BOT_MESSAGES.ALREADY_REGISTERED);
      await updateSession(chatId, { state: 'completed', data: {} });
      return;
    }

    // Создаём заявку
    const representative = await createRepresentative({
      organizationId,
      fullName: sessionData.fullName,
      phone: sessionData.phone,
      telegramChatId: chatId,
      telegramUsername: sessionData.username || undefined,
    });

    // Обновляем сессию
    await updateSession(chatId, {
      state: 'pending_approval',
      data: { ...sessionData, representativeId: representative.id },
    });

    // Отправляем подтверждение
    await sendMessage(chatId, BOT_MESSAGES.REGISTRATION_COMPLETE);

    // Логируем действие (без userId, т.к. это действие через бота)
    console.log(`[TelegramBot] Регистрация представителя: ${representative.id}, ФИО: ${representative.fullName}, Организация: ${organizationId}`);

    console.log(`[TelegramBot] Создана заявка представителя: ${representative.id}`);

    // TODO: Отправить уведомление администраторам
    
  } catch (error: any) {
    // Обработка ошибки дубликата
    if (error.code === 'ER_DUP_ENTRY' || error.message?.includes('Duplicate entry')) {
      await sendMessage(chatId, BOT_MESSAGES.ALREADY_REGISTERED);
      await updateSession(chatId, { state: 'completed', data: {} });
      return;
    }
    
    console.error('[TelegramBot] Ошибка создания представителя:', error);
    throw error;
  }
}

// ============================================================================
// ПОЛУЧЕНИЕ ДАННЫХ ДЛЯ ПРЕДСТАВИТЕЛЯ
// ============================================================================

/**
 * Получить студентов организации для представителя
 */
async function getStudentsForRepresentative(representative: Representative): Promise<FormattedStudent[]> {
  // Импортируем executeQuery напрямую для сложного запроса
  const { executeQuery } = await import('../utils/db');
  
  // Сначала получаем название организации по organization_id
  const { getOrganizationById } = await import('../repositories/organizationRepository');
  const organization = await getOrganizationById(representative.organizationId);
  
  if (!organization) {
    return [];
  }

  // Получаем студентов с информацией о группах и курсах
  // students.organization - текстовое поле с названием организации
  // study_groups.code - код группы (например АПАК-20)
  const query = `
    SELECT 
      s.full_name,
      g.code as group_name,
      c.name as course_name,
      g.start_date,
      g.end_date
    FROM students s
    JOIN study_group_students gs ON s.id = gs.student_id
    JOIN study_groups g ON gs.group_id = g.id
    JOIN courses c ON g.course_id = c.id
    WHERE s.organization = ?
      AND g.is_active = true
    ORDER BY g.start_date DESC, s.full_name ASC
  `;

  const rows = await executeQuery<any[]>(query, [organization.name]);

  return rows.map(row => ({
    fullName: row.full_name,
    groupName: row.group_name,
    courseName: row.course_name,
    startDate: formatDateShort(row.start_date),
    endDate: formatDateShort(row.end_date),
  }));
}

/**
 * Получить расписание для организации
 */
async function getScheduleForRepresentative(representative: Representative): Promise<FormattedScheduleEvent[]> {
  const { executeQuery } = await import('../utils/db');
  
  // Получаем название организации
  const { getOrganizationById } = await import('../repositories/organizationRepository');
  const organization = await getOrganizationById(representative.organizationId);
  
  if (!organization) {
    return [];
  }

  // Получаем ближайшие занятия (на неделю вперёд)
  const today = new Date();
  const weekLater = new Date();
  weekLater.setDate(weekLater.getDate() + 7);

  // schedule_events использует start_time/end_time как DATETIME
  const query = `
    SELECT 
      se.start_time,
      se.end_time,
      se.event_type,
      se.title,
      d.name as discipline_name,
      i.full_name as instructor_name,
      c.name as classroom_name,
      g.code as group_name
    FROM schedule_events se
    JOIN study_groups g ON se.group_id = g.id
    LEFT JOIN disciplines d ON se.discipline_id = d.id
    LEFT JOIN instructors i ON se.instructor_id = i.id
    LEFT JOIN classrooms c ON se.classroom_id = c.id
    WHERE g.id IN (
      SELECT DISTINCT gs.group_id 
      FROM study_group_students gs
      JOIN students s ON gs.student_id = s.id
      WHERE s.organization = ?
    )
    AND DATE(se.start_time) BETWEEN ? AND ?
    ORDER BY se.start_time ASC
  `;

  const rows = await executeQuery<any[]>(query, [
    organization.name,
    today.toISOString().split('T')[0],
    weekLater.toISOString().split('T')[0],
  ]);

  return rows.map(row => {
    const startDate = new Date(row.start_time);
    const endDate = new Date(row.end_time);
    
    return {
      date: startDate.toISOString().split('T')[0],
      startTime: startDate.toTimeString().substring(0, 5),
      endTime: endDate.toTimeString().substring(0, 5),
      eventType: row.event_type || 'lesson',
      disciplineName: row.discipline_name || row.title || 'Занятие',
      instructorName: row.instructor_name || 'Не назначен',
      location: row.classroom_name || undefined,
      groupName: row.group_name,
    };
  });
}

/**
 * Форматирование даты в короткий формат
 */
function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Форматирование времени
 */
function formatTimeShort(time: string | Date): string {
  if (time instanceof Date) {
    return time.toTimeString().substring(0, 5);
  }
  return String(time).substring(0, 5);
}

// ============================================================================
// УВЕДОМЛЕНИЯ
// ============================================================================

/**
 * Отправить уведомление об одобрении
 */
export async function notifyRepresentativeApproved(telegramChatId: string): Promise<boolean> {
  return sendMessage(telegramChatId, BOT_MESSAGES.NOTIFICATION_APPROVED);
}

/**
 * Отправить уведомление о блокировке
 */
export async function notifyRepresentativeBlocked(telegramChatId: string, reason: string): Promise<boolean> {
  return sendMessage(telegramChatId, BOT_MESSAGES.NOTIFICATION_BLOCKED(reason));
}

/**
 * Отправить произвольное уведомление представителю
 */
export async function sendNotificationToRepresentative(
  telegramChatId: string,
  message: string
): Promise<boolean> {
  return sendMessage(telegramChatId, message);
}
