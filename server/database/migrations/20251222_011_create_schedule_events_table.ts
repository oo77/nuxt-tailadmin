import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: Создание таблицы для расписания занятий
 * Дата: 2025-12-22
 * Описание: Создает таблицу schedule_events для хранения занятий в календаре
 */

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Running migration: create_schedule_events_table');

  // 1. Создание таблицы аудиторий (если её ещё нет)
  await connection.query(`
    CREATE TABLE IF NOT EXISTS classrooms (
      id VARCHAR(191) PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE COMMENT 'Название аудитории, например "101" или "Конференц-зал"',
      capacity INT DEFAULT 0 COMMENT 'Вместимость аудитории',
      description TEXT COMMENT 'Описание аудитории',
      is_active BOOLEAN DEFAULT true,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_name (name),
      INDEX idx_is_active (is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "classrooms" created successfully');

  // 2. Создание таблицы событий расписания
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schedule_events (
      id VARCHAR(191) PRIMARY KEY,
      title VARCHAR(255) NOT NULL COMMENT 'Название занятия',
      description TEXT COMMENT 'Описание занятия',
      group_id VARCHAR(191) COMMENT 'ID учебной группы',
      discipline_id VARCHAR(191) COMMENT 'ID дисциплины (опционально)',
      instructor_id VARCHAR(191) COMMENT 'ID инструктора',
      classroom_id VARCHAR(191) COMMENT 'ID аудитории',
      start_time DATETIME NOT NULL COMMENT 'Дата и время начала',
      end_time DATETIME NOT NULL COMMENT 'Дата и время окончания',
      is_all_day BOOLEAN DEFAULT false COMMENT 'Событие на весь день',
      color VARCHAR(20) DEFAULT 'primary' COMMENT 'Цвет события: primary, success, warning, danger',
      event_type ENUM('lesson', 'exam', 'consultation', 'other') DEFAULT 'lesson' COMMENT 'Тип события',
      is_recurring BOOLEAN DEFAULT false COMMENT 'Повторяющееся событие',
      recurrence_rule TEXT COMMENT 'Правило повторения (iCal RRULE)',
      notes TEXT COMMENT 'Дополнительные заметки',
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_group_id (group_id),
      INDEX idx_instructor_id (instructor_id),
      INDEX idx_classroom_id (classroom_id),
      INDEX idx_start_time (start_time),
      INDEX idx_end_time (end_time),
      INDEX idx_date_range (start_time, end_time),
      INDEX idx_event_type (event_type),
      
      CONSTRAINT fk_schedule_group 
        FOREIGN KEY (group_id) REFERENCES study_groups(id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_schedule_discipline 
        FOREIGN KEY (discipline_id) REFERENCES disciplines(id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_schedule_instructor 
        FOREIGN KEY (instructor_id) REFERENCES instructors(id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_schedule_classroom 
        FOREIGN KEY (classroom_id) REFERENCES classrooms(id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
        
      CONSTRAINT chk_schedule_dates CHECK (end_time > start_time)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "schedule_events" created successfully');

  // 3. Добавляем тестовые аудитории
  const { v4: uuidv4 } = await import('uuid');
  
  const classrooms = [
    { id: uuidv4(), name: '101', capacity: 30, description: 'Учебная аудитория' },
    { id: uuidv4(), name: '102', capacity: 25, description: 'Учебная аудитория' },
    { id: uuidv4(), name: '201', capacity: 40, description: 'Лекционный зал' },
    { id: uuidv4(), name: '202', capacity: 20, description: 'Компьютерный класс' },
    { id: uuidv4(), name: 'Конференц-зал', capacity: 100, description: 'Большой конференц-зал' },
  ];

  for (const classroom of classrooms) {
    await connection.query(
      `INSERT INTO classrooms (id, name, capacity, description) VALUES (?, ?, ?, ?)`,
      [classroom.id, classroom.name, classroom.capacity, classroom.description]
    );
  }
  console.log('✅ Added 5 test classrooms');
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Rolling back migration: create_schedule_events_table');

  await connection.query('DROP TABLE IF EXISTS schedule_events');
  console.log('✅ Table "schedule_events" dropped');

  await connection.query('DROP TABLE IF EXISTS classrooms');
  console.log('✅ Table "classrooms" dropped');
};

export const description = 'Создание таблиц для расписания: schedule_events, classrooms';
