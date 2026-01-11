import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: Расширение study_groups для системы анонсов
 * Дата: 2026-01-11
 * Описание: Добавляем поля для анонсирования групп представителям организаций:
 *   - announcement_status: статус анонса (draft/announced/closed)
 *   - max_capacity: максимальное количество слушателей
 *   - current_reserved: забронированные места через заявки
 *   - is_visible_to_representatives: видимость для представителей
 *   - accepts_requests: принимает ли заявки
 *   - request_deadline: крайний срок подачи заявок
 *   - announcement_text: текст анонса для представителей
 */

export const description = 'Расширение study_groups для системы анонсов и заявок';

export const up = async (connection: PoolConnection): Promise<void> => {
    console.log('🔄 Running migration: 041_group_announcements');

    // Добавляем статус анонса
    await connection.query(`
    ALTER TABLE study_groups 
    ADD COLUMN announcement_status ENUM('draft', 'announced', 'closed') NOT NULL DEFAULT 'draft'
    COMMENT 'Статус анонса: черновик, анонсирован, закрыт для заявок'
  `);
    console.log('  ✓ Added column: announcement_status');

    // Максимальное количество слушателей
    await connection.query(`
    ALTER TABLE study_groups 
    ADD COLUMN max_capacity INT DEFAULT NULL
    COMMENT 'Максимальное количество слушателей (hard limit)'
  `);
    console.log('  ✓ Added column: max_capacity');

    // Забронированные места (через заявки со статусом reserved)
    await connection.query(`
    ALTER TABLE study_groups 
    ADD COLUMN current_reserved INT NOT NULL DEFAULT 0
    COMMENT 'Количество забронированных мест через заявки'
  `);
    console.log('  ✓ Added column: current_reserved');

    // Видимость для представителей
    await connection.query(`
    ALTER TABLE study_groups 
    ADD COLUMN is_visible_to_representatives BOOLEAN DEFAULT FALSE
    COMMENT 'Показывать представителям организаций'
  `);
    console.log('  ✓ Added column: is_visible_to_representatives');

    // Принимает ли заявки
    await connection.query(`
    ALTER TABLE study_groups 
    ADD COLUMN accepts_requests BOOLEAN DEFAULT FALSE
    COMMENT 'Принимает заявки от представителей'
  `);
    console.log('  ✓ Added column: accepts_requests');

    // Крайний срок подачи заявок
    await connection.query(`
    ALTER TABLE study_groups 
    ADD COLUMN request_deadline DATE DEFAULT NULL
    COMMENT 'Крайний срок подачи заявок'
  `);
    console.log('  ✓ Added column: request_deadline');

    // Текст анонса для представителей
    await connection.query(`
    ALTER TABLE study_groups 
    ADD COLUMN announcement_text TEXT DEFAULT NULL
    COMMENT 'Текст анонса для представителей'
  `);
    console.log('  ✓ Added column: announcement_text');

    // Индексы для быстрого поиска анонсов
    await connection.query(`
    CREATE INDEX idx_announcement_status ON study_groups(announcement_status)
  `);
    console.log('  ✓ Created index: idx_announcement_status');

    await connection.query(`
    CREATE INDEX idx_visible_to_representatives ON study_groups(is_visible_to_representatives)
  `);
    console.log('  ✓ Created index: idx_visible_to_representatives');

    await connection.query(`
    CREATE INDEX idx_accepts_requests ON study_groups(accepts_requests)
  `);
    console.log('  ✓ Created index: idx_accepts_requests');

    // Составной индекс для быстрого поиска доступных групп
    await connection.query(`
    CREATE INDEX idx_groups_available_for_requests 
    ON study_groups(announcement_status, is_visible_to_representatives, accepts_requests)
  `);
    console.log('  ✓ Created index: idx_groups_available_for_requests');

    console.log('✅ Migration 041_group_announcements completed successfully');
};

export const down = async (connection: PoolConnection): Promise<void> => {
    console.log('🔄 Rolling back migration: 041_group_announcements');

    // Удаляем индексы
    await connection.query(`DROP INDEX idx_groups_available_for_requests ON study_groups`);
    await connection.query(`DROP INDEX idx_accepts_requests ON study_groups`);
    await connection.query(`DROP INDEX idx_visible_to_representatives ON study_groups`);
    await connection.query(`DROP INDEX idx_announcement_status ON study_groups`);
    console.log('  ✓ Dropped indexes');

    // Удаляем колонки
    await connection.query(`ALTER TABLE study_groups DROP COLUMN announcement_text`);
    await connection.query(`ALTER TABLE study_groups DROP COLUMN request_deadline`);
    await connection.query(`ALTER TABLE study_groups DROP COLUMN accepts_requests`);
    await connection.query(`ALTER TABLE study_groups DROP COLUMN is_visible_to_representatives`);
    await connection.query(`ALTER TABLE study_groups DROP COLUMN current_reserved`);
    await connection.query(`ALTER TABLE study_groups DROP COLUMN max_capacity`);
    await connection.query(`ALTER TABLE study_groups DROP COLUMN announcement_status`);
    console.log('  ✓ Dropped columns');

    console.log('✅ Rollback 041_group_announcements completed successfully');
};
