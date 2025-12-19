/**
 * Скрипт для добавления поля password_hash в таблицу folders
 * Запуск: npx tsx add-password-field.ts
 */

import { executeQuery } from './server/utils/db';

async function addPasswordField() {
  console.log('Добавление поля password_hash в таблицу folders...\n');

  try {
    // Проверяем, существует ли уже поле
    const checkQuery = `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'folders' 
        AND COLUMN_NAME = 'password_hash'
    `;
    
    const existing = await executeQuery(checkQuery);
    
    if (existing.length > 0) {
      console.log('⚠️  Поле password_hash уже существует в таблице folders');
      return;
    }

    // Добавляем поле
    const alterQuery = `
      ALTER TABLE folders 
      ADD COLUMN password_hash VARCHAR(255) NULL COMMENT 'Хеш пароля для защиты папки'
    `;
    
    await executeQuery(alterQuery);
    
    console.log('✅ Поле password_hash успешно добавлено в таблицу folders');
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

// Запуск
addPasswordField();
