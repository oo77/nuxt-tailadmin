/**
 * Скрипт для импорта физических папок из storage/uploads в БД
 * Запуск: npx tsx import-folders.ts
 * 
 * Сканирует storage/uploads и создает записи в БД для всех найденных папок
 */

import fs from 'fs/promises';
import path from 'path';
import { createFolder, getFolderByPath } from './server/repositories/folderRepository';

const STORAGE_PATH = path.resolve(process.cwd(), 'storage/uploads');

async function importFolders() {
  console.log('📥 Импорт физических папок в БД...\n');

  try {
    // Рекурсивная функция для сканирования папок
    async function scanDirectory(dirPath: string, parentId: number | null = null, parentPath: string = ''): Promise<void> {
      const items = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const item of items) {
        if (item.isDirectory()) {
          const folderPath = parentPath ? `${parentPath}/${item.name}` : `/${item.name}`;
          
          // Проверяем, существует ли уже папка в БД
          const existing = await getFolderByPath(folderPath);
          
          if (!existing) {
            // Создаем запись в БД
            const folder = await createFolder({
              name: item.name,
              parentId: parentId,
              isSystem: false,
            });
            
            console.log(`  ✓ Импортирована: ${folderPath}`);
            
            // Рекурсивно сканируем подпапки
            const subDirPath = path.join(dirPath, item.name);
            await scanDirectory(subDirPath, folder.id, folderPath);
          } else {
            console.log(`  - Уже существует: ${folderPath}`);
            
            // Все равно сканируем подпапки
            const subDirPath = path.join(dirPath, item.name);
            await scanDirectory(subDirPath, existing.id, folderPath);
          }
        }
      }
    }

    // Проверяем существование storage/uploads
    try {
      await fs.access(STORAGE_PATH);
    } catch {
      console.log('⚠️  Папка storage/uploads не найдена. Создаю...');
      await fs.mkdir(STORAGE_PATH, { recursive: true });
      console.log('✓ Папка storage/uploads создана\n');
    }

    // Начинаем сканирование с корневой папки
    await scanDirectory(STORAGE_PATH);

    console.log('\n✅ Импорт завершен!');
    console.log('\n📝 Теперь все физические папки видны в файловом менеджере');

  } catch (error) {
    console.error('\n❌ Ошибка импорта:', error);
    process.exit(1);
  }
}

// Запуск
importFolders();
