import { d as defineEventHandler, r as readBody, c as createError, e as executeQuery, v as verifyPassword, b as createTokenPayload, f as generateToken, h as generateRefreshToken, t as toPublicUser } from '../../../nitro/nitro.mjs';
import { v as validate, l as loginSchema } from '../../../_/validation.mjs';
import { a as logActivityDirect } from '../../../_/activityLogger.mjs';
import 'grammy';
import 'uuid';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'mysql2/promise';
import 'fs';
import 'path';
import 'bcryptjs';
import 'crypto';
import 'jsonwebtoken';
import 'zod';
import '../../../_/activityLogRepository.mjs';

const login_post = defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const validation = validate(loginSchema, body);
    if (!validation.success) {
      throw createError({
        statusCode: 400,
        statusMessage: "Validation Error",
        data: {
          success: false,
          message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438 \u0434\u0430\u043D\u043D\u044B\u0445",
          errors: validation.errors
        }
      });
    }
    const { email, password } = validation.data;
    const users = await executeQuery(
      "SELECT * FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    if (users.length === 0) {
      throw createError({
        statusCode: 401,
        statusMessage: "Invalid Credentials",
        data: {
          success: false,
          message: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 email \u0438\u043B\u0438 \u043F\u0430\u0440\u043E\u043B\u044C",
          errors: { _general: ["\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 email \u0438\u043B\u0438 \u043F\u0430\u0440\u043E\u043B\u044C"] }
        }
      });
    }
    const user = users[0];
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw createError({
        statusCode: 401,
        statusMessage: "Invalid Credentials",
        data: {
          success: false,
          message: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 email \u0438\u043B\u0438 \u043F\u0430\u0440\u043E\u043B\u044C",
          errors: { _general: ["\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 email \u0438\u043B\u0438 \u043F\u0430\u0440\u043E\u043B\u044C"] }
        }
      });
    }
    const tokenPayload = createTokenPayload(user);
    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    const response = {
      success: true,
      user: toPublicUser(user),
      token,
      refreshToken
    };
    console.log(`\u2705 User logged in: ${user.email} (${user.role})`);
    await logActivityDirect(
      user.id,
      "LOGIN",
      "SYSTEM",
      user.id,
      user.name
    );
    return response;
  } catch (error) {
    console.error("Login error:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Login Failed",
      data: {
        success: false,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0432\u0445\u043E\u0434\u0435 \u0432 \u0441\u0438\u0441\u0442\u0435\u043C\u0443"
      }
    });
  }
});

export { login_post as default };
//# sourceMappingURL=login.post.mjs.map
