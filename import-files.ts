/**
 * Скрипт для импорта физических файлов из storage/uploads в БД
 * Запуск: npx tsx import-files.ts
 * 
 * Сканирует storage/uploads и создает записи в БД для всех найденных файлов
 */

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createFile } from './server/repositories/fileRepository';
import { getFolderByPath } from './server/repositories/folderRepository';
import { getFileExtension } from './server/utils/storage/fileUtils';

const STORAGE_PATH = path.resolve(process.cwd(), 'storage/uploads');

// Определение MIME типа по расширению
function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    // Изображения
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    
    // Документы
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.document',
    
    // Текст
    'txt': 'text/plain',
    'csv': 'text/csv',
    
    // Архивы
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    
    // Видео
    'mp4': 'video/mp4',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    
    // Аудио
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
  };
  
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}

// Определение категории по пути папки
function getCategoryByPath(folderPath: string): string {
  if (folderPath.includes('Сертификат')) return 'certificate_generated';
  if (folderPath.includes('Курс')) return 'course_material';
  if (folderPath.includes('Профил')) return 'profile';
  if (folderPath.includes('Групп')) return 'group_file';
  return 'other';
}

async function importFiles() {
  console.log('📥 Импорт физических файлов в БД...\n');

  let importedCount = 0;
  let skippedCount = 0;

  try {
    // Рекурсивная функция для сканирования файлов
    async function scanDirectory(dirPath: string, relativePath: string = ''): Promise<void> {
      const items = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item.name);
        const itemRelativePath = relativePath ? `${relativePath}/${item.name}` : item.name;
        
        if (item.isDirectory()) {
          // Рекурсивно сканируем подпапки
          await scanDirectory(itemPath, itemRelativePath);
        } else if (item.isFile()) {
          // Обрабатываем файл
          try {
            // Получаем информацию о файле
            const stats = await fs.stat(itemPath);
            const extension = getFileExtension(item.name);
            const mimeType = getMimeType(extension);
            
            // Определяем папку в БД
            const folderPath = relativePath ? `/${relativePath.replace(/\\/g, '/')}` : '/';
            const folder = await getFolderByPath(folderPath);
            
            if (!folder) {
              console.log(`  ⚠️  Папка не найдена в БД: ${folderPath} (пропускаю ${item.name})`);
              skippedCount++;
              continue;
            }
            
            // Создаем запись в БД
            const uuid = uuidv4();
            const storagePath = itemRelativePath.substring(0, itemRelativePath.lastIndexOf('/')) || '';
            const category = getCategoryByPath(folderPath);
            
            await createFile({
              uuid,
              filename: item.name,
              storedName: item.name,
              mimeType,
              sizeBytes: stats.size,
              extension,
              storagePath,
              fullPath: itemPath,
              category: category as any,
              folderId: folder.id,
              uploadedBy: 1, // ID администратора, можно изменить
            });
            
            importedCount++;
            console.log(`  ✓ Импортирован: ${itemRelativePath} (${(stats.size / 1024).toFixed(2)} KB)`);
            
          } catch (error) {
            console.error(`  ❌ Ошибка импорта ${item.name}:`, error);
            skippedCount++;
          }
        }
      }
    }

    // Проверяем существование storage/uploads
    try {
      await fs.access(STORAGE_PATH);
    } catch {
      console.log('⚠️  Папка storage/uploads не найдена');
      return;
    }

    // Начинаем сканирование
    await scanDirectory(STORAGE_PATH);

    console.log('\n✅ Импорт завершен!');
    console.log(`   Импортировано файлов: ${importedCount}`);
    console.log(`   Пропущено: ${skippedCount}`);
    console.log('\n📝 Теперь все файлы видны в файловом менеджере');

  } catch (error) {
    console.error('\n❌ Ошибка импорта:', error);
    process.exit(1);
  }
}

// Запуск
importFiles();
