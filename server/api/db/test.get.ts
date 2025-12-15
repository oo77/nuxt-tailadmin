import { testConnection } from '../../utils/db';

/**
 * API endpoint для проверки подключения к БД
 * GET /api/db/test
 */
export default defineEventHandler(async (event) => {
  try {
    const isConnected = await testConnection();

    if (isConnected) {
      return {
        success: true,
        message: 'Database connection successful',
        config: {
          host: process.env.DATABASE_HOST,
          port: process.env.DATABASE_PORT,
          database: process.env.DATABASE_NAME,
          user: process.env.DATABASE_USER,
        },
      };
    } else {
      throw new Error('Connection test failed');
    }
  } catch (error: any) {
    console.error('Database test error:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Database connection failed',
      data: error.message,
    });
  }
});
