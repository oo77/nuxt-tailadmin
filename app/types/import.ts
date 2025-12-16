/**
 * Общие типы для импорта студентов
 */

// Строка из Excel файла
export interface ExcelStudentRow {
  ПИНФЛ: string;
  ФИО: string;
  Организация: string;
  'Служба/Отдел': string;
  Должность: string;
}

// Обработанные данные студента для импорта
export interface ImportStudentData {
  pinfl: string;
  fullName: string;
  organization: string;
  department: string | null;
  position: string;
  rowNumber: number; // Номер строки в Excel для отслеживания ошибок
}

// Результат валидации строки
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  rowNumber: number;
  data?: ImportStudentData;
}

// Анализ импорта
export interface ImportAnalysis {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  newStudents: number; // Будут созданы
  existingStudents: number; // Будут обновлены
  existingPinfls: string[]; // Список ПИНФЛ существующих студентов (для отображения статуса)
  errors: Array<{
    rowNumber: number;
    errors: string[];
  }>;
  preview: ImportStudentData[]; // Первые 20 строк для предпросмотра
}

// Статус задачи импорта
export enum ImportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// Прогресс импорта
export interface ImportProgress {
  jobId: string;
  status: ImportStatus;
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  createdCount: number;
  updatedCount: number;
  errors: Array<{
    rowNumber: number;
    pinfl: string;
    error: string;
  }>;
  startedAt: Date;
  completedAt?: Date;
}

// Результат импорта
export interface ImportResult {
  success: boolean;
  jobId: string;
  totalProcessed: number;
  created: number;
  updated: number;
  failed: number;
  errors: Array<{
    rowNumber: number;
    pinfl: string;
    error: string;
  }>;
  duration: number; // в миллисекундах
}
