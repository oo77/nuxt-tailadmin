/**
 * Миграция: Добавление поддержки паролей для папок
 * Дата: 2025-12-19
 */

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Добавление поля password_hash в таблицу folders
  await knex.schema.alterTable('folders', (table) => {
    table.string('password_hash', 255).nullable().comment('Хеш пароля для защиты папки');
  });

  console.log('✓ Добавлено поле password_hash в таблицу folders');
}

export async function down(knex: Knex): Promise<void> {
  // Удаление поля password_hash
  await knex.schema.alterTable('folders', (table) => {
    table.dropColumn('password_hash');
  });

  console.log('✓ Удалено поле password_hash из таблицы folders');
}
