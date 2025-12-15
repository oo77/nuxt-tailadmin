import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: Создание таблицы пользователей
 * Дата: 2025-12-15
 * Описание: Создает основную таблицу users с ролями и индексами
 */

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Running migration: create_users_table');

  // Создание таблицы users
  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(191) PRIMARY KEY,
      role ENUM('ADMIN', 'MANAGER', 'TEACHER', 'STUDENT') NOT NULL DEFAULT 'STUDENT',
      name VARCHAR(191) NOT NULL,
      email VARCHAR(191) NOT NULL UNIQUE,
      password_hash VARCHAR(191) NOT NULL,
      phone VARCHAR(191),
      workplace VARCHAR(191),
      position VARCHAR(191),
      pinfl VARCHAR(14),
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_email (email),
      INDEX idx_role (role),
      INDEX idx_pinfl (pinfl)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  console.log('✅ Table "users" created successfully');
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Rolling back migration: create_users_table');

  await connection.query('DROP TABLE IF EXISTS users');

  console.log('✅ Table "users" dropped successfully');
};

export const description = 'Создание таблицы пользователей с поддержкой ролей';
