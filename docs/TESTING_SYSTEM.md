# Система тестирования студентов

## Оглавление
1. [Общая концепция](#общая-концепция)
2. [Архитектура](#архитектура)
3. [Схема базы данных](#схема-базы-данных)
4. [Пользовательские сценарии](#пользовательские-сценарии)
5. [План реализации](#план-реализации)

---

## Общая концепция

### Цель
Реализация системы онлайн и офлайн тестирования студентов с автоматической проверкой и выставлением оценок.

### Ключевые принципы

1. **Глобальная база тестов** — независимая от курсов и дисциплин
2. **Привязка к дисциплинам** — тесты связываются с дисциплинами при настройке УП
3. **Интеграция с расписанием** — тесты назначаются через занятия типа "assessment"
4. **Автоматическое оценивание** — результаты сразу записываются в журнал
5. **Антипрокторинг** — контроль переключения вкладок (настраиваемый)

### Типы вопросов

**Этап 1 (текущая реализация):**
- `single` — один правильный ответ

**Будущие этапы:**
- `multiple` — несколько правильных ответов
- `text` — текстовый ответ
- `order` — упорядочивание элементов
- `match` — сопоставление

---

## Архитектура

### Трёхуровневая структура

```
┌─────────────────────────────────────────────────────────────┐
│  УРОВЕНЬ 1: ГЛОБАЛЬНАЯ БАЗА ТЕСТОВ                          │
│  (/test-bank)                                               │
│                                                             │
│  question_banks → questions → test_templates                │
└─────────────────────────────────────────────────────────────┘
                          ↓ (привязка)
┌─────────────────────────────────────────────────────────────┐
│  УРОВЕНЬ 2: УЧЕБНЫЕ ПРОГРАММЫ                               │
│  (/programs)                                                │
│                                                             │
│  courses → disciplines → discipline_tests                   │
│                    ↓                                        │
│            study_groups → schedule_events (assessment)      │
└─────────────────────────────────────────────────────────────┘
                          ↓ (назначение)
┌─────────────────────────────────────────────────────────────┐
│  УРОВЕНЬ 3: ПРОХОЖДЕНИЕ ТЕСТОВ                              │
│  (/tests)                                                   │
│                                                             │
│  test_assignments → test_sessions → test_answers → grades   │
└─────────────────────────────────────────────────────────────┘
```

### Поток данных

```
1. Admin создаёт банк вопросов
   ↓
2. Admin добавляет вопросы в банк (вручную или импорт Excel)
   ↓
3. Admin создаёт шаблон теста на основе банка
   ↓
4. Manager привязывает шаблон к дисциплине
   ↓
5. Teacher создаёт занятие "Контроль знаний"
   ↓
6. Teacher выбирает тест из привязанных к дисциплине
   ↓
7. Система создаёт test_assignment
   ↓
8. Student видит назначенный тест в расписании
   ↓
9. Student проходит тест → создаётся test_session
   ↓
10. Система подсчитывает результат
    ↓
11. Оценка записывается в grades
```

---

## Схема базы данных

### Таблицы (8 новых)

#### 1. question_banks
**Назначение:** Банки вопросов (глобальные, независимые от курсов)

| Поле | Тип | Описание |
|------|-----|----------|
| id | VARCHAR(191) | PK |
| name | VARCHAR(255) | Название банка |
| code | VARCHAR(50) | Уникальный код (например: "OT-BASE") |
| description | TEXT | Описание |
| category | VARCHAR(100) | Категория для группировки |
| is_active | BOOLEAN | Активен ли банк |
| created_by | VARCHAR(191) | FK → users.id |
| created_at | DATETIME(3) | Дата создания |
| updated_at | DATETIME(3) | Дата обновления |

**Индексы:**
- `idx_category` (category)
- `idx_is_active` (is_active)
- `ft_search` FULLTEXT (name, description, category)

---

#### 2. questions
**Назначение:** Вопросы для тестов

| Поле | Тип | Описание |
|------|-----|----------|
| id | VARCHAR(191) | PK |
| bank_id | VARCHAR(191) | FK → question_banks.id |
| question_type | ENUM | 'single', 'multiple', 'text', 'order', 'match' |
| question_text | TEXT | Текст вопроса |
| question_media | JSON | Медиа: `[{type, url, caption}]` |
| options | JSON | Варианты ответов (см. форматы ниже) |
| points | INT | Баллы за правильный ответ (по умолчанию 1) |
| explanation | TEXT | Объяснение правильного ответа |
| difficulty | ENUM | 'easy', 'medium', 'hard' |
| tags | JSON | `["тег1", "тег2"]` |
| order_index | INT | Порядок в банке |
| is_active | BOOLEAN | Активен ли вопрос |
| created_at | DATETIME(3) | |
| updated_at | DATETIME(3) | |

**Формат поля `options` для типа `single`:**
```json
{
  "options": [
    {"id": "a", "text": "Вариант 1", "correct": false},
    {"id": "b", "text": "Вариант 2", "correct": true},
    {"id": "c", "text": "Вариант 3", "correct": false},
    {"id": "d", "text": "Вариант 4", "correct": false}
  ]
}
```

**Индексы:**
- `idx_bank_id` (bank_id)
- `idx_type` (question_type)
- `idx_difficulty` (difficulty)
- `ft_search` FULLTEXT (question_text)

---

#### 3. test_templates
**Назначение:** Шаблоны тестов (глобальные, переиспользуемые)

| Поле | Тип | Описание |
|------|-----|----------|
| id | VARCHAR(191) | PK |
| bank_id | VARCHAR(191) | FK → question_banks.id |
| name | VARCHAR(255) | Название теста |
| code | VARCHAR(50) | Уникальный код |
| description | TEXT | Описание |
| questions_mode | ENUM | 'all', 'random', 'manual' |
| questions_count | INT | Кол-во вопросов (для random) |
| time_limit_minutes | INT | Лимит времени (NULL = без лимита) |
| passing_score | INT | Проходной балл % (по умолчанию 60) |
| max_attempts | INT | Макс. попыток (по умолчанию 1) |
| shuffle_questions | BOOLEAN | Перемешивать вопросы |
| shuffle_options | BOOLEAN | Перемешивать варианты ответов |
| questions_per_page | INT | Вопросов на странице (1 = по одному) |
| show_results | ENUM | 'immediately', 'after_deadline', 'manual', 'never' |
| allow_back | BOOLEAN | Разрешить возврат к вопросам |
| proctoring_enabled | BOOLEAN | Включён ли антипрокторинг |
| proctoring_settings | JSON | `{blockTabSwitch: true, ...}` |
| is_active | BOOLEAN | |
| created_by | VARCHAR(191) | FK → users.id |
| created_at | DATETIME(3) | |
| updated_at | DATETIME(3) | |

**Режимы вопросов:**
- `all` — все вопросы из банка
- `random` — случайные N вопросов
- `manual` — вручную выбранные (через test_template_questions)

---

#### 4. test_template_questions
**Назначение:** Вопросы шаблона (только для режима `manual`)

| Поле | Тип | Описание |
|------|-----|----------|
| id | VARCHAR(191) | PK |
| template_id | VARCHAR(191) | FK → test_templates.id |
| question_id | VARCHAR(191) | FK → questions.id |
| order_index | INT | Порядок вопроса |
| points_override | INT | Переопределённые баллы (NULL = из вопроса) |

**Индексы:**
- UNIQUE `idx_template_question` (template_id, question_id)

---

#### 5. discipline_tests
**Назначение:** Связь дисциплин и шаблонов тестов

| Поле | Тип | Описание |
|------|-----|----------|
| id | VARCHAR(191) | PK |
| discipline_id | VARCHAR(191) | FK → disciplines.id |
| test_template_id | VARCHAR(191) | FK → test_templates.id |
| is_required | BOOLEAN | Обязательный ли тест |
| order_index | INT | Порядок отображения |
| notes | TEXT | Примечания |
| created_at | DATETIME(3) | |

**Индексы:**
- UNIQUE `idx_discipline_test` (discipline_id, test_template_id)

---

#### 6. test_assignments
**Назначение:** Назначение теста на конкретное занятие

| Поле | Тип | Описание |
|------|-----|----------|
| id | VARCHAR(191) | PK |
| schedule_event_id | VARCHAR(191) | FK → schedule_events.id (UNIQUE) |
| test_template_id | VARCHAR(191) | FK → test_templates.id |
| group_id | VARCHAR(191) | FK → study_groups.id |
| time_limit_override | INT | Переопределить лимит времени |
| passing_score_override | INT | Переопределить проходной балл |
| start_date | DATETIME(3) | Когда открывается тест |
| end_date | DATETIME(3) | Крайний срок |
| status | ENUM | 'scheduled', 'in_progress', 'completed', 'cancelled' |
| assigned_by | VARCHAR(191) | FK → users.id |
| created_at | DATETIME(3) | |
| updated_at | DATETIME(3) | |

**Индексы:**
- UNIQUE `idx_event` (schedule_event_id)
- `idx_group` (group_id)
- `idx_status` (status)

---

#### 7. test_sessions
**Назначение:** Сессии прохождения теста студентом

| Поле | Тип | Описание |
|------|-----|----------|
| id | VARCHAR(191) | PK |
| assignment_id | VARCHAR(191) | FK → test_assignments.id |
| student_id | VARCHAR(191) | FK → students.id |
| attempt_number | INT | Номер попытки (1, 2, 3...) |
| status | ENUM | 'in_progress', 'completed', 'timeout', 'cancelled', 'violation' |
| questions_order | JSON | `[{questionId, shuffledOptions}]` |
| current_question_index | INT | Текущий вопрос (для навигации) |
| started_at | DATETIME(3) | Время начала |
| completed_at | DATETIME(3) | Время завершения |
| time_spent_seconds | INT | Потраченное время |
| total_points | INT | Набранные баллы |
| max_points | INT | Максимальные баллы |
| score_percent | DECIMAL(5,2) | Процент правильных |
| passed | BOOLEAN | Сдал ли тест |
| grade | INT | Итоговая оценка 0-100 |
| violations | JSON | `[{type, timestamp, details}]` |
| ip_address | VARCHAR(45) | IP адрес |
| user_agent | TEXT | User-Agent |
| created_at | DATETIME(3) | |
| updated_at | DATETIME(3) | |

**Индексы:**
- UNIQUE `idx_assignment_student_attempt` (assignment_id, student_id, attempt_number)
- `idx_status` (status)

**Формат `questions_order`:**
```json
[
  {
    "questionId": "q1-uuid",
    "shuffledOptions": ["b", "a", "d", "c"]
  },
  {
    "questionId": "q2-uuid",
    "shuffledOptions": ["c", "a", "b", "d"]
  }
]
```

---

#### 8. test_answers
**Назначение:** Ответы студента на вопросы

| Поле | Тип | Описание |
|------|-----|----------|
| id | VARCHAR(191) | PK |
| session_id | VARCHAR(191) | FK → test_sessions.id |
| question_id | VARCHAR(191) | FK → questions.id |
| answer_data | JSON | Ответ студента |
| is_correct | BOOLEAN | Правильный ли ответ |
| points_earned | INT | Заработанные баллы |
| answered_at | DATETIME(3) | Время ответа |
| time_spent_seconds | INT | Время на вопрос |

**Индексы:**
- UNIQUE `idx_session_question` (session_id, question_id)

**Формат `answer_data` для типа `single`:**
```json
{
  "selectedOption": "b"
}
```

---

## Пользовательские сценарии

### Сценарий 1: Создание банка вопросов (Admin/Manager)

**Страница:** `/test-bank`

1. Нажимает "Создать банк вопросов"
2. Заполняет форму:
   - Название: "Охрана труда - Базовый уровень"
   - Код: "OT-BASE"
   - Категория: "Охрана труда"
   - Описание: "Базовые вопросы по ОТ"
3. Сохраняет → создаётся запись в `question_banks`

---

### Сценарий 2: Добавление вопросов (Admin/Manager)

**Страница:** `/test-bank/[bankId]`

**Вариант А: Вручную**
1. Нажимает "Добавить вопрос"
2. Заполняет:
   - Тип: Single choice
   - Вопрос: "Что такое СИЗ?"
   - Варианты:
     - A: Средства индивидуальной защиты ✓
     - B: Система измерения защиты
     - C: Специальная инструкция защиты
     - D: Стандарт измерения защиты
   - Баллы: 1
   - Сложность: Easy
3. Сохраняет → запись в `questions`

**Вариант Б: Импорт Excel**
1. Нажимает "Импортировать из Excel"
2. Загружает файл формата:
   ```
   | Вопрос | Вариант A | Вариант B | Вариант C | Вариант D | Правильный | Баллы |
   |--------|-----------|-----------|-----------|-----------|------------|-------|
   | Что... | СИЗ       | Система   | Инструкция| Стандарт  | A          | 1     |
   ```
3. Система парсит и создаёт вопросы массово

---

### Сценарий 3: Создание шаблона теста (Admin/Manager)

**Страница:** `/test-bank/templates/create`

1. Заполняет форму:
   - Название: "Тест по охране труда (базовый)"
   - Код: "OT-TEST-BASE"
   - Банк вопросов: "Охрана труда - Базовый уровень"
   - Режим: Все вопросы (all)
   - Время: 30 минут
   - Проходной балл: 70%
   - Попыток: 1
   - Показ: По 1 вопросу
   - Перемешивать вопросы: Да
   - Перемешивать варианты: Да
   - Антипрокторинг: Включён
     - Блокировать переключение вкладок: Да
2. Сохраняет → запись в `test_templates`

---

### Сценарий 4: Привязка теста к дисциплине (Manager)

**Страница:** `/programs/[courseId]` → вкладка дисциплины

1. Выбирает дисциплину "Основы охраны труда"
2. Переходит в раздел "Тесты для контроля знаний"
3. Нажимает "Добавить тест"
4. Выбирает из списка: "Тест по охране труда (базовый)"
5. Отмечает "Обязательный тест"
6. Сохраняет → запись в `discipline_tests`

---

### Сценарий 5: Создание занятия "Контроль знаний" (Teacher)

**Страница:** `/schedule` → создание события

1. Заполняет форму:
   - Группа: ОТ-2024-001
   - Дисциплина: "Основы охраны труда"
   - Тип: **Контроль знаний** (assessment)
   - Дата: 15.01.2026
   - Время: 10:00 - 11:30
2. При выборе типа "Контроль знаний" появляется поле:
   - **Тест:** [выпадающий список]
     - Тест по охране труда (базовый)
     - Промежуточный контроль ОТ
3. Выбирает "Тест по охране труда (базовый)"
4. Опционально переопределяет:
   - Время: 25 минут (вместо 30)
   - Проходной балл: 75% (вместо 70%)
5. Сохраняет → создаётся:
   - `schedule_events` (занятие)
   - `test_assignments` (назначение теста)

---

### Сценарий 6: Прохождение теста (Student)

**Страница:** `/tests/my` → `/tests/take/[assignmentId]`

1. Студент видит в "Моих тестах":
   - Тест по охране труда (базовый)
   - Группа: ОТ-2024-001
   - Дата: 15.01.2026 10:00
   - Статус: Доступен
2. Нажимает "Начать тест"
3. Видит информацию:
   - Вопросов: 20
   - Время: 25 минут
   - Проходной балл: 75%
   - Попыток: 1
4. Нажимает "Начать" → создаётся `test_sessions` (status: in_progress)
5. Видит первый вопрос с таймером
6. Отвечает → сохраняется в `test_answers`
7. Нажимает "Следующий вопрос"
8. Если пытается переключить вкладку → предупреждение + запись в `violations`
9. Отвечает на все вопросы
10. Нажимает "Завершить тест"
11. Система:
    - Подсчитывает баллы
    - Обновляет `test_sessions` (status: completed, grade: 85)
    - Создаёт запись в `grades` (grade: 85, schedule_event_id)
12. Студент видит результат:
    - Набрано: 17/20 баллов
    - Процент: 85%
    - Оценка: 85
    - Статус: Сдал ✓

---

## План реализации

### Этап 1: База данных (2 дня)
**Файлы:**
- `server/database/migrations/20260104_030_testing_system.ts`

**Задачи:**
- [x] Создать миграцию с 8 таблицами ✅ (20260104_028_testing_system.ts)
- [x] Добавить в `MIGRATIONS_REGISTRY` ✅
- [x] Запустить `npm run db:migrate` ✅
- [x] Проверить создание таблиц ✅
- [x] Создать TypeScript типы ✅ (server/types/testing.ts)

---

### Этап 2: Репозитории (2 дня) ✅ ВЫПОЛНЕНО
**Файлы:**
- `server/repositories/questionBankRepository.ts` ✅
- `server/repositories/questionRepository.ts` ✅
- `server/repositories/testTemplateRepository.ts` ✅
- `server/repositories/disciplineTestRepository.ts` ✅
- `server/repositories/testAssignmentRepository.ts` ✅
- `server/repositories/testSessionRepository.ts` ✅

**Функции каждого репозитория:**

**questionBankRepository.ts:**
- `getAll(filters)` — список банков
- `getById(id)` — детали банка
- `create(data)` — создание
- `update(id, data)` — обновление
- `delete(id)` — удаление
- `getByCategory(category)` — фильтр по категории

**questionRepository.ts:**
- `getByBankId(bankId)` — вопросы банка
- `getById(id)` — детали вопроса
- `create(data)` — создание
- `update(id, data)` — обновление
- `delete(id)` — удаление
- `bulkCreate(questions[])` — массовое создание (для импорта)
- `getRandomFromBank(bankId, count)` — случайные N вопросов

**testTemplateRepository.ts:**
- `getAll(filters)` — список шаблонов
- `getById(id)` — детали шаблона
- `create(data)` — создание
- `update(id, data)` — обновление
- `delete(id)` — удаление
- `getQuestions(templateId)` — вопросы шаблона

**disciplineTestRepository.ts:**
- `getByDisciplineId(disciplineId)` — тесты дисциплины
- `create(data)` — привязка теста
- `delete(id)` — отвязка

**testAssignmentRepository.ts:**
- `getByScheduleEventId(eventId)` — назначение по занятию
- `getByGroupId(groupId)` — назначения группы
- `create(data)` — создание назначения
- `update(id, data)` — обновление
- `getStudentAssignments(studentId)` — назначения студента

**testSessionRepository.ts:**
- `create(data)` — начало сессии
- `getById(id)` — детали сессии
- `update(id, data)` — обновление (ответы, статус)
- `finish(id, results)` — завершение теста
- `saveAnswer(sessionId, answer)` — сохранение ответа
- `calculateResults(sessionId)` — подсчёт результатов

---

### Этап 3: API endpoints (2 дня) ✅ ВЫПОЛНЕНО

**Банки вопросов:** ✅
- `GET /api/test-bank/banks` — список
- `POST /api/test-bank/banks` — создание
- `GET /api/test-bank/banks/[id]` — детали
- `PUT /api/test-bank/banks/[id]` — обновление
- `DELETE /api/test-bank/banks/[id]` — удаление
- `GET /api/test-bank/banks/categories` — категории
- `GET /api/test-bank/banks/select` — для выбора

**Вопросы:** ✅
- `GET /api/test-bank/questions?bank_id=...` — список
- `POST /api/test-bank/questions` — создание
- `GET /api/test-bank/questions/[id]` — детали
- `PUT /api/test-bank/questions/[id]` — обновление
- `DELETE /api/test-bank/questions/[id]` — удаление
- `POST /api/test-bank/questions/import` — импорт Excel
- `PUT /api/test-bank/questions/reorder` — изменение порядка

**Шаблоны тестов:** ✅
- `GET /api/test-bank/templates` — список
- `POST /api/test-bank/templates` — создание
- `GET /api/test-bank/templates/[id]` — детали
- `PUT /api/test-bank/templates/[id]` — обновление
- `DELETE /api/test-bank/templates/[id]` — удаление
- `PUT /api/test-bank/templates/[id]/questions` — вопросы шаблона
- `GET /api/test-bank/templates/select` — для выбора

**Привязка к дисциплинам:** ✅
- `GET /api/discipline-tests?discipline_id=...` — тесты дисциплины
- `POST /api/discipline-tests` — привязка
- `DELETE /api/discipline-tests/[id]` — отвязка

**Назначения:** ✅
- `POST /api/tests/assignments` — создание назначения
- `GET /api/tests/assignments/[id]` — детали
- `DELETE /api/tests/assignments/[id]` — удаление
- `GET /api/tests/assignments/[id]/results` — результаты
- `GET /api/tests/assignments/by-event/[eventId]` — по занятию

**Прохождение:** ✅
- `GET /api/tests/my` — мои тесты (студент)
- `POST /api/tests/sessions/start` — начать тест
- `GET /api/tests/sessions/[id]` — статус сессии
- `POST /api/tests/sessions/[id]/answer` — сохранить ответ
- `POST /api/tests/sessions/[id]/finish` — завершить
- `POST /api/tests/sessions/[id]/violation` — записать нарушение

---

### Этап 4: UI - Банк тестов (3 дня)

**Страницы:**
- `/test-bank/index.vue` — список банков
- `/test-bank/[id].vue` — редактор банка с вопросами
- `/test-bank/templates/index.vue` — список шаблонов
- `/test-bank/templates/[id].vue` — редактор шаблона

**Компоненты:**
- `QuestionBankCard.vue` — карточка банка
- `QuestionEditor.vue` — редактор вопроса
- `QuestionSingleChoice.vue` — тип single
- `TestTemplateEditor.vue` — редактор шаблона
- `ImportQuestionsModal.vue` — импорт Excel

---

### Этап 5: UI - Интеграция с дисциплинами (1 день)

**Модификация:**
- `/programs/[id].vue` — добавить раздел "Тесты" в дисциплину

**Компоненты:**
- `DisciplineTestsSection.vue` — управление тестами дисциплины

---

### Этап 6: UI - Интеграция с расписанием (1 день)

**Модификация:**
- `EventDetailModal.vue` — добавить выбор теста для assessment

**Логика:**
- При типе `assessment` → загрузить тесты дисциплины
- Показать выпадающий список
- При сохранении → создать `test_assignment`

---

### Этап 7: UI - Прохождение теста (3 дня)

**Страницы:**
- `/tests/my.vue` — мои тесты
- `/tests/take/[id].vue` — интерфейс прохождения

**Компоненты:**
- `TestTaker.vue` — основной компонент прохождения
- `TestTimer.vue` — таймер
- `TestProgress.vue` — прогресс-бар
- `TestProctoring.vue` — антипрокторинг
- `TestResults.vue` — результаты

**Функционал:**
- Таймер обратного отсчёта
- Навигация по вопросам
- Автосохранение ответов
- Блокировка переключения вкладок
- Подсчёт результатов

---

### Этап 8: PDF-генерация (2 дня)

**API:**
- `GET /api/tests/templates/[id]/export-pdf` — генерация бланков

**Функционал:**
- Генерация вариантов теста
- Бланки для печати
- Страница ввода результатов вручную

---

### Этап 9: Permissions и тестирование (1 день)

**Новые permissions:**
```typescript
enum Permission {
  // ...existing
  TEST_BANKS_VIEW = 'test_banks:view',
  TEST_BANKS_MANAGE = 'test_banks:manage',
  TEST_TEMPLATES_VIEW = 'test_templates:view',
  TEST_TEMPLATES_MANAGE = 'test_templates:manage',
  TESTS_ASSIGN = 'tests:assign',
  TESTS_TAKE = 'tests:take',
  TESTS_VIEW_RESULTS = 'tests:view_results',
}
```

**Распределение по ролям:**
- ADMIN: все permissions
- MANAGER: view + manage банков и шаблонов, assign
- TEACHER: assign, view_results
- STUDENT: take

---

## Технические детали

### Валидация ответов (single choice)

```typescript
function validateSingleChoice(question: Question, answer: Answer): boolean {
  const correctOption = question.options.options.find(o => o.correct);
  return answer.answer_data.selectedOption === correctOption.id;
}
```

### Подсчёт результатов

```typescript
function calculateResults(session: TestSession, answers: TestAnswer[]) {
  let totalPoints = 0;
  let maxPoints = 0;
  
  for (const answer of answers) {
    const question = getQuestion(answer.question_id);
    maxPoints += question.points;
    
    if (answer.is_correct) {
      totalPoints += answer.points_earned;
    }
  }
  
  const scorePercent = (totalPoints / maxPoints) * 100;
  const passed = scorePercent >= session.assignment.passing_score;
  const grade = Math.round(scorePercent);
  
  return { totalPoints, maxPoints, scorePercent, passed, grade };
}
```

### Антипрокторинг

```javascript
// Клиентская часть
window.addEventListener('blur', () => {
  if (proctoringEnabled) {
    recordViolation('tab_switch');
    showWarning('Переключение вкладок запрещено!');
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && proctoringEnabled) {
    recordViolation('visibility_change');
  }
});
```

---

## Мобильная адаптация

### Приоритеты:
1. Прохождение теста — полностью адаптивно
2. Просмотр результатов — адаптивно
3. Управление банками — desktop-first (можно на планшете)

### Особенности мобильной версии:
- Вопросы только по одному
- Увеличенные кнопки
- Упрощённая навигация
- Таймер всегда видим (sticky)

---

## Следующие шаги

1. Утверждение документации
2. Создание миграции (Этап 1)
3. Разработка репозиториев (Этап 2)
4. API endpoints (Этап 3)
5. UI реализация (Этапы 4-7)

**Готово к началу реализации!**
