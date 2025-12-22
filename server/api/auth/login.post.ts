import { executeQuery } from '../../utils/db';
import { verifyPassword, generateToken, generateRefreshToken, toPublicUser, createTokenPayload } from '../../utils/auth';
import { validate, loginSchema } from '../../utils/validation';
import { logActivityDirect } from '../../utils/activityLogger';
import type { User, LoginData, AuthResponse } from '../../types/auth';

/**
 * API endpoint для входа пользователя
 * POST /api/auth/login
 * 
 * Body: { email, password }
 */
export default defineEventHandler(async (event) => {
  try {
    // Чтение тела запроса
    const body = await readBody<LoginData>(event);

    // Валидация данных
    const validation = validate(loginSchema, body);
    if (!validation.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation Error',
        data: {
          success: false,
          message: 'Ошибка валидации данных',
          errors: validation.errors,
        },
      });
    }

    const { email, password } = validation.data;

    // Поиск пользователя по email
    const users = await executeQuery<User[]>(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (users.length === 0) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid Credentials',
        data: {
          success: false,
          message: 'Неверный email или пароль',
          errors: { _general: ['Неверный email или пароль'] },
        },
      });
    }

    const user = users[0];

    // Проверка пароля
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid Credentials',
        data: {
          success: false,
          message: 'Неверный email или пароль',
          errors: { _general: ['Неверный email или пароль'] },
        },
      });
    }

    // Генерация токенов
    const tokenPayload = createTokenPayload(user);
    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Возврат ответа
    const response: AuthResponse = {
      success: true,
      user: toPublicUser(user),
      token,
      refreshToken,
    };

    console.log(`✅ User logged in: ${user.email} (${user.role})`);

    // Логируем вход (используем Direct, т.к. user ещё не в context)
    await logActivityDirect(
      user.id,
      'LOGIN',
      'SYSTEM',
      user.id,
      user.name
    );

    return response;
  } catch (error: any) {
    console.error('Login error:', error);

    // Если ошибка уже создана через createError, пробрасываем её
    if (error.statusCode) {
      throw error;
    }

    // Иначе создаем общую ошибку
    throw createError({
      statusCode: 500,
      statusMessage: 'Login Failed',
      data: {
        success: false,
        message: 'Ошибка при входе в систему',
      },
    });
  }
});
