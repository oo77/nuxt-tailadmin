import { defineEventHandler, createError } from 'h3';
import { deleteRepresentative, getRepresentativeById } from '../../repositories/representativeRepository';
import { createActivityLog } from '../../repositories/activityLogRepository';

/**
 * DELETE /api/representatives/:id
 * Удаление представителя
 */
export default defineEventHandler(async (event) => {
  try {
    const id = event.context.params?.id;

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID представителя не указан',
      });
    }

    const existing = await getRepresentativeById(id);
    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Представитель не найден',
      });
    }

    await deleteRepresentative(id);

    // Логирование действия
    await createActivityLog({
      userId: event.context.user?.id || 'system',
      actionType: 'DELETE',
      entityType: 'REPRESENTATIVE',
      entityId: id,
      entityName: existing.fullName,
      details: {
        organizationId: existing.organizationId,
        organizationName: existing.organizationName,
      },
    });

    return {
      success: true,
      message: 'Представитель успешно удалён',
    };
  } catch (error: any) {
    console.error('Error deleting representative:', error);
    
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка при удалении представителя',
    });
  }
});
