/**
 * API endpoint для удаления сертификата
 * DELETE /api/certificates/:id
 */

import { deleteCertificate } from '../../utils/studentStorage';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');

    if (!id) {
      return {
        success: false,
        message: 'ID сертификата не указан',
      };
    }

    const deleted = deleteCertificate(id);

    if (!deleted) {
      return {
        success: false,
        message: 'Сертификат не найден',
      };
    }

    return {
      success: true,
      message: 'Сертификат успешно удален',
    };
  } catch (error) {
    console.error('Ошибка удаления сертификата:', error);
    
    return {
      success: false,
      message: 'Ошибка при удалении сертификата',
    };
  }
});
