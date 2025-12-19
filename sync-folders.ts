/**
 * Скрипт для синхронизации папок из БД с физическими папками в storage/uploads
 * Запуск: npx tsx sync-folders.ts
 */

import fs from 'fs/promises';
import path from 'path';
import { getRootFolders, getSubFolders } from './server/repositories/folderRepository';
import type { Folder } from './server/repositories/folderRepository';

const STORAGE_PATH = path.resolve(process.cwd(), 'storage/uploads');

async function syncFolders() {
  console.log('🔄 Синхронизация папок из БД с физическими папками...\n');

  try {
    // Получаем все папки из БД (рекурсивно)
    const allFolders: Folder[] = [];
    
    async function collectFolders(parentId: number | null = null) {
      const folders = await getSubFolders(parentId);
      for (const folder of folders) {
        allFolders.push(folder);
        // Рекурсивно получаем подпапки
        await collectFolders(folder.id);
      }
    }

    await collectFolders(null);

    console.log(`📁 Найдено папок в БД: ${allFolders.length}\n`);

    // Создаем физические папки для каждой папки из БД
    let created = 0;
    let existing = 0;

    for (const folder of allFolders) {
      const relativePath = folder.path.startsWith('/') ? folder.path.substring(1) : folder.path;
      const physicalPath = path.join(STORAGE_PATH, relativePath);

      try {
        await fs.access(physicalPath);
        existing++;
        console.log(`  ✓ ${folder.path} - существует`);
      } catch {
        await fs.mkdir(physicalPath, { recursive: true });
        created++;
        console.log(`  ✓ ${folder.path} - создана`);
      }
    }

    console.log('\n✅ Синхронизация завершена!');
    console.log(`   Создано новых папок: ${created}`);
    console.log(`   Уже существовало: ${existing}`);
    console.log(`   Всего папок: ${allFolders.length}`);

  } catch (error) {
    console.error('\n❌ Ошибка синхронизации:', error);
    process.exit(1);
  }
}

// Запуск
syncFolders();
