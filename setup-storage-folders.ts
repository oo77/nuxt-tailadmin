/**
 * Скрипт для создания системных папок
 * Запуск: npx tsx setup-storage-folders.ts
 */

import { createFolder, getFolderByPath } from './server/repositories/folderRepository';

const SYSTEM_FOLDERS = [
  'Сертификаты',
  'Курсы',
  'Документы',
  'Профили',
  'Группы',
];

async function setupFolders() {
  console.log('📁 Создание системных папок...\n');

  let created = 0;
  let existing = 0;

  for (const folderName of SYSTEM_FOLDERS) {
    try {
      const path = `/${folderName}`;
      const existingFolder = await getFolderByPath(path);

      if (existingFolder) {
        console.log(`  ⏭️  Папка "${folderName}" уже существует`);
        existing++;
      } else {
        await createFolder({
          name: folderName,
          parentId: null,
          isSystem: false,
        });
        console.log(`  ✅ Создана папка "${folderName}"`);
        created++;
      }
    } catch (error) {
      console.error(`  ❌ Ошибка создания папки "${folderName}":`, error);
    }
  }

  console.log(`\n📊 Итого:`);
  console.log(`   Создано: ${created}`);
  console.log(`   Уже существовало: ${existing}`);
  console.log('\n✅ Готово!');
}

// Запуск
setupFolders();
