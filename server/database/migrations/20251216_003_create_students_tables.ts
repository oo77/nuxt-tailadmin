import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: Создание таблиц для студентов и сертификатов
 * Дата: 2025-12-16
 * Описание: Создает таблицы students и certificates с связью через внешний ключ
 */

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Running migration: create_students_tables');

  // Создание таблицы students
  await connection.query(`
    CREATE TABLE IF NOT EXISTS students (
      id VARCHAR(191) PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      pinfl VARCHAR(14) NOT NULL UNIQUE,
      organization VARCHAR(255) NOT NULL,
      department VARCHAR(255),
      position VARCHAR(255) NOT NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_pinfl (pinfl),
      INDEX idx_full_name (full_name),
      INDEX idx_organization (organization),
      INDEX idx_position (position),
      FULLTEXT INDEX ft_search (full_name, organization, position)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  console.log('✅ Table "students" created successfully');

  // Создание таблицы certificates
  await connection.query(`
    CREATE TABLE IF NOT EXISTS certificates (
      id VARCHAR(191) PRIMARY KEY,
      student_id VARCHAR(191) NOT NULL,
      course_name VARCHAR(255) NOT NULL,
      issue_date DATE NOT NULL,
      certificate_number VARCHAR(100) NOT NULL,
      file_url VARCHAR(500),
      expiry_date DATE,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_student_id (student_id),
      INDEX idx_certificate_number (certificate_number),
      INDEX idx_issue_date (issue_date),
      INDEX idx_expiry_date (expiry_date),
      
      CONSTRAINT fk_certificates_student 
        FOREIGN KEY (student_id) REFERENCES students(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  console.log('✅ Table "certificates" created successfully');
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Rolling back migration: create_students_tables');

  // Удаляем сначала certificates из-за внешнего ключа
  await connection.query('DROP TABLE IF EXISTS certificates');
  console.log('✅ Table "certificates" dropped');

  await connection.query('DROP TABLE IF EXISTS students');
  console.log('✅ Table "students" dropped');
};

export const description = 'Создание таблиц students и certificates с индексами и связями';
