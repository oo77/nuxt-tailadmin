import type { PoolConnection } from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

/**
 * Миграция: Создание администратора по умолчанию
 * Дата: 2025-12-15
 * Описание: Добавляет первого администратора в систему
 */

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Running migration: seed_admin_user');

  // Проверка существования администратора
  const [existingAdmin] = await connection.query<any[]>(
    'SELECT id FROM users WHERE email = ? LIMIT 1',
    ['admin@atc.uz']
  );

  if (!existingAdmin || existingAdmin.length === 0) {
    // Создание администратора по умолчанию
    const adminPassword = 'admin123'; // Временный пароль
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const adminId = randomUUID();

    await connection.query(
      `INSERT INTO users (id, role, name, email, password_hash, created_at, updated_at) 
       VALUES (?, 'ADMIN', 'Администратор', 'admin@atc.uz', ?, NOW(3), NOW(3))`,
      [adminId, hashedPassword]
    );

    console.log('✅ Default admin user created');
    console.log('📧 Email: admin@atc.uz');
    console.log('🔑 Password: admin123');
    console.log('⚠️  ВАЖНО: Смените пароль после первого входа!');
  } else {
    console.log('ℹ️  Admin user already exists, skipping...');
  }
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Rolling back migration: seed_admin_user');

  await connection.query(
    'DELETE FROM users WHERE email = ?',
    ['admin@atc.uz']
  );

  console.log('✅ Default admin user removed');
};

export const description = 'Создание администратора по умолчанию (admin@atc.uz)';
