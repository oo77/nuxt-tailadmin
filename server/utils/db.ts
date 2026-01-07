import mysql from 'mysql2/promise';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * Получить SSL конфигурацию для Aiven или других облачных провайдеров
 * 
 * Поддерживает три варианта:
 * 1. DATABASE_SSL_CA - сертификат напрямую в переменной окружения (для serverless)
 * 2. DATABASE_SSL_CA_PATH - путь к файлу сертификата
 * 3. Встроенный файл server/certs/aiven-ca.pem
 */
function getSslConfig(): mysql.SslOptions | undefined {
  const sslEnabled = process.env.DATABASE_SSL === 'true';

  if (!sslEnabled) {
    return undefined;
  }

  // Вариант 1: Сертификат напрямую в переменной окружения (для Netlify/Vercel)
  const caCertEnv = process.env.DATABASE_SSL_CA;
  if (caCertEnv) {
    console.log('🔒 SSL enabled with CA certificate from environment variable');
    // Заменяем экранированные \n на реальные переносы строк и конвертируем в Buffer
    const certString = caCertEnv.replace(/\\n/g, '\n');
    const ca = Buffer.from(certString, 'utf-8');
    console.log('🔒 CA certificate length:', ca.length, 'bytes');
    return {
      ca,
      rejectUnauthorized: true
    };
  }

  // Вариант 2: Путь к CA сертификату
  const caCertPath = process.env.DATABASE_SSL_CA_PATH;
  if (caCertPath) {
    try {
      const ca = readFileSync(caCertPath);
      console.log('🔒 SSL enabled with custom CA certificate path');
      return {
        ca,
        rejectUnauthorized: true
      };
    } catch (error) {
      console.error('⚠️ Failed to read CA certificate from path:', error);
    }
  }

  // Вариант 3: Встроенный сертификат Aiven (несколько путей для разных окружений)
  const possiblePaths = [
    // Для разработки
    join(process.cwd(), 'server/certs/aiven-ca.pem'),
    // Для Netlify Functions
    join(dirname(fileURLToPath(import.meta.url)), '../certs/aiven-ca.pem'),
    // Относительный путь
    './server/certs/aiven-ca.pem',
  ];

  for (const certPath of possiblePaths) {
    try {
      if (existsSync(certPath)) {
        const ca = readFileSync(certPath);
        console.log(`🔒 SSL enabled with Aiven CA certificate from: ${certPath}`);
        return {
          ca,
          rejectUnauthorized: true
        };
      }
    } catch {
      // Пробуем следующий путь
    }
  }

  // Если сертификат не найден, используем базовый SSL без верификации
  console.log('🔒 SSL enabled without CA verification (certificate not found)');
  return {
    rejectUnauthorized: false
  };
}

// Конфигурация подключения к БД
const dbConfig: mysql.PoolOptions = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'atc_test',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  ssl: getSslConfig(),
};

// Создание пула подключений
let pool: mysql.Pool | null = null;

/**
 * Получить пул подключений к БД
 * Создает новый пул при первом вызове и переиспользует его в дальнейшем
 */
export function getDbPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
    console.log('✅ MySQL connection pool created');
  }
  return pool;
}

/**
 * Выполнить SQL запрос
 * @param query - SQL запрос
 * @param params - Параметры запроса
 * @returns Результат запроса
 */
export async function executeQuery<T = any>(
  query: string,
  params?: any[]
): Promise<T> {
  const connection = await getDbPool().getConnection();
  try {
    const [rows] = await connection.execute(query, params);
    return rows as T;
  } finally {
    connection.release();
  }
}

/**
 * Выполнить несколько запросов в транзакции
 * @param callback - Функция с запросами
 * @returns Результат транзакции
 */
export async function executeTransaction<T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await getDbPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Проверить подключение к БД
 */
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await getDbPool().getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}
