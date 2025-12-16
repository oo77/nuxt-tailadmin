import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: Создание таблиц для учебных программ (курсов)
 * Дата: 2025-12-16
 * Описание: Создает таблицы courses, disciplines, instructors, certificate_templates
 *           и связующие таблицы для организации учебного процесса
 */

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Running migration: create_courses_tables');

  // 1. Создание таблицы инструкторов
  await connection.query(`
    CREATE TABLE IF NOT EXISTS instructors (
      id VARCHAR(191) PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      specialization VARCHAR(255),
      bio TEXT,
      photo_url VARCHAR(500),
      is_active BOOLEAN DEFAULT true,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_full_name (full_name),
      INDEX idx_email (email),
      INDEX idx_is_active (is_active),
      FULLTEXT INDEX ft_instructor_search (full_name, specialization)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "instructors" created successfully');

  // 2. Создание таблицы шаблонов сертификатов
  await connection.query(`
    CREATE TABLE IF NOT EXISTS certificate_templates (
      id VARCHAR(191) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      template_file_url VARCHAR(500),
      is_active BOOLEAN DEFAULT true,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_name (name),
      INDEX idx_is_active (is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "certificate_templates" created successfully');

  // 3. Создание таблицы курсов (учебных программ)
  await connection.query(`
    CREATE TABLE IF NOT EXISTS courses (
      id VARCHAR(191) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      short_name VARCHAR(10) NOT NULL COMMENT 'Короткое название из 4-5 заглавных букв',
      code VARCHAR(20) NOT NULL UNIQUE COMMENT 'Код курса, например 2400001',
      description TEXT,
      total_hours INT NOT NULL DEFAULT 0 COMMENT 'Общее количество академических часов',
      certificate_template_id VARCHAR(191),
      is_active BOOLEAN DEFAULT true,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_name (name),
      INDEX idx_short_name (short_name),
      INDEX idx_code (code),
      INDEX idx_is_active (is_active),
      INDEX idx_certificate_template (certificate_template_id),
      FULLTEXT INDEX ft_course_search (name, short_name, description),
      
      CONSTRAINT fk_courses_certificate_template 
        FOREIGN KEY (certificate_template_id) REFERENCES certificate_templates(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "courses" created successfully');

  // 4. Создание таблицы дисциплин
  await connection.query(`
    CREATE TABLE IF NOT EXISTS disciplines (
      id VARCHAR(191) PRIMARY KEY,
      course_id VARCHAR(191) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      hours INT NOT NULL DEFAULT 0 COMMENT 'Количество академических часов',
      order_index INT NOT NULL DEFAULT 0 COMMENT 'Порядок отображения в курсе',
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_course_id (course_id),
      INDEX idx_name (name),
      INDEX idx_order (order_index),
      
      CONSTRAINT fk_disciplines_course 
        FOREIGN KEY (course_id) REFERENCES courses(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "disciplines" created successfully');

  // 5. Создание связующей таблицы дисциплин и инструкторов
  await connection.query(`
    CREATE TABLE IF NOT EXISTS discipline_instructors (
      id VARCHAR(191) PRIMARY KEY,
      discipline_id VARCHAR(191) NOT NULL,
      instructor_id VARCHAR(191) NOT NULL,
      is_primary BOOLEAN DEFAULT false COMMENT 'Основной инструктор дисциплины',
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      
      INDEX idx_discipline_id (discipline_id),
      INDEX idx_instructor_id (instructor_id),
      UNIQUE INDEX idx_discipline_instructor (discipline_id, instructor_id),
      
      CONSTRAINT fk_di_discipline 
        FOREIGN KEY (discipline_id) REFERENCES disciplines(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_di_instructor 
        FOREIGN KEY (instructor_id) REFERENCES instructors(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "discipline_instructors" created successfully');

  // 6. Добавляем тестовые шаблоны сертификатов
  const { v4: uuidv4 } = await import('uuid');
  
  const templates = [
    {
      id: uuidv4(),
      name: 'Стандартный сертификат',
      description: 'Базовый шаблон сертификата о прохождении курса'
    },
    {
      id: uuidv4(),
      name: 'Сертификат с отличием',
      description: 'Шаблон для студентов, окончивших курс с отличием'
    },
    {
      id: uuidv4(),
      name: 'Сертификат повышения квалификации',
      description: 'Официальный шаблон для курсов повышения квалификации'
    }
  ];

  for (const template of templates) {
    await connection.query(
      `INSERT INTO certificate_templates (id, name, description) VALUES (?, ?, ?)`,
      [template.id, template.name, template.description]
    );
  }
  console.log('✅ Added 3 test certificate templates');
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Rolling back migration: create_courses_tables');

  // Удаляем в обратном порядке из-за внешних ключей
  await connection.query('DROP TABLE IF EXISTS discipline_instructors');
  console.log('✅ Table "discipline_instructors" dropped');

  await connection.query('DROP TABLE IF EXISTS disciplines');
  console.log('✅ Table "disciplines" dropped');

  await connection.query('DROP TABLE IF EXISTS courses');
  console.log('✅ Table "courses" dropped');

  await connection.query('DROP TABLE IF EXISTS certificate_templates');
  console.log('✅ Table "certificate_templates" dropped');

  await connection.query('DROP TABLE IF EXISTS instructors');
  console.log('✅ Table "instructors" dropped');
};

export const description = 'Создание таблиц для учебных программ: courses, disciplines, instructors, certificate_templates';
