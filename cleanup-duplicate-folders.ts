/**
 * Скрипт для удаления дубликатов папок
 * Запуск: npx tsx cleanup-duplicate-folders.ts
 */

import { executeQuery } from './server/utils/db';

async function cleanupDuplicateFolders() {
  console.log('🧹 Поиск и удаление дубликатов папок...\n');

  try {
    // Находим дубликаты по path
    const duplicatesQuery = `
      SELECT path, COUNT(*) as count, GROUP_CONCAT(id ORDER BY id) as ids
      FROM folders
      WHERE deleted_at IS NULL
      GROUP BY path
      HAVING COUNT(*) > 1
    `;
    
    const duplicates = await executeQuery(duplicatesQuery);
    
    if (duplicates.length === 0) {
      console.log('✅ Дубликаты не найдены!');
      return;
    }

    console.log(`Найдено ${duplicates.length} путей с дубликатами:\n`);

    let totalDeleted = 0;

    for (const dup of duplicates) {
      console.log(`  📁 "${dup.path}" - ${dup.count} записей (IDs: ${dup.ids})`);
      
      // Оставляем первый ID, удаляем остальные
      const ids = dup.ids.split(',').map((id: string) => parseInt(id));
      const keepId = ids[0];
      const deleteIds = ids.slice(1);

      if (deleteIds.length > 0) {
        // Мягкое удаление
        await executeQuery(
          `UPDATE folders SET deleted_at = NOW() WHERE id IN (${deleteIds.join(',')})`,
        );
        console.log(`     ✅ Удалено ${deleteIds.length} дубликатов, оставлен ID: ${keepId}`);
        totalDeleted += deleteIds.length;
      }
    }

    console.log(`\n📊 Итого удалено дубликатов: ${totalDeleted}`);
    console.log('✅ Готово!');
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

// Запуск
cleanupDuplicateFolders();
