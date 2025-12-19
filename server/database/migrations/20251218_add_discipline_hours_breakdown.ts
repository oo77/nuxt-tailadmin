import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: Добавление разбивки часов по видам обучения для дисциплин
 * Дата: 2025-12-18
 * Описание: Добавляет поля theory_hours, practice_hours, assessment_hours
 *           в таблицу disciplines для разделения часов по видам обучения
 */

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Running migration: add_discipline_hours_breakdown');

  // 1. Добавляем новые поля для разбивки часов
  await connection.query(`
    ALTER TABLE disciplines
    ADD COLUMN theory_hours INT NOT NULL DEFAULT 0 COMMENT 'Часы теоретического обучения' AFTER hours,
    ADD COLUMN practice_hours INT NOT NULL DEFAULT 0 COMMENT 'Часы практического обучения' AFTER theory_hours,
    ADD COLUMN assessment_hours INT NOT NULL DEFAULT 0 COMMENT 'Часы проверки знаний' AFTER practice_hours
  `);
  console.log('✅ Added theory_hours, practice_hours, assessment_hours columns');

  // 2. Мигрируем существующие данные: переносим все часы в theory_hours
  await connection.query(`
    UPDATE disciplines
    SET theory_hours = hours,
        practice_hours = 0,
        assessment_hours = 0
    WHERE hours > 0
  `);
  console.log('✅ Migrated existing hours data to theory_hours');

  // 3. Создаем триггер для автоматического обновления поля hours
  // Сначала удаляем триггер если существует
  await connection.query(`DROP TRIGGER IF EXISTS disciplines_calculate_hours_insert`);
  await connection.query(`DROP TRIGGER IF EXISTS disciplines_calculate_hours_update`);

  // Триггер для INSERT
  await connection.query(`
    CREATE TRIGGER disciplines_calculate_hours_insert
    BEFORE INSERT ON disciplines
    FOR EACH ROW
    BEGIN
      SET NEW.hours = NEW.theory_hours + NEW.practice_hours + NEW.assessment_hours;
    END
  `);
  console.log('✅ Created INSERT trigger for automatic hours calculation');

  // Триггер для UPDATE
  await connection.query(`
    CREATE TRIGGER disciplines_calculate_hours_update
    BEFORE UPDATE ON disciplines
    FOR EACH ROW
    BEGIN
      SET NEW.hours = NEW.theory_hours + NEW.practice_hours + NEW.assessment_hours;
    END
  `);
  console.log('✅ Created UPDATE trigger for automatic hours calculation');

  // 4. Добавляем проверочные ограничения
  await connection.query(`
    ALTER TABLE disciplines
    ADD CONSTRAINT chk_theory_hours_positive CHECK (theory_hours >= 0),
    ADD CONSTRAINT chk_practice_hours_positive CHECK (practice_hours >= 0),
    ADD CONSTRAINT chk_assessment_hours_positive CHECK (assessment_hours >= 0),
    ADD CONSTRAINT chk_total_hours_positive CHECK ((theory_hours + practice_hours + assessment_hours) > 0)
  `);
  console.log('✅ Added CHECK constraints for hours validation');
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Rolling back migration: add_discipline_hours_breakdown');

  // 1. Удаляем триггеры
  await connection.query(`DROP TRIGGER IF EXISTS disciplines_calculate_hours_insert`);
  await connection.query(`DROP TRIGGER IF EXISTS disciplines_calculate_hours_update`);
  console.log('✅ Dropped triggers');

  // 2. Удаляем проверочные ограничения
  await connection.query(`
    ALTER TABLE disciplines
    DROP CONSTRAINT IF EXISTS chk_theory_hours_positive,
    DROP CONSTRAINT IF EXISTS chk_practice_hours_positive,
    DROP CONSTRAINT IF EXISTS chk_assessment_hours_positive,
    DROP CONSTRAINT IF EXISTS chk_total_hours_positive
  `);
  console.log('✅ Dropped CHECK constraints');

  // 3. Удаляем добавленные поля
  await connection.query(`
    ALTER TABLE disciplines
    DROP COLUMN theory_hours,
    DROP COLUMN practice_hours,
    DROP COLUMN assessment_hours
  `);
  console.log('✅ Dropped theory_hours, practice_hours, assessment_hours columns');
};

export const description = 'Добавление разбивки часов по видам обучения (Теория, Практика, Проверка Знаний) для дисциплин';
