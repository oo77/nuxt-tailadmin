/**
 * Скрипт для очистки всех папок из БД и storage/uploads
 * Запуск: npx tsx clean-all-folders.ts
 * 
 * ВНИМАНИЕ: Этот скрипт удалит:
 * - Все записи папок из таблицы folders
 * - Все физические папки из storage/uploads (кроме самой папки uploads)
 */

import fs from 'fs/promises';
import path from 'path';
import { executeQuery } from './server/utils/db';

const STORAGE_PATH = path.resolve(process.cwd(), 'storage/uploads');

async function cleanAllFolders() {
  console.log('🗑️  Очистка всех папок из БД и storage/uploads...\n');
  console.log('⚠️  ВНИМАНИЕ: Это действие удалит все папки!\n');

  try {
    // 1. Удаление всех записей из таблицы files
    console.log('📄 Удаление записей файлов из БД...');
    const filesResult = await executeQuery('DELETE FROM files');
    console.log(`✓ Удалено файлов из БД: ${filesResult.affectedRows || 0}\n`);

    // 2. Удаление всех записей из таблицы folders
    console.log('📊 Удаление записей папок из БД...');
    const foldersResult = await executeQuery('DELETE FROM folders');
    console.log(`✓ Удалено папок из БД: ${foldersResult.affectedRows || 0}\n`);

    // 2. Очистка физических папок в storage/uploads
    console.log('📁 Очистка физических папок...');
    
    try {
      // Проверяем существование storage/uploads
      await fs.access(STORAGE_PATH);
      
      // Получаем список всех элементов в storage/uploads
      const items = await fs.readdir(STORAGE_PATH, { withFileTypes: true });
      
      let deletedFolders = 0;
      let deletedFiles = 0;

      for (const item of items) {
        const itemPath = path.join(STORAGE_PATH, item.name);
        
        if (item.isDirectory()) {
          // Удаляем папку рекурсивно
          await fs.rm(itemPath, { recursive: true, force: true });
          deletedFolders++;
          console.log(`  ✓ Удалена папка: ${item.name}`);
        } else {
          // Удаляем файл
          await fs.unlink(itemPath);
          deletedFiles++;
          console.log(`  ✓ Удален файл: ${item.name}`);
        }
      }

      console.log(`\n✓ Удалено папок: ${deletedFolders}`);
      console.log(`✓ Удалено файлов: ${deletedFiles}`);
      
    } catch (error) {
      console.log('⚠️  Папка storage/uploads не найдена или пуста');
    }

    console.log('\n✅ Очистка завершена!');
    console.log('\n📝 Теперь вы можете создать свою структуру папок:');
    console.log('   1. Создайте папки в storage/uploads вручную');
    console.log('   2. Создайте соответствующие записи в БД через платформу');
    console.log('   3. Или используйте миграцию для создания системных папок\n');

  } catch (error) {
    console.error('\n❌ Ошибка очистки:', error);
    process.exit(1);
  }
}

// Запуск
cleanAllFolders();
