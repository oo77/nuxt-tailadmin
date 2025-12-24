import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: Исправление ENUM для event_type в schedule_events
 * Дата: 2025-12-24
 * Описание: Изменяет значения ENUM event_type на правильные: theory, practice, assessment, other
 */

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Running migration: fix_schedule_event_type_enum');

  // Сначала обновляем существующие значения на временные
  await connection.query(`
    UPDATE schedule_events 
    SET event_type = 'other' 
    WHERE event_type NOT IN ('theory', 'practice', 'assessment', 'other')
  `);
  
  // Изменяем ENUM
  await connection.query(`
    ALTER TABLE schedule_events 
    MODIFY COLUMN event_type ENUM('theory', 'practice', 'assessment', 'other') 
    DEFAULT 'theory' 
    COMMENT 'Тип занятия: theory (теория), practice (практика), assessment (проверка знаний), other (другое)'
  `);
  
  console.log('✅ Fixed event_type ENUM values in schedule_events table');
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Rolling back migration: fix_schedule_event_type_enum');

  // Возвращаем старый ENUM
  await connection.query(`
    ALTER TABLE schedule_events 
    MODIFY COLUMN event_type ENUM('lesson', 'exam', 'consultation', 'other') 
    DEFAULT 'lesson' 
    COMMENT 'Тип события'
  `);
  
  console.log('✅ Reverted event_type ENUM values');
};

export const description = 'Исправление значений ENUM event_type на theory, practice, assessment, other';
