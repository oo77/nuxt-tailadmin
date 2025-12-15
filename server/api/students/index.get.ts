/**
 * API endpoint для получения списка всех студентов
 * GET /api/students
 */

import { getAllStudents } from '../../utils/studentStorage';

export default defineEventHandler(async (event) => {
  try {
    const students = getAllStudents();

    return {
      success: true,
      students,
      total: students.length,
    };
  } catch (error) {
    console.error('Ошибка получения списка студентов:', error);
    
    return {
      success: false,
      message: 'Ошибка при получении списка студентов',
      students: [],
      total: 0,
    };
  }
});
