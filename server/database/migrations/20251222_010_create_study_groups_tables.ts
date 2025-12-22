import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: Создание таблиц для учебных групп
 * Дата: 2025-12-22
 * Описание: Создает таблицы study_groups и study_group_students
 *           для организации групп слушателей по учебным программам
 */

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Running migration: create_study_groups_tables');

  // 1. Создание таблицы учебных групп
  await connection.query(`
    CREATE TABLE IF NOT EXISTS study_groups (
      id VARCHAR(191) PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Уникальный код группы, например АПАК-20',
      course_id VARCHAR(191) NOT NULL COMMENT 'ID учебной программы',
      start_date DATE NOT NULL COMMENT 'Дата начала обучения',
      end_date DATE NOT NULL COMMENT 'Дата окончания обучения',
      classroom VARCHAR(100) COMMENT 'Аудитория',
      description TEXT COMMENT 'Описание группы',
      is_active BOOLEAN DEFAULT true,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_code (code),
      INDEX idx_course_id (course_id),
      INDEX idx_start_date (start_date),
      INDEX idx_end_date (end_date),
      INDEX idx_is_active (is_active),
      INDEX idx_dates (start_date, end_date),
      
      CONSTRAINT fk_study_groups_course 
        FOREIGN KEY (course_id) REFERENCES courses(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
        
      CONSTRAINT chk_dates CHECK (end_date > start_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "study_groups" created successfully');

  // 2. Создание связующей таблицы для слушателей группы
  await connection.query(`
    CREATE TABLE IF NOT EXISTS study_group_students (
      id VARCHAR(191) PRIMARY KEY,
      group_id VARCHAR(191) NOT NULL COMMENT 'ID учебной группы',
      student_id VARCHAR(191) NOT NULL COMMENT 'ID слушателя',
      enrolled_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Дата зачисления в группу',
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      
      INDEX idx_group_id (group_id),
      INDEX idx_student_id (student_id),
      UNIQUE INDEX idx_group_student (group_id, student_id),
      
      CONSTRAINT fk_sgs_group 
        FOREIGN KEY (group_id) REFERENCES study_groups(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_sgs_student 
        FOREIGN KEY (student_id) REFERENCES students(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "study_group_students" created successfully');
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Rolling back migration: create_study_groups_tables');

  // Удаляем в обратном порядке из-за внешних ключей
  await connection.query('DROP TABLE IF EXISTS study_group_students');
  console.log('✅ Table "study_group_students" dropped');

  await connection.query('DROP TABLE IF EXISTS study_groups');
  console.log('✅ Table "study_groups" dropped');
};

export const description = 'Создание таблиц для учебных групп: study_groups, study_group_students';
