-- Создание таблицы пользователей для системы ATC Platform
-- Поддержка ролей: ADMIN, MANAGER, TEACHER, STUDENT

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Создание администратора по умолчанию
-- Пароль: admin123 (хешированный через bcrypt)
INSERT INTO users (id, role, name, email, password_hash, created_at, updated_at) 
VALUES (
  UUID(),
  'ADMIN',
  'Администратор',
  'admin@atc.uz',
  '$2a$10$YourHashedPasswordHere',
  NOW(3),
  NOW(3)
) ON DUPLICATE KEY UPDATE email = email;
