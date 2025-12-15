/**
 * Временное хранилище данных студентов
 * В продакшене следует заменить на реальную базу данных
 */

import type { Student, StudentCertificate } from '../types/student';

// Временное хранилище студентов
const students: Student[] = [
  {
    id: '1',
    fullName: 'Иванов Иван Иванович',
    pinfl: '12345678901234',
    organization: 'ООО "Пример"',
    department: 'IT отдел',
    position: 'Разработчик',
    certificates: [
      {
        id: 'cert-1',
        studentId: '1',
        courseName: 'Основы программирования',
        issueDate: new Date('2024-01-15'),
        certificateNumber: 'CERT-2024-001',
        fileUrl: 'https://example.com/certificates/cert-1.pdf',
        expiryDate: new Date('2025-01-15'),
        created_at: new Date('2024-01-15'),
        updated_at: new Date('2024-01-15'),
      },
      {
        id: 'cert-2',
        studentId: '1',
        courseName: 'Продвинутый JavaScript',
        issueDate: new Date('2024-06-20'),
        certificateNumber: 'CERT-2024-002',
        fileUrl: 'https://example.com/certificates/cert-2.pdf',
        expiryDate: null,
        created_at: new Date('2024-06-20'),
        updated_at: new Date('2024-06-20'),
      },
    ],
    created_at: new Date('2024-01-10'),
    updated_at: new Date('2024-01-10'),
  },
  {
    id: '2',
    fullName: 'Петрова Мария Сергеевна',
    pinfl: '98765432109876',
    organization: 'АО "Технологии"',
    department: null,
    position: 'Менеджер проектов',
    certificates: [],
    created_at: new Date('2024-02-15'),
    updated_at: new Date('2024-02-15'),
  },
];

// Хранилище сертификатов (для быстрого доступа)
const certificates: StudentCertificate[] = students.flatMap(s => s.certificates);

// Счетчики для генерации ID
let studentIdCounter = students.length + 1;
let certificateIdCounter = certificates.length + 1;

/**
 * Получить всех студентов
 */
export function getAllStudents(): Student[] {
  return students;
}

/**
 * Получить студента по ID
 */
export function getStudentById(id: string): Student | undefined {
  return students.find(s => s.id === id);
}

/**
 * Создать нового студента
 */
export function createStudent(data: Omit<Student, 'id' | 'certificates' | 'created_at' | 'updated_at'>): Student {
  const newStudent: Student = {
    id: String(studentIdCounter++),
    ...data,
    certificates: [],
    created_at: new Date(),
    updated_at: new Date(),
  };
  
  students.push(newStudent);
  return newStudent;
}

/**
 * Обновить студента
 */
export function updateStudent(id: string, data: Partial<Omit<Student, 'id' | 'certificates' | 'created_at' | 'updated_at'>>): Student | null {
  const index = students.findIndex(s => s.id === id);
  if (index === -1) return null;

  students[index] = {
    ...students[index],
    ...data,
    updated_at: new Date(),
  };

  return students[index];
}

/**
 * Удалить студента
 */
export function deleteStudent(id: string): boolean {
  const index = students.findIndex(s => s.id === id);
  if (index === -1) return false;

  students.splice(index, 1);
  return true;
}

/**
 * Добавить сертификат студенту
 */
export function addCertificateToStudent(
  studentId: string,
  data: Omit<StudentCertificate, 'id' | 'studentId' | 'created_at' | 'updated_at'>
): StudentCertificate | null {
  const student = students.find(s => s.id === studentId);
  if (!student) return null;

  const newCertificate: StudentCertificate = {
    id: `cert-${certificateIdCounter++}`,
    studentId,
    ...data,
    issueDate: new Date(data.issueDate),
    expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  student.certificates.push(newCertificate);
  certificates.push(newCertificate);
  
  return newCertificate;
}

/**
 * Удалить сертификат
 */
export function deleteCertificate(certificateId: string): boolean {
  // Найти студента с этим сертификатом
  const student = students.find(s => s.certificates.some(c => c.id === certificateId));
  if (!student) return false;

  // Удалить сертификат из списка студента
  const certIndex = student.certificates.findIndex(c => c.id === certificateId);
  if (certIndex !== -1) {
    student.certificates.splice(certIndex, 1);
  }

  // Удалить из общего списка сертификатов
  const globalCertIndex = certificates.findIndex(c => c.id === certificateId);
  if (globalCertIndex !== -1) {
    certificates.splice(globalCertIndex, 1);
  }

  return true;
}

/**
 * Проверить, существует ли студент с таким ПИНФЛ
 */
export function studentExistsByPinfl(pinfl: string, excludeId?: string): boolean {
  return students.some(s => s.pinfl === pinfl && s.id !== excludeId);
}
