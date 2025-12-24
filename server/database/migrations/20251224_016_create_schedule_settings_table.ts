/**
 * Миграция: Создание таблицы настроек расписания
 * Дата создания: 2024-12-24
 * Описание: Таблица для хранения академических часов и перерывов расписания
 */

import type { Connection } from 'mysql2/promise';

export const description = 'Создание таблиц настроек расписания (академические пары)';

interface MigrationContext {
  connection: Connection;
}

export const up = async ({ connection }: MigrationContext): Promise<void> => {
  // Таблица академических пар (настройки времени)
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS schedule_periods (
      id INT PRIMARY KEY AUTO_INCREMENT,
      period_number INT NOT NULL COMMENT 'Номер пары (1-12)',
      start_time VARCHAR(5) NOT NULL COMMENT 'Время начала (HH:MM)',
      end_time VARCHAR(5) NOT NULL COMMENT 'Время окончания (HH:MM)',
      is_after_break BOOLEAN DEFAULT FALSE COMMENT 'Следует ли после большого перерыва',
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_period_number (period_number)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Таблица общих настроек расписания
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS schedule_settings (
      id INT PRIMARY KEY AUTO_INCREMENT,
      setting_key VARCHAR(100) NOT NULL UNIQUE,
      setting_value TEXT NOT NULL,
      description VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Добавляем стандартные академические пары
  await connection.execute(`
    INSERT INTO schedule_periods (period_number, start_time, end_time, is_after_break) VALUES
    (1, '09:00', '09:40', FALSE),
    (2, '09:40', '10:20', FALSE),
    (3, '10:30', '11:10', FALSE),
    (4, '11:10', '11:50', FALSE),
    (5, '12:00', '12:40', FALSE),
    (6, '12:40', '13:20', FALSE),
    (7, '14:00', '14:40', TRUE),
    (8, '14:40', '15:20', FALSE),
    (9, '15:30', '16:10', FALSE),
    (10, '16:10', '16:50', FALSE),
    (11, '17:00', '17:40', FALSE),
    (12, '17:40', '18:20', FALSE)
  `);

  // Добавляем стандартные настройки
  await connection.execute(`
    INSERT INTO schedule_settings (setting_key, setting_value, description) VALUES
    ('lunch_break_start', '13:20', 'Начало большого перерыва'),
    ('lunch_break_end', '14:00', 'Конец большого перерыва'),
    ('period_duration_minutes', '40', 'Длительность одного академического часа в минутах'),
    ('short_break_minutes', '10', 'Длительность короткого перерыва в минутах'),
    ('snap_to_periods', 'true', 'Привязка событий к академическим часам'),
    ('show_period_numbers', 'true', 'Показывать номера пар в календаре')
  `);

  console.log('✅ Таблицы schedule_periods и schedule_settings созданы');
};

export const down = async ({ connection }: MigrationContext): Promise<void> => {
  await connection.execute('DROP TABLE IF EXISTS schedule_periods');
  await connection.execute('DROP TABLE IF EXISTS schedule_settings');
  console.log('✅ Таблицы schedule_periods и schedule_settings удалены');
};
