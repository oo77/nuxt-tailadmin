import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: Удаление полей анонсов из study_groups
 * 
 * ⚠️ ВНИМАНИЕ: Эта миграция должна применяться ПОСЛЕДНЕЙ,
 * после полного внедрения новой системы объявлений!
 * 
 * Удаляет старые поля, связанные с анонсами, которые теперь
 * перенесены в отдельные таблицы announcements и связанные.
 */

export const description = 'Удаление устаревших полей анонсов из study_groups';

export const up = async (connection: PoolConnection): Promise<void> => {
    console.log('🔄 Running migration: 056_remove_group_announcement_fields');
    console.log('⚠️  Removing old announcement fields from study_groups');

    // Удаляем индексы
    try {
        await connection.query(`DROP INDEX idx_groups_available_for_requests ON study_groups`);
        console.log('  ✓ Dropped index: idx_groups_available_for_requests');
    } catch (error) {
        console.log('  ⚠️  Index idx_groups_available_for_requests not found (already removed)');
    }

    try {
        await connection.query(`DROP INDEX idx_accepts_requests ON study_groups`);
        console.log('  ✓ Dropped index: idx_accepts_requests');
    } catch (error) {
        console.log('  ⚠️  Index idx_accepts_requests not found (already removed)');
    }

    try {
        await connection.query(`DROP INDEX idx_visible_to_representatives ON study_groups`);
        console.log('  ✓ Dropped index: idx_visible_to_representatives');
    } catch (error) {
        console.log('  ⚠️  Index idx_visible_to_representatives not found (already removed)');
    }

    try {
        await connection.query(`DROP INDEX idx_announcement_status ON study_groups`);
        console.log('  ✓ Dropped index: idx_announcement_status');
    } catch (error) {
        console.log('  ⚠️  Index idx_announcement_status not found (already removed)');
    }

    // Удаляем колонки
    const columnsToRemove = [
        'announcement_text',
        'request_deadline',
        'accepts_requests',
        'is_visible_to_representatives',
        'current_reserved',
        'max_capacity',
        'announcement_status'
    ];

    for (const column of columnsToRemove) {
        try {
            await connection.query(`ALTER TABLE study_groups DROP COLUMN ${column}`);
            console.log(`  ✓ Dropped column: ${column}`);
        } catch (error) {
            console.log(`  ⚠️  Column ${column} not found (already removed)`);
        }
    }

    console.log('✅ Migration 056_remove_group_announcement_fields completed successfully');
    console.log('📝 Old announcement fields removed. New announcement system is now active.');
};

export const down = async (connection: PoolConnection): Promise<void> => {
    console.log('🔄 Rolling back migration: 056_remove_group_announcement_fields');
    console.log('⚠️  Restoring old announcement fields to study_groups');

    // Восстанавливаем колонки в обратном порядке
    await connection.query(`
    ALTER TABLE study_groups 
    ADD COLUMN announcement_status ENUM('draft', 'announced', 'closed') NOT NULL DEFAULT 'draft'
    COMMENT 'Статус анонса: черновик, анонсирован, закрыт для заявок'
  `);
    console.log('  ✓ Restored column: announcement_status');

    await connection.query(`
    ALTER TABLE study_groups 
    ADD COLUMN max_capacity INT DEFAULT NULL
    COMMENT 'Максимальное количество слушателей (hard limit)'
  `);
    console.log('  ✓ Restored column: max_capacity');

    await connection.query(`
    ALTER TABLE study_groups 
    ADD COLUMN current_reserved INT NOT NULL DEFAULT 0
    COMMENT 'Количество забронированных мест через заявки'
  `);
    console.log('  ✓ Restored column: current_reserved');

    await connection.query(`
    ALTER TABLE study_groups 
    ADD COLUMN is_visible_to_representatives BOOLEAN DEFAULT FALSE
    COMMENT 'Показывать представителям организаций'
  `);
    console.log('  ✓ Restored column: is_visible_to_representatives');

    await connection.query(`
    ALTER TABLE study_groups 
    ADD COLUMN accepts_requests BOOLEAN DEFAULT FALSE
    COMMENT 'Принимает заявки от представителей'
  `);
    console.log('  ✓ Restored column: accepts_requests');

    await connection.query(`
    ALTER TABLE study_groups 
    ADD COLUMN request_deadline DATE DEFAULT NULL
    COMMENT 'Крайний срок подачи заявок'
  `);
    console.log('  ✓ Restored column: request_deadline');

    await connection.query(`
    ALTER TABLE study_groups 
    ADD COLUMN announcement_text TEXT DEFAULT NULL
    COMMENT 'Текст анонса для представителей'
  `);
    console.log('  ✓ Restored column: announcement_text');

    // Восстанавливаем индексы
    await connection.query(`
    CREATE INDEX idx_announcement_status ON study_groups(announcement_status)
  `);
    console.log('  ✓ Restored index: idx_announcement_status');

    await connection.query(`
    CREATE INDEX idx_visible_to_representatives ON study_groups(is_visible_to_representatives)
  `);
    console.log('  ✓ Restored index: idx_visible_to_representatives');

    await connection.query(`
    CREATE INDEX idx_accepts_requests ON study_groups(accepts_requests)
  `);
    console.log('  ✓ Restored index: idx_accepts_requests');

    await connection.query(`
    CREATE INDEX idx_groups_available_for_requests 
    ON study_groups(announcement_status, is_visible_to_representatives, accepts_requests)
  `);
    console.log('  ✓ Restored index: idx_groups_available_for_requests');

    console.log('✅ Rollback 056_remove_group_announcement_fields completed successfully');
};
