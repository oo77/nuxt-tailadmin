import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: Обновление таблицы инструкторов
 * Дата: 2025-12-17
 * Описание: Изменяет структуру таблицы instructors для соответствия требованиям:
 *           - ФИО (full_name)
 *           - Номер телефона (phone)
 *           - Почта (email)
 *           - Прием на работу (hire_date)
 *           - Данные о трудовом договоре (contract_info)
 *           - Максимальные часы (max_hours)
 */

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Running migration: update_instructors_table');

  // Удаляем старые поля, которые больше не нужны
  await connection.query(`
    ALTER TABLE instructors
    DROP COLUMN IF EXISTS specialization,
    DROP COLUMN IF EXISTS bio,
    DROP COLUMN IF EXISTS photo_url
  `);
  console.log('✅ Removed old columns: specialization, bio, photo_url');

  // Добавляем новые поля
  await connection.query(`
    ALTER TABLE instructors
    ADD COLUMN IF NOT EXISTS hire_date DATE COMMENT 'Дата приема на работу',
    ADD COLUMN IF NOT EXISTS contract_info TEXT COMMENT 'Данные о трудовом договоре',
    ADD COLUMN IF NOT EXISTS max_hours INT DEFAULT 0 COMMENT 'Максимальные часы для отчетности'
  `);
  console.log('✅ Added new columns: hire_date, contract_info, max_hours');

  // Обновляем индексы
  await connection.query(`
    ALTER TABLE instructors
    DROP INDEX IF EXISTS ft_instructor_search
  `);
  
  await connection.query(`
    ALTER TABLE instructors
    ADD FULLTEXT INDEX ft_instructor_search (full_name)
  `);
  console.log('✅ Updated fulltext search index');
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Rolling back migration: update_instructors_table');

  // Удаляем новые поля
  await connection.query(`
    ALTER TABLE instructors
    DROP COLUMN IF EXISTS hire_date,
    DROP COLUMN IF EXISTS contract_info,
    DROP COLUMN IF EXISTS max_hours
  `);
  console.log('✅ Removed columns: hire_date, contract_info, max_hours');

  // Возвращаем старые поля
  await connection.query(`
    ALTER TABLE instructors
    ADD COLUMN IF NOT EXISTS specialization VARCHAR(255),
    ADD COLUMN IF NOT EXISTS bio TEXT,
    ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500)
  `);
  console.log('✅ Restored old columns: specialization, bio, photo_url');

  // Восстанавливаем старый индекс
  await connection.query(`
    ALTER TABLE instructors
    DROP INDEX IF EXISTS ft_instructor_search
  `);
  
  await connection.query(`
    ALTER TABLE instructors
    ADD FULLTEXT INDEX ft_instructor_search (full_name, specialization)
  `);
  console.log('✅ Restored old fulltext search index');
};

export const description = 'Обновление структуры таблицы instructors: добавление hire_date, contract_info, max_hours';
