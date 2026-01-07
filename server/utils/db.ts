import mysql from 'mysql2/promise';

/**
 * Встроенный Aiven CA сертификат
 * Это публичный ключ (не секретный), поэтому его безопасно хранить в коде.
 * Срок действия: до 2035-10-28
 */
const AIVEN_CA_CERTIFICATE = `-----BEGIN CERTIFICATE-----
MIIEUDCCArigAwIBAgIUTAG7gMPqpM+PfUHgMf9lLG4b+bEwDQYJKoZIhvcNAQEM
BQAwQDE+MDwGA1UEAww1NDUyZWFmYzMtNDU4NC00Njg4LWI1NDAtODJiYWU4ZTE0
ZDc0IEdFTiAxIFByb2plY3QgQ0EwHhcNMjUxMDMwMDcyNjUxWhcNMzUxMDI4MDcy
NjUxWjBAMT4wPAYDVQQDDDU0NTJlYWZjMy00NTg0LTQ2ODgtYjU0MC04MmJhZThl
MTRkNzQgR0VOIDEgUHJvamVjdCBDQTCCAaIwDQYJKoZIhvcNAQEBBQADggGPADCC
AYoCggGBAKmKyGKzFAYjQJGdtlrtvXPuaZacnbjrde5BYQdU52IX5tJeWQ58N27o
pDbMrZhlOCvHd57K5Oxkp6V5alnI0/ekuTN8eoIYvjtNqtE72gIN6I808+nk1K/0
tPxrvTURAFEvxyhf77JEIWOAz+OJ0fYfDmoIIp+IY5b0wp/sLhNO1u1m2+8tDglu
bTSO4139nJo0D8ApafMpF5sQ5Vpci6wk9u6W3XpJ/+wJuJ5Oioe/mjEv/TKCkmzn
wX4ALgiONVI3qxPV7RaynNY/SRpBX5kcuChrP/3+WZ9QsRwyPI530Kz2nZX10XVm
5ik/tEVJAjf08yrhAjLxZ4paBt3Pcy9egNWIeA2ixMy49qu1QkDkCrw8t4K79oAC
By/bj5aVGbup2W+Q5hc83AQ2IhmWVWChnJI9dcg1l7T4AAqXJPBtp1AWGhHcldNH
3Ao/aavgLE9kTcEWLO5P1izMKaYsqhpsQEx3lmWcLi4wPJn7F2f0pQ0Q5rJZ74Z6
RNrZ80/c5wIDAQABo0IwQDAdBgNVHQ4EFgQUT+zOIhiQP49iiJ8dkJIeB0JY3JUw
EgYDVR0TAQH/BAgwBgEB/wIBADALBgNVHQ8EBAMCAQYwDQYJKoZIhvcNAQEMBQAD
ggGBACVlQGNrmSCfIaevjuMDqvdGB7NZYJM3Fkr4m7bAtDD0WYxgneH9HmcaWcpA
Ctzbv64vP/wBIMRKzj3DeglUIe1hwaXQq4mcNuoGt4TMHzktdZhisgxCdjYFVIcS
qjbsK1XOPChn/WFmEqCN+FsTdXIi4CeQPSFKFOIVxM+UKRk/nx2DV2PDwN/pt3A/
Gq10ujVDZNTdQlBSLIf5b+qtIVQRJ66cHpIaTTWZvkw++0ULbA8dK0f7sdrd751A
lK1uTg9e3TEeW7TTdKqsr/8F8VVrJDtKjJLSN7IbM4QmnzBC/QAkNnuPEaDwwmyj
5XEdvDcAa+VfZXRXSjAi05fsgw5f94dqJlos2oEDmeEN4tx3y0VItPUXOZNbWg7r
JPPGg3mrBuICcqd1h9OgyYo+siTwHITM/kL0fgLzNWHEyYQ5GLigzvXNw+WLlWsh
iLd4pScmXlOmyIbdtAhxRwmNLBDupx/C3H8pTGl0nFKA3P3Sb/Ftw53wewc51flt
Z7dREA==
-----END CERTIFICATE-----`;

/**
 * Получить SSL конфигурацию для Aiven
 * Использует встроенный сертификат AIVEN_CA_CERTIFICATE
 */
function getSslConfig(): mysql.SslOptions | undefined {
  const sslEnabled = process.env.DATABASE_SSL === 'true';

  if (!sslEnabled) {
    return undefined;
  }

  console.log('🔒 SSL enabled with built-in Aiven CA certificate');
  return {
    ca: Buffer.from(AIVEN_CA_CERTIFICATE, 'utf-8'),
    rejectUnauthorized: true
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
