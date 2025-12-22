/**
 * API endpoint для получения списка учебных групп с пагинацией
 * GET /api/groups?page=1&limit=10&search=...
 */

import { getGroups, getGroupsStats, type GroupFilters } from '../../repositories/groupRepository';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);

    // Парсим фильтры
    const filters: GroupFilters = {};
    
    if (query.search) {
      filters.search = query.search as string;
    }
    
    if (query.courseId) {
      filters.courseId = query.courseId as string;
    }
    
    if (query.isActive !== undefined) {
      filters.isActive = query.isActive === 'true';
    }
    
    if (query.startDateFrom) {
      filters.startDateFrom = query.startDateFrom as string;
    }
    
    if (query.startDateTo) {
      filters.startDateTo = query.startDateTo as string;
    }

    // Парсим параметры пагинации
    const page = query.page ? parseInt(query.page as string, 10) : 1;
    const limit = query.limit ? Math.min(parseInt(query.limit as string, 10), 100) : 10;

    const result = await getGroups({ page, limit, filters });
    
    // Получаем статистику
    const stats = await getGroupsStats();

    return {
      success: true,
      groups: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      stats,
    };
  } catch (error) {
    console.error('Ошибка получения списка групп:', error);
    
    return {
      success: false,
      message: 'Ошибка при получении списка групп',
      groups: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
      stats: { total: 0, active: 0, completed: 0, totalStudents: 0 },
    };
  }
});
