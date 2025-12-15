import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: Создание таблицы курсов
 * Дата: 2025-12-15
 * Описание: Создает таблицу courses для хранения учебных курсов
 * 
 * ВНИМАНИЕ: Это пример миграции!
 * Для применения переименуйте файл, убрав префикс "example_"
 */

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Running migration: create_courses_table');

  // Создание таблицы курсов
  await connection.query(`
    CREATE TABLE IF NOT EXISTS courses (
      id VARCHAR(191) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      teacher_id VARCHAR(191),
      duration_hours INT,
      max_students INT DEFAULT 30,
      status ENUM('DRAFT', 'ACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
      start_date DATE,
      end_date DATE,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_teacher (teacher_id),
      INDEX idx_status (status),
      INDEX idx_dates (start_date, end_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  console.log('✅ Table "courses" created successfully');

  // Создание таблицы для связи студентов и курсов (many-to-many)
  await connection.query(`
    CREATE TABLE IF NOT EXISTS course_enrollments (
      id VARCHAR(191) PRIMARY KEY,
      course_id VARCHAR(191) NOT NULL,
      student_id VARCHAR(191) NOT NULL,
      enrolled_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      completed_at DATETIME(3),
      grade DECIMAL(5,2),
      status ENUM('ENROLLED', 'COMPLETED', 'DROPPED') NOT NULL DEFAULT 'ENROLLED',
      
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY unique_enrollment (course_id, student_id),
      INDEX idx_course (course_id),
      INDEX idx_student (student_id),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  console.log('✅ Table "course_enrollments" created successfully');
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Rolling back migration: create_courses_table');

  // Удаление таблиц в обратном порядке (из-за внешних ключей)
  await connection.query('DROP TABLE IF EXISTS course_enrollments');
  console.log('✅ Table "course_enrollments" dropped');

  await connection.query('DROP TABLE IF EXISTS courses');
  console.log('✅ Table "courses" dropped');
};

export const description = 'Создание таблиц для курсов и записи студентов';
