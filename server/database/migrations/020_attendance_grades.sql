-- ============================================================
-- Миграция 020: Посещаемость и оценки
-- Дата: 2025-12-25
-- ============================================================

-- ============================================================
-- 1. ATTENDANCE - Посещаемость занятий
-- ============================================================
-- Хранит количество посещённых академических часов за занятие
-- Например: занятие 3 а-ч, студент опоздал на 30 мин = 2.5 а-ч

CREATE TABLE IF NOT EXISTS attendance (
  id VARCHAR(191) PRIMARY KEY,
  student_id VARCHAR(191) NOT NULL COMMENT 'ID слушателя',
  schedule_event_id VARCHAR(191) NOT NULL COMMENT 'ID занятия из расписания',
  hours_attended DECIMAL(3,1) NOT NULL DEFAULT 0 COMMENT 'Посещённые академические часы',
  max_hours DECIMAL(3,1) NOT NULL COMMENT 'Максимальные часы занятия (для расчёта %)',
  notes TEXT COMMENT 'Примечания (причина отсутствия и т.д.)',
  marked_by VARCHAR(191) COMMENT 'Кто отметил',
  marked_at DATETIME(3) COMMENT 'Когда отметил',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  
  UNIQUE INDEX idx_student_event (student_id, schedule_event_id),
  INDEX idx_schedule_event_id (schedule_event_id),
  INDEX idx_marked_by (marked_by),
  
  CONSTRAINT fk_attendance_student 
    FOREIGN KEY (student_id) REFERENCES students(id) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_attendance_event 
    FOREIGN KEY (schedule_event_id) REFERENCES schedule_events(id) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_attendance_marked_by 
    FOREIGN KEY (marked_by) REFERENCES users(id) 
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_hours_attended CHECK (hours_attended >= 0 AND hours_attended <= max_hours),
  CONSTRAINT chk_max_hours CHECK (max_hours > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. GRADES - Оценки за проверку знаний
-- ============================================================
-- 100-балльная шкала для assessment занятий

CREATE TABLE IF NOT EXISTS grades (
  id VARCHAR(191) PRIMARY KEY,
  student_id VARCHAR(191) NOT NULL COMMENT 'ID слушателя',
  schedule_event_id VARCHAR(191) NOT NULL COMMENT 'ID занятия (assessment)',
  grade INT NOT NULL COMMENT 'Оценка (0-100)',
  notes TEXT COMMENT 'Комментарий к оценке',
  graded_by VARCHAR(191) COMMENT 'Кто выставил оценку',
  graded_at DATETIME(3) COMMENT 'Когда выставлена',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  
  UNIQUE INDEX idx_student_event (student_id, schedule_event_id),
  INDEX idx_schedule_event_id (schedule_event_id),
  INDEX idx_graded_by (graded_by),
  INDEX idx_grade (grade),
  
  CONSTRAINT fk_grades_student 
    FOREIGN KEY (student_id) REFERENCES students(id) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_grades_event 
    FOREIGN KEY (schedule_event_id) REFERENCES schedule_events(id) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_grades_graded_by 
    FOREIGN KEY (graded_by) REFERENCES users(id) 
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_grade_range CHECK (grade >= 0 AND grade <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. FINAL_GRADES - Итоговые оценки по дисциплине
-- ============================================================

CREATE TABLE IF NOT EXISTS final_grades (
  id VARCHAR(191) PRIMARY KEY,
  student_id VARCHAR(191) NOT NULL COMMENT 'ID слушателя',
  group_id VARCHAR(191) NOT NULL COMMENT 'ID группы',
  discipline_id VARCHAR(191) NOT NULL COMMENT 'ID дисциплины',
  final_grade INT COMMENT 'Итоговая оценка (0-100)',
  attendance_percent DECIMAL(5,2) COMMENT 'Процент посещаемости',
  status ENUM('in_progress', 'passed', 'failed', 'not_allowed') NOT NULL DEFAULT 'in_progress' 
    COMMENT 'Статус: в процессе, сдал, не сдал, не допущен',
  notes TEXT COMMENT 'Примечания',
  graded_by VARCHAR(191) COMMENT 'Кто выставил итоговую оценку',
  graded_at DATETIME(3) COMMENT 'Когда выставлена',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  
  UNIQUE INDEX idx_student_group_discipline (student_id, group_id, discipline_id),
  INDEX idx_group_discipline (group_id, discipline_id),
  INDEX idx_status (status),
  INDEX idx_graded_by (graded_by),
  
  CONSTRAINT fk_final_grades_student 
    FOREIGN KEY (student_id) REFERENCES students(id) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_final_grades_group 
    FOREIGN KEY (group_id) REFERENCES study_groups(id) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_final_grades_discipline 
    FOREIGN KEY (discipline_id) REFERENCES disciplines(id) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_final_grades_graded_by 
    FOREIGN KEY (graded_by) REFERENCES users(id) 
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_final_grade_range CHECK (final_grade IS NULL OR (final_grade >= 0 AND final_grade <= 100)),
  CONSTRAINT chk_attendance_percent CHECK (attendance_percent IS NULL OR (attendance_percent >= 0 AND attendance_percent <= 100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Обновление activity_logs для новых типов сущностей
-- ============================================================

ALTER TABLE activity_logs 
MODIFY COLUMN entity_type ENUM(
  'USER', 'STUDENT', 'CERTIFICATE', 'COURSE', 'DISCIPLINE', 
  'INSTRUCTOR', 'FILE', 'FOLDER', 'SYSTEM', 'GROUP', 
  'SCHEDULE', 'ATTENDANCE', 'GRADE'
) NOT NULL;
