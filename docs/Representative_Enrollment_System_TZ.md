# ТЕХНИЧЕСКОЕ ЗАДАНИЕ
## Модуль взаимодействия представителей организаций с системой обучения

**Версия:** 1.0  
**Дата:** 10.01.2026  
**Статус:** Детализированное ТЗ на основе анализа текущей архитектуры

---

## 📋 СОДЕРЖАНИЕ

1. [Общая информация](#1-общая-информация)
2. [Анализ текущего состояния](#2-анализ-текущего-состояния)
3. [Архитектура решения](#3-архитектура-решения)
4. [Модуль групп обучения](#4-модуль-групп-обучения)
5. [Система заявок](#5-система-заявок)
6. [Личный кабинет представителя](#6-личный-кабинет-представителя)
7. [Интеграция с Telegram-ботом](#7-интеграция-с-telegram-ботом)
8. [API Endpoints](#8-api-endpoints)
9. [База данных](#9-база-данных)
10. [Компоненты Frontend](#10-компоненты-frontend)
11. [План реализации](#11-план-реализации)
12. [Технические риски](#12-технические-риски)

---

## 1. ОБЩАЯ ИНФОРМАЦИЯ

### 1.1. Цель проекта

Создание веб-модуля для представителей организаций, который позволит:

- Просматривать анонсы планируемых учебных групп
- Подавать заявки на обучение сотрудников своей организации
- Отслеживать статус и историю поданных заявок

**Ключевая задача:** Заменить/дополнить текущий формат взаимодействия через Telegram и обеспечить централизованный, прозрачный и управляемый процесс подачи и обработки заявок.

### 1.2. Участники системы (роли)

| Роль | Описание | Существует в проекте |
|------|----------|---------------------|
| **ADMIN** | Полный доступ ко всем сущностям, настройкам и управлению заявками | ✅ Да (`UserRole.ADMIN`) |
| **MANAGER** | Рассмотрение и обработка заявок, управление группами | ✅ Да (`UserRole.MANAGER`) |
| **Представитель** | Просмотр анонсов групп, подача и управление заявками | ⚠️ Частично (Telegram-бот) |
| **STUDENT** | Слушатель курсов | ✅ Да (`UserRole.STUDENT`) |

---

## 2. АНАЛИЗ ТЕКУЩЕГО СОСТОЯНИЯ

### 2.1. Уже реализованный функционал

#### ✅ Система представителей (Telegram-бот)

**Текущая архитектура:**

```
Таблица: organization_representatives
├── id VARCHAR(191) PRIMARY KEY
├── organization_id VARCHAR(191) - связь с организацией
├── full_name VARCHAR(255)
├── phone VARCHAR(20)
├── telegram_chat_id BIGINT UNIQUE
├── telegram_username VARCHAR(100)
├── status ENUM('pending', 'approved', 'blocked')
├── access_groups JSON - доступ к группам
├── permissions JSON - разрешения
├── notifications_enabled BOOLEAN
├── can_receive_notifications BOOLEAN
├── approved_by VARCHAR(191) - кто одобрил
├── approved_at DATETIME
└── blocked_reason TEXT
```

**Репозиторий:** `server/repositories/representativeRepository.ts`

**Доступные методы:**
- `getRepresentativesPaginated()` - пагинированный список
- `getRepresentativeById()` - получение по ID
- `getRepresentativeByTelegramChatId()` - по Telegram ID
- `getRepresentativesByOrganization()` - по организации
- `getPendingRepresentatives()` - ожидающие одобрения
- `createRepresentative()` - создание
- `approveRepresentative()` - одобрение
- `blockRepresentative()` - блокировка
- `deleteRepresentative()` - удаление

**API Endpoints:**
- `GET /api/representatives` - список
- `GET /api/representatives/:id` - детали
- `GET /api/representatives/pending` - ожидающие
- `GET /api/representatives/stats` - статистика
- `POST /api/representatives/:id/approve` - одобрение
- `POST /api/representatives/:id/block` - блокировка
- `DELETE /api/representatives/:id` - удаление

**Frontend компоненты:**
- `RepresentativeManagementPanel.vue`
- `RepresentativeTable.vue`
- `RepresentativeDetailModal.vue`
- `ApproveRepresentativeModal.vue`
- `BlockRepresentativeModal.vue`

#### ✅ Система организаций

**Таблица:** `organizations`

```sql
├── id VARCHAR(191) PRIMARY KEY
├── code VARCHAR(100) UNIQUE - уникальный код
├── name VARCHAR(255)
├── short_name VARCHAR(100)
├── contact_phone VARCHAR(20)
├── contact_email VARCHAR(100)
├── address TEXT
├── description TEXT
├── is_active BOOLEAN
└── students_count INT - кэшированное количество
```

**Репозиторий:** `server/repositories/organizationRepository.ts`

#### ✅ Система групп обучения

**Таблица:** `study_groups`

```sql
├── id VARCHAR(191) PRIMARY KEY
├── code VARCHAR(50) UNIQUE - код группы
├── course_id VARCHAR(191) - ссылка на курс
├── start_date DATE
├── end_date DATE
├── classroom VARCHAR(100)
├── description TEXT
└── is_active BOOLEAN
```

**Репозиторий:** `server/repositories/groupRepository.ts`

**Связь групп со студентами:** `study_group_students`

#### ✅ Telegram-бот

**Сервис:** `server/services/telegramBotService.ts`

**Текущий функционал:**
- Регистрация представителей через FSM
- Команды: `/start`, `/status`, `/students`, `/schedule`, `/certificates`, `/help`
- Уведомления об одобрении/блокировке

#### ✅ Система разрешений

**Файл:** `app/types/permissions.ts`

```typescript
// Уже существующие разрешения для представителей
Permission.REPRESENTATIVES_VIEW = 'representatives:view'
Permission.REPRESENTATIVES_APPROVE = 'representatives:approve'
Permission.REPRESENTATIVES_BLOCK = 'representatives:block'
Permission.REPRESENTATIVES_MANAGE = 'representatives:manage'
```

### 2.2. Чего НЕ хватает для реализации ТЗ

| Функционал | Статус | Необходимые изменения |
|------------|--------|----------------------|
| Анонсы групп для представителей | ❌ Нет | Добавить статусы групп, флаги видимости |
| Подача заявок на обучение | ❌ Нет | Создать систему заявок |
| Загрузка PDF-файлов заявок | ❌ Нет | Интегрировать с файловой системой |
| Лимит мест в группах | ⚠️ Частично | Добавить поле max_capacity для групп |
| Статусы заявок | ❌ Нет | Новая таблица training_requests |
| История изменений заявок | ❌ Нет | Расширить activity_logs |
| Веб-интерфейс для представителей | ❌ Нет | Создать layout и страницы |

---

## 3. АРХИТЕКТУРА РЕШЕНИЯ

### 3.1. Общая схема

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Nuxt 3)                            │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  ADMIN/MANAGER   │  │  REPRESENTATIVE  │  │   TELEGRAM BOT   │  │
│  │  Layout          │  │  Layout (NEW)    │  │   Integration    │  │
│  │                  │  │                  │  │                  │  │
│  │  - Группы        │  │  - Анонсы групп  │  │  - /groups       │  │
│  │  - Заявки        │  │  - Мои заявки    │  │  - /apply        │  │
│  │  - Представители │  │  - Подать заявку │  │  - /status       │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API LAYER (H3)                              │
├─────────────────────────────────────────────────────────────────────┤
│  /api/training-requests/*     - Управление заявками                 │
│  /api/groups/*                - Расширенное управление группами     │
│  /api/representatives/*       - Управление представителями          │
│  /api/announcements/*         - Анонсы для представителей (NEW)     │
│  /api/telegram/*              - Telegram webhook                    │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      REPOSITORY LAYER                               │
├─────────────────────────────────────────────────────────────────────┤
│  trainingRequestRepository.ts   (NEW)                               │
│  groupRepository.ts             (EXTEND)                            │
│  representativeRepository.ts    (EXTEND)                            │
│  organizationRepository.ts      (EXISTS)                            │
│  fileRepository.ts              (EXISTS - для PDF)                  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        DATABASE (MySQL)                             │
├─────────────────────────────────────────────────────────────────────┤
│  study_groups        (EXTEND: статусы, лимиты)                      │
│  training_requests   (NEW)                                          │
│  request_employees   (NEW: сотрудники в заявке)                     │
│  request_history     (NEW: история изменений)                       │
│  files               (EXISTS: PDF-файлы заявок)                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2. Новая роль: REPRESENTATIVE ✅ ПОДТВЕРЖДЕНО

Представитель организации получает полноценный доступ к веб-интерфейсу через стандартную систему авторизации.

#### Изменения в UserRole

```typescript
// app/types/auth.ts
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  REPRESENTATIVE = 'REPRESENTATIVE', // NEW
}
```

#### Миграция для добавления роли

```sql
-- Миграция 20260110_045_add_representative_role.ts
ALTER TABLE users 
  MODIFY COLUMN role ENUM('ADMIN', 'MANAGER', 'TEACHER', 'STUDENT', 'REPRESENTATIVE') 
  NOT NULL DEFAULT 'STUDENT';

-- Добавить связь в organization_representatives
ALTER TABLE organization_representatives 
  ADD COLUMN user_id VARCHAR(191) NULL 
  COMMENT 'Связь с таблицей users для веб-авторизации';

ALTER TABLE organization_representatives 
  ADD CONSTRAINT fk_representatives_user 
  FOREIGN KEY (user_id) REFERENCES users(id) 
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX idx_representatives_user_id ON organization_representatives(user_id);
```

#### Логика авторизации

```
Telegram-бот регистрация → organization_representatives (status: pending)
           ↓
Админ одобряет заявку → Автоматически создаётся user с ролью REPRESENTATIVE
           ↓
Представитель получает:
  - Доступ к веб-интерфейсу (login/password)
  - Продолжает использовать Telegram-бот
```

#### Разрешения для REPRESENTATIVE

```typescript
// app/types/permissions.ts
[UserRole.REPRESENTATIVE]: [
  Permission.DASHBOARD_VIEW,
  
  // Анонсы групп
  Permission.GROUPS_VIEW,           // Просмотр анонсированных групп
  
  // Заявки
  Permission.REQUESTS_VIEW_OWN,     // NEW: Просмотр своих заявок
  Permission.REQUESTS_CREATE,       // NEW: Создание заявок
  Permission.REQUESTS_WITHDRAW,     // NEW: Отзыв своих заявок
  
  // Студенты своей организации
  Permission.STUDENTS_VIEW_ORG,     // NEW: Просмотр студентов своей организации
  
  // Расписание
  Permission.SCHEDULE_VIEW_ORG,     // NEW: Расписание студентов организации
  
  // Сертификаты
  Permission.CERTIFICATES_VIEW_ORG, // NEW: Сертификаты студентов организации
]
```

---

## 4. МОДУЛЬ ГРУПП ОБУЧЕНИЯ

### 4.1. Расширение таблицы study_groups

**Миграция:** `20260110_041_group_announcements.ts`

```sql
ALTER TABLE study_groups ADD COLUMN announcement_status 
  ENUM('draft', 'announced', 'closed') NOT NULL DEFAULT 'draft'
  COMMENT 'Статус анонса: черновик, анонсирован, закрыт для заявок';

ALTER TABLE study_groups ADD COLUMN max_capacity INT DEFAULT NULL
  COMMENT 'Максимальное количество слушателей (hard limit)';

ALTER TABLE study_groups ADD COLUMN current_accepted INT NOT NULL DEFAULT 0
  COMMENT 'Количество принятых через заявки';

ALTER TABLE study_groups ADD COLUMN is_visible_to_representatives BOOLEAN DEFAULT FALSE
  COMMENT 'Показывать представителям организаций';

ALTER TABLE study_groups ADD COLUMN accepts_requests BOOLEAN DEFAULT FALSE
  COMMENT 'Принимает заявки от представителей';

ALTER TABLE study_groups ADD COLUMN request_deadline DATE DEFAULT NULL
  COMMENT 'Крайний срок подачи заявок';

ALTER TABLE study_groups ADD COLUMN announcement_text TEXT DEFAULT NULL
  COMMENT 'Текст анонса для представителей';

-- Индексы для быстрого поиска анонсов
CREATE INDEX idx_announcement_status ON study_groups(announcement_status);
CREATE INDEX idx_visible_to_representatives ON study_groups(is_visible_to_representatives);
CREATE INDEX idx_accepts_requests ON study_groups(accepts_requests);
```

### 4.2. Расширение groupRepository.ts

```typescript
// Новые интерфейсы
export interface GroupAnnouncementSettings {
  announcementStatus: 'draft' | 'announced' | 'closed';
  maxCapacity: number | null;
  isVisibleToRepresentatives: boolean;
  acceptsRequests: boolean;
  requestDeadline: string | null;
  announcementText: string | null;
}

export interface AnnouncedGroup extends StudyGroup {
  availableSlots: number;
  announcementStatus: 'announced';
  acceptsRequests: boolean;
}

// Новые методы
export async function updateAnnouncementSettings(
  groupId: string, 
  settings: Partial<GroupAnnouncementSettings>
): Promise<StudyGroup | null>;

export async function getAnnouncedGroupsForRepresentatives(
  organizationId?: string
): Promise<AnnouncedGroup[]>;

export async function checkCapacityAvailable(
  groupId: string, 
  requestedSlots: number
): Promise<{ available: boolean; remainingSlots: number }>;

export async function incrementAcceptedCount(
  groupId: string, 
  count: number
): Promise<void>;

export async function closeGroupForRequests(groupId: string): Promise<void>;
```

### 4.3. Бизнес-логика группы

#### Статусы анонса

```
draft (черновик)
    │
    ▼ updateAnnouncementSettings({ announcementStatus: 'announced' })
announced (анонсирована)
    │
    ├── Представители видят группу
    ├── Могут подавать заявки (если acceptsRequests = true)
    │
    ▼ (max_capacity достигнут) ИЛИ (request_deadline истёк) ИЛИ (ручное закрытие)
closed (закрыта для заявок)
    │
    └── Группа продолжает работать, но заявки не принимаются
```

#### Автоматическое закрытие

При одобрении заявки:

```typescript
async function onRequestApproved(groupId: string, employeesCount: number) {
  await incrementAcceptedCount(groupId, employeesCount);
  
  const { available, remainingSlots } = await checkCapacityAvailable(groupId, 0);
  
  if (remainingSlots <= 0) {
    await closeGroupForRequests(groupId);
    await logActivity({
      actionType: 'UPDATE',
      entityType: 'GROUP',
      entityId: groupId,
      details: { action: 'auto_closed', reason: 'capacity_reached' }
    });
  }
}
```

---

## 5. СИСТЕМА ЗАЯВОК

### 5.1. Таблица training_requests ✅ ОБНОВЛЕНО

**Миграция:** `20260110_042_training_requests.ts`

**Ключевые изменения:**
- Добавлен статус `reserved` (забронировано) 
- Связь со студентами через `request_employees`
- Multi-select из существующего списка students

```sql
CREATE TABLE IF NOT EXISTS training_requests (
  id VARCHAR(191) PRIMARY KEY,
  
  -- Связи
  group_id VARCHAR(191) NOT NULL COMMENT 'Группа обучения',
  organization_id VARCHAR(191) NOT NULL COMMENT 'Организация-заявитель',
  representative_id VARCHAR(191) NOT NULL COMMENT 'Представитель, подавший заявку',
  
  -- Статус с БРОНИРОВАНИЕМ
  status ENUM(
    'pending',     -- На рассмотрении
    'reserved',    -- ЗАБРОНИРОВАНО (места зарезервированы, ожидает PDF и финального подтверждения)
    'approved',    -- Одобрена (сотрудники зачислены)
    'rejected',    -- Отклонена
    'withdrawn'    -- Отозвана представителем
  ) NOT NULL DEFAULT 'pending',
  
  -- Количество сотрудников (рассчитывается автоматически)
  employees_count INT NOT NULL DEFAULT 0 COMMENT 'Количество сотрудников в заявке',
  
  -- PDF-файл заявки (обязателен для финального одобрения)
  pdf_file_id INT UNSIGNED NULL COMMENT 'ID файла заявки в таблице files',
  
  -- Бронирование
  reserved_by VARCHAR(191) NULL COMMENT 'Кто забронировал места',
  reserved_at DATETIME(3) NULL COMMENT 'Когда забронировано',
  reservation_expires_at DATETIME(3) NULL COMMENT 'Срок действия брони (например, 3 дня)',
  
  -- Финальное решение
  decision_by VARCHAR(191) NULL COMMENT 'Кто принял финальное решение',
  decision_at DATETIME(3) NULL COMMENT 'Когда принято решение',
  rejection_reason TEXT NULL COMMENT 'Причина отклонения',
  
  -- Примечания
  representative_notes TEXT NULL COMMENT 'Примечания от представителя',
  admin_notes TEXT NULL COMMENT 'Внутренние заметки администратора',
  
  -- Метаданные
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  
  -- Индексы
  INDEX idx_group_id (group_id),
  INDEX idx_organization_id (organization_id),
  INDEX idx_representative_id (representative_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  INDEX idx_reservation_expires (reservation_expires_at),
  
  -- Внешние ключи
  CONSTRAINT fk_requests_group 
    FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE RESTRICT,
  CONSTRAINT fk_requests_organization 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_requests_representative 
    FOREIGN KEY (representative_id) REFERENCES organization_representatives(id) ON DELETE RESTRICT,
  CONSTRAINT fk_requests_reserved_by 
    FOREIGN KEY (reserved_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_requests_decision_by 
    FOREIGN KEY (decision_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 5.2. Таблица request_employees ✅ ОБЯЗАТЕЛЬНАЯ (Multi-Select из Students)

**Ключевая особенность:** Сотрудники выбираются из существующего списка `students` организации.

```sql
CREATE TABLE IF NOT EXISTS request_employees (
  id VARCHAR(191) PRIMARY KEY,
  request_id VARCHAR(191) NOT NULL,
  
  -- СВЯЗЬ С СУЩЕСТВУЮЩИМ СТУДЕНТОМ (обязательная)
  student_id VARCHAR(191) NOT NULL COMMENT 'Ссылка на существующего студента',
  
  -- Статус в заявке
  enrollment_status ENUM(
    'pending',      -- Ожидает зачисления
    'enrolled',     -- Зачислен в группу
    'removed'       -- Удалён из заявки
  ) NOT NULL DEFAULT 'pending',
  
  enrolled_at DATETIME(3) NULL COMMENT 'Когда зачислен в группу',
  
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  
  -- Уникальность: один студент может быть только в одной заявке на группу
  UNIQUE INDEX idx_request_student (request_id, student_id),
  INDEX idx_student_id (student_id),
  INDEX idx_enrollment_status (enrollment_status),
  
  CONSTRAINT fk_employees_request 
    FOREIGN KEY (request_id) REFERENCES training_requests(id) ON DELETE CASCADE,
  CONSTRAINT fk_employees_student 
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 5.3. Расширенный жизненный цикл заявки (с бронированием)

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                        ПОДАЧА ЗАЯВКИ ПРЕДСТАВИТЕЛЕМ                           │
│                                                                               │
│  1. Представитель выбирает группу                                             │
│  2. Multi-select студентов своей организации (из таблицы students)            │
│  3. Добавляет примечания (опционально)                                        │
│  4. Отправляет заявку                                                         │
└──────────────────────────────────┬────────────────────────────────────────────┘
                                   │
                                   ▼
                        ┌──────────────────┐
                        │     PENDING      │
                        │  На рассмотрении │
                        └────────┬─────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
          ▼                      ▼                      ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│    RESERVED      │   │    REJECTED      │   │   WITHDRAWN      │
│   Забронировано  │   │    Отклонена     │   │    Отозвана      │
│                  │   │                  │   │  представителем  │
│ • Места забронир.│   │ • Указана причина│   │                  │
│ • Бронь на 3 дня │   │ • Уведомление    │   │                  │
│ • Ожидает PDF    │   │                  │   │                  │
└────────┬─────────┘   └──────────────────┘   └──────────────────┘
         │
         │ Представитель загружает PDF
         │ (подписанная заявка от руководства)
         │
         ▼
┌──────────────────┐
│    APPROVED      │
│    Одобрена      │
│                  │
│ • PDF проверен   │
│ • Студенты       │
│   зачислены      │
│ • Уведомления    │
└──────────────────┘

⚠️ АВТОМАТИЧЕСКАЯ ОТМЕНА БРОНИ:
   Если PDF не загружен в течение срока брони (reservation_expires_at),
   заявка автоматически переводится в статус 'withdrawn' (истекла)
```

### 5.4. Логика счётчиков мест

```typescript
// study_groups - расширенная структура
interface StudyGroupExtended {
  // ... existing fields ...
  
  maxCapacity: number;          // Максимум слушателей (hard limit)
  currentEnrolled: number;      // Уже зачислены (из study_group_students)
  reservedSlots: number;        // Забронировано (сумма employees_count где status='reserved')
  
  // Вычисляемые поля
  availableSlots: number;       // = maxCapacity - currentEnrolled - reservedSlots
  totalPending: number;         // Количество pending заявок
}

// При создании заявки
async function createRequest(data: CreateRequestInput): Promise<TrainingRequest> {
  // 1. Проверяем доступные места
  const group = await getGroupById(data.groupId);
  const requestedCount = data.studentIds.length;
  
  if (group.availableSlots < requestedCount) {
    throw new Error(`Недостаточно мест. Доступно: ${group.availableSlots}`);
  }
  
  // 2. Создаём заявку со статусом pending
  // ...
}

// При бронировании (admin/manager)
async function reserveRequest(
  requestId: string, 
  reservedBy: string,
  expiresInDays: number = 3
): Promise<TrainingRequest> {
  const request = await getRequestById(requestId);
  const group = await getGroupById(request.groupId);
  
  // Проверяем доступные места (с учётом уже забронированных)
  if (group.availableSlots < request.employeesCount) {
    throw new Error('Недостаточно свободных мест для бронирования');
  }
  
  // Обновляем статус
  await updateRequest(requestId, {
    status: 'reserved',
    reservedBy,
    reservedAt: new Date(),
    reservationExpiresAt: addDays(new Date(), expiresInDays),
  });
  
  // Увеличиваем счётчик забронированных мест в группе
  await incrementReservedSlots(request.groupId, request.employeesCount);
  
  // Уведомляем представителя
  await notifyRepresentativeAboutReservation(request);
  
  return getRequestById(requestId);
}

// При одобрении (после загрузки PDF)
async function approveRequest(
  requestId: string,
  approvedBy: string
): Promise<TrainingRequest> {
  const request = await getRequestById(requestId);
  
  // Проверяем что PDF загружен
  if (!request.pdfFileId) {
    throw new Error('PDF-файл заявки не загружен');
  }
  
  // Зачисляем студентов в группу
  const employees = await getRequestEmployees(requestId);
  for (const emp of employees) {
    await addStudentToGroup(request.groupId, emp.studentId);
    await updateEmployeeStatus(emp.id, 'enrolled');
  }
  
  // Переносим места из reserved в enrolled
  await decrementReservedSlots(request.groupId, request.employeesCount);
  // (enrolled обновится автоматически через триггер или вычисление)
  
  // Обновляем статус
  await updateRequest(requestId, {
    status: 'approved',
    decisionBy: approvedBy,
    decisionAt: new Date(),
  });
  
  // Уведомления
  await notifyRepresentativeAboutApproval(request);
  
  // Проверяем не заполнена ли группа
  const updatedGroup = await getGroupById(request.groupId);
  if (updatedGroup.availableSlots <= 0) {
    await closeGroupForRequests(request.groupId);
  }
  
  return getRequestById(requestId);
}
```

### 5.5. Таблица request_history (Аудит)

```sql
CREATE TABLE IF NOT EXISTS request_history (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  request_id VARCHAR(191) NOT NULL,
  action ENUM(
    'created',           -- Заявка создана
    'employees_updated', -- Изменён список сотрудников
    'reserved',          -- Места забронированы
    'pdf_uploaded',      -- PDF загружен
    'approved',          -- Заявка одобрена
    'rejected',          -- Заявка отклонена
    'withdrawn',         -- Заявка отозвана
    'expired',           -- Бронь истекла
    'note_added'         -- Добавлено примечание
  ) NOT NULL,
  performed_by VARCHAR(191) NULL COMMENT 'Кто выполнил действие',
  performed_by_type ENUM('admin', 'manager', 'representative', 'system') NOT NULL,
  old_status VARCHAR(50) NULL,
  new_status VARCHAR(50) NULL,
  details JSON NULL COMMENT 'Дополнительные данные (например, список добавленных сотрудников)',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  
  INDEX idx_request_id (request_id),
  INDEX idx_created_at (created_at),
  
  CONSTRAINT fk_history_request 
    FOREIGN KEY (request_id) REFERENCES training_requests(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 5.4. Репозиторий trainingRequestRepository.ts

```typescript
// ============================================================================
// ТИПЫ
// ============================================================================

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';

export interface TrainingRequest {
  id: string;
  groupId: string;
  organizationId: string;
  representativeId: string;
  status: RequestStatus;
  employeesCount: number;
  pdfFileId: number | null;
  pdfFileUrl?: string;
  decisionBy: string | null;
  decisionByName?: string;
  decisionAt: Date | null;
  rejectionReason: string | null;
  representativeNotes: string | null;
  adminNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  
  // Joined data
  group?: {
    id: string;
    code: string;
    courseName: string;
    startDate: string;
    endDate: string;
  };
  organization?: {
    id: string;
    name: string;
  };
  representative?: {
    id: string;
    fullName: string;
    phone: string;
  };
}

export interface CreateRequestInput {
  groupId: string;
  organizationId: string;
  representativeId: string;
  employeesCount: number;
  pdfFileId?: number;
  representativeNotes?: string;
  employees?: Array<{
    fullName: string;
    position?: string;
    pinfl?: string;
  }>;
}

export interface RequestFilters {
  status?: RequestStatus;
  groupId?: string;
  organizationId?: string;
  representativeId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

// ============================================================================
// МЕТОДЫ
// ============================================================================

// Создание заявки
export async function createRequest(
  data: CreateRequestInput
): Promise<TrainingRequest>;

// Получение заявок с пагинацией
export async function getRequestsPaginated(
  params: { page?: number; limit?: number; filters?: RequestFilters }
): Promise<PaginatedResult<TrainingRequest>>;

// Получение заявки по ID
export async function getRequestById(
  id: string
): Promise<TrainingRequest | null>;

// Получение заявок представителя
export async function getRepresentativeRequests(
  representativeId: string,
  filters?: { status?: RequestStatus }
): Promise<TrainingRequest[]>;

// Получение заявок по группе
export async function getRequestsByGroup(
  groupId: string,
  status?: RequestStatus
): Promise<TrainingRequest[]>;

// Одобрение заявки
export async function approveRequest(
  id: string,
  approvedBy: string,
  adminNotes?: string
): Promise<TrainingRequest | null>;

// Отклонение заявки
export async function rejectRequest(
  id: string,
  rejectedBy: string,
  reason: string
): Promise<TrainingRequest | null>;

// Отзыв заявки представителем
export async function withdrawRequest(
  id: string
): Promise<TrainingRequest | null>;

// Загрузка PDF-файла к заявке
export async function attachPdfToRequest(
  requestId: string,
  fileId: number
): Promise<void>;

// Проверка возможности подачи заявки
export async function canSubmitRequest(
  representativeId: string,
  groupId: string
): Promise<{ allowed: boolean; reason?: string }>;

// История заявки
export async function getRequestHistory(
  requestId: string
): Promise<RequestHistoryEntry[]>;

// Статистика заявок
export async function getRequestsStats(): Promise<{
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  withdrawn: number;
}>;
```

### 5.5. Бизнес-логика заявок

#### Жизненный цикл заявки

```
                    ┌─────────────────────────────────────────┐
                    │      Представитель подаёт заявку        │
                    └────────────────────┬────────────────────┘
                                         │
                                         ▼
                              ┌──────────────────┐
                              │    PENDING       │
                              │  На рассмотрении │
                              └────────┬─────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
           ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
           │    APPROVED    │ │   REJECTED     │ │   WITHDRAWN    │
           │    Одобрена    │ │   Отклонена    │ │    Отозвана    │
           └───────┬────────┘ └────────────────┘ └────────────────┘
                   │
                   ▼
           ┌────────────────────────────────────────────────────┐
           │  Автоматическое зачисление сотрудников в группу    │
           │  + Обновление счётчика current_accepted в группе   │
           │  + Уведомление представителю                       │
           │  + Если лимит достигнут → закрытие группы          │
           └────────────────────────────────────────────────────┘
```

#### Валидации при создании

```typescript
async function validateRequestCreation(data: CreateRequestInput): Promise<void> {
  // 1. Проверить существование группы
  const group = await getGroupById(data.groupId);
  if (!group) throw new Error('Группа не найдена');
  
  // 2. Проверить что группа принимает заявки
  if (!group.acceptsRequests) {
    throw new Error('Группа не принимает заявки');
  }
  
  // 3. Проверить что группа анонсирована
  if (group.announcementStatus !== 'announced') {
    throw new Error('Группа недоступна для заявок');
  }
  
  // 4. Проверить дедлайн
  if (group.requestDeadline && new Date(group.requestDeadline) < new Date()) {
    throw new Error('Срок подачи заявок истёк');
  }
  
  // 5. Проверить лимит мест
  if (group.maxCapacity) {
    const available = group.maxCapacity - group.currentAccepted;
    if (data.employeesCount > available) {
      throw new Error(`Недостаточно мест. Доступно: ${available}`);
    }
  }
  
  // 6. Проверить что нет дублирующей заявки
  const existing = await getRequestsByGroup(data.groupId);
  const hasDuplicate = existing.some(r => 
    r.organizationId === data.organizationId && 
    r.status === 'pending'
  );
  if (hasDuplicate) {
    throw new Error('От этой организации уже есть активная заявка');
  }
  
  // 7. Проверить статус представителя
  const representative = await getRepresentativeById(data.representativeId);
  if (!representative || representative.status !== 'approved') {
    throw new Error('Представитель не авторизован');
  }
}
```

---

## 6. ЛИЧНЫЙ КАБИНЕТ ПРЕДСТАВИТЕЛЯ

### 6.1. Новый Layout

**Файл:** `app/layouts/representative.vue`

```vue
<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-900">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 shadow">
      <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div class="flex items-center gap-4">
          <img src="/logo.svg" alt="Logo" class="h-8" />
          <span class="font-semibold text-lg">Личный кабинет представителя</span>
        </div>
        <div class="flex items-center gap-4">
          <span>{{ organization?.name }}</span>
          <UserDropdown />
        </div>
      </div>
    </header>
    
    <!-- Navigation -->
    <nav class="bg-white dark:bg-gray-800 border-b">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex gap-8">
          <NuxtLink to="/representative" class="nav-link">
            Анонсы групп
          </NuxtLink>
          <NuxtLink to="/representative/requests" class="nav-link">
            Мои заявки
          </NuxtLink>
          <NuxtLink to="/representative/students" class="nav-link">
            Наши слушатели
          </NuxtLink>
        </div>
      </div>
    </nav>
    
    <!-- Content -->
    <main class="max-w-7xl mx-auto px-4 py-8">
      <slot />
    </main>
  </div>
</template>
```

### 6.2. Страницы

#### Страница анонсов групп
**Путь:** `app/pages/representative/index.vue`

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         📚 Анонсы учебных групп                         │
├─────────────────────────────────────────────────────────────────────────┤
│  Фильтры: [По курсу ▼]  [По дате ▼]  [Только открытые ☑]               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  ПК-2026-001                                                    │   │
│  │  📖 Повышение квалификации бухгалтеров                          │   │
│  │  📅 15.01.2026 - 30.01.2026                                     │   │
│  │  👥 Свободных мест: 12 из 20                                    │   │
│  │  ⏰ Приём заявок до: 10.01.2026                                 │   │
│  │                                                                  │   │
│  │  [📝 Подать заявку]  [Подробнее →]                              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  ПП-2026-002                                                    │   │
│  │  📖 Профессиональная переподготовка менеджеров                  │   │
│  │  📅 01.02.2026 - 28.02.2026                                     │   │
│  │  👥 Свободных мест: 5 из 15                                     │   │
│  │  ⚠️ Осталось мало мест!                                         │   │
│  │                                                                  │   │
│  │  [📝 Подать заявку]  [Подробнее →]                              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Страница подачи заявки ✅ ОБНОВЛЕНО: Multi-Select сотрудников
**Путь:** `app/pages/representative/apply/[groupId].vue`

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    📝 Подача заявки на обучение                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Группа: ПК-2026-001                                                   │
│  Курс: Повышение квалификации бухгалтеров                               │
│  Даты: 15.01.2026 - 30.01.2026                                          │
│  Свободных мест: 12                                                     │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  👥 ВЫБЕРИТЕ СОТРУДНИКОВ (из списка вашей организации):                │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  🔍 Поиск сотрудников...                                          │ │
│  ├───────────────────────────────────────────────────────────────────┤ │
│  │  ☑ Иванов Иван Иванович        │ Главный бухгалтер              │ │
│  │  ☑ Петрова Мария Сергеевна     │ Бухгалтер                      │ │
│  │  ☑ Сидоров Петр Николаевич     │ Экономист                      │ │
│  │  ☐ Козлов Андрей Викторович    │ Финансист                      │ │
│  │  ☐ Николаева Елена Александр..│ Кассир                         │ │
│  │  ☐ ... (ещё 15 сотрудников)                                      │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  Выбрано: 3 сотрудника                                  [Удалить всех] │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  📎 PDF-файл заявки (опционально, можно загрузить позже):              │
│     [Выбрать файл]                                                      │
│     ℹ️ PDF с подписью руководства потребуется для финального            │
│        подтверждения после бронирования мест                            │
│                                                                         │
│  Примечания:                                                            │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ Дополнительная информация к заявке...                             │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│                                                                         │
│  [❌ Отмена]                                    [✅ Отправить заявку]   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Компонент Multi-Select сотрудников
**Файл:** `app/components/representative/EmployeeMultiSelect.vue`

```vue
<template>
  <div class="employee-multi-select">
    <!-- Поиск -->
    <div class="search-box">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Поиск сотрудников по ФИО, должности..."
        class="search-input"
      />
    </div>
    
    <!-- Список сотрудников -->
    <div class="employees-list">
      <label
        v-for="employee in filteredEmployees"
        :key="employee.id"
        class="employee-item"
        :class="{ 
          'selected': isSelected(employee.id),
          'disabled': isDisabled(employee.id)
        }"
      >
        <input
          type="checkbox"
          :value="employee.id"
          v-model="selectedIds"
          :disabled="isDisabled(employee.id)"
        />
        <div class="employee-info">
          <span class="employee-name">{{ employee.fullName }}</span>
          <span class="employee-position">{{ employee.position }}</span>
        </div>
        <span v-if="isDisabled(employee.id)" class="warning-badge">
          Уже в группе
        </span>
      </label>
      
      <div v-if="filteredEmployees.length === 0" class="no-results">
        Сотрудники не найдены
      </div>
    </div>
    
    <!-- Выбранное количество -->
    <div class="selection-summary">
      <span>Выбрано: {{ selectedIds.length }} сотрудника</span>
      <button 
        v-if="selectedIds.length > 0" 
        @click="clearSelection"
        class="clear-btn"
      >
        Очистить
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  organizationId: { type: String, required: true },
  groupId: { type: String, required: true },
  maxSelection: { type: Number, default: null },
  modelValue: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue'])

const searchQuery = ref('')
const allEmployees = ref([])
const alreadyInGroup = ref([])

// Загрузка сотрудников организации
const { data: employees } = await useFetch(
  `/api/organizations/${props.organizationId}/students`
)

// Загрузка списка уже зачисленных в группу
const { data: enrolled } = await useFetch(
  `/api/groups/${props.groupId}/students`
)

// Фильтрация
const filteredEmployees = computed(() => {
  if (!searchQuery.value) return employees.value || []
  const q = searchQuery.value.toLowerCase()
  return (employees.value || []).filter(e =>
    e.fullName.toLowerCase().includes(q) ||
    e.position?.toLowerCase().includes(q)
  )
})

// Выбранные ID
const selectedIds = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// Проверка: уже в группе
const isDisabled = (id) => (enrolled.value || []).some(s => s.id === id)
const isSelected = (id) => selectedIds.value.includes(id)

const clearSelection = () => {
  emit('update:modelValue', [])
}
</script>
```

#### Страница "Мои заявки" ✅ ОБНОВЛЕНО: с БРОНИРОВАНИЕМ
**Путь:** `app/pages/representative/requests/index.vue`

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           📋 Мои заявки                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  Фильтр: [Все ▼]  [Ожидают]  [Забронированы]  [Одобрены]  [Отклонены]  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┬────────────────┬──────────────┬────────┬──────────────┬───────────┐ │
│  │ Группа         │ Курс         │ Чел.   │ Статус       │ Действия  │ │
│  ┼────────────────┼──────────────┼────────┼──────────────┼───────────┤ │
│  │ ПК-2026-001    │ Повышение... │   5    │ 🟡 Ожидает   │ [Отозвать]│ │
│  ┼────────────────┼──────────────┼────────┼──────────────┼───────────┤ │
│  │ ПП-2026-003    │ Переподгот...│   3    │ 🔵 Забронир. │ [Загрузить│ │
│  │                │              │        │ ⏰ до 13.01  │    PDF]   │ │
│  ┼────────────────┼──────────────┼────────┼──────────────┼───────────┤ │
│  │ ПП-2025-015    │ Переподгот...│   3    │ ✅ Одобрена  │ [Детали]  │ │
│  ┼────────────────┼──────────────┼────────┼──────────────┼───────────┤ │
│  │ ПК-2025-022    │ Повышение... │   2    │ ❌ Отклонена │ [Детали]  │ │
│  │                │              │        │ Причина: ... │           │ │
│  ┴────────────────┴──────────────┴────────┴──────────────┴───────────┘ │
│                                                                         │
│  Легенда статусов:                                                      │
│  🟡 Ожидает - заявка на рассмотрении                                   │
│  🔵 Забронировано - места зарезервированы, ожидает PDF                 │
│  ✅ Одобрена - сотрудники зачислены в группу                           │
│  ❌ Отклонена - заявка отклонена с указанием причины                   │
│                                                                         │
│  Пагинация: [ < ] [ 1 ] [ 2 ] [ 3 ] [ > ]                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.3. Компоненты

```
app/components/representative/
├── AnnouncedGroupCard.vue         # Карточка анонсированной группы
├── RequestForm.vue                # Форма подачи заявки
├── RequestsList.vue               # Список заявок
├── RequestStatusBadge.vue         # Бейдж статуса заявки
├── RequestDetailModal.vue         # Детали заявки
├── OrganizationStudentsList.vue   # Слушатели организации
└── PdfUploader.vue                # Компонент загрузки PDF
```

---

## 7. ИНТЕГРАЦИЯ С TELEGRAM-БОТОМ

### 7.1. Новые команды

| Команда | Описание | Статус доступа |
|---------|----------|----------------|
| `/groups` | Список анонсированных групп | Только одобренные |
| `/apply` | Начать подачу заявки | Только одобренные |
| `/requests` | Мои заявки и их статусы | Только одобренные |

### 7.2. FSM для подачи заявки через бот

```typescript
// Новые состояния FSM
type SessionState = 
  | 'idle'
  | 'awaiting_name'
  | 'awaiting_phone'
  | 'awaiting_organization'
  | 'pending_approval'
  // Новые состояния для заявок
  | 'selecting_group'       // Выбор группы
  | 'entering_employees'    // Ввод количества сотрудников
  | 'confirming_request';   // Подтверждение заявки
```

### 7.3. Расширение telegramBotService.ts

```typescript
// Новые команды
async function commandGroups(chatId: string): Promise<void> {
  const representative = await getRepresentativeByTelegramChatId(chatId);
  
  if (!representative || representative.status !== 'approved') {
    await sendMessage(chatId, '⚠️ Команда доступна только авторизованным представителям');
    return;
  }
  
  const groups = await getAnnouncedGroupsForRepresentatives(representative.organizationId);
  
  if (groups.length === 0) {
    await sendMessage(chatId, '📭 Нет доступных групп для подачи заявок');
    return;
  }
  
  // Формируем сообщение с inline-кнопками
  let message = '📚 *Доступные группы для обучения:*\n\n';
  
  const buttons = [];
  for (const group of groups) {
    message += `*${group.code}*\n`;
    message += `📖 ${group.course?.name}\n`;
    message += `📅 ${formatDate(group.startDate)} - ${formatDate(group.endDate)}\n`;
    message += `👥 Свободных мест: ${group.availableSlots}\n\n`;
    
    buttons.push([{
      text: `📝 Подать заявку: ${group.code}`,
      callback_data: `apply_${group.id}`
    }]);
  }
  
  await sendMessageWithInlineKeyboard(chatId, message, buttons);
}

async function commandRequests(chatId: string): Promise<void> {
  const representative = await getRepresentativeByTelegramChatId(chatId);
  
  if (!representative || representative.status !== 'approved') {
    await sendMessage(chatId, '⚠️ Команда доступна только авторизованным представителям');
    return;
  }
  
  const requests = await getRepresentativeRequests(representative.id);
  
  if (requests.length === 0) {
    await sendMessage(chatId, '📭 У вас пока нет заявок');
    return;
  }
  
  let message = '📋 *Ваши заявки:*\n\n';
  
  for (const request of requests) {
    const statusEmoji = getStatusEmoji(request.status);
    message += `${statusEmoji} *${request.group?.code}*\n`;
    message += `└ Сотрудников: ${request.employeesCount}\n`;
    message += `└ Подана: ${formatDate(request.createdAt)}\n`;
    
    if (request.status === 'rejected' && request.rejectionReason) {
      message += `└ Причина: ${request.rejectionReason}\n`;
    }
    
    message += '\n';
  }
  
  await sendMessage(chatId, message);
}

function getStatusEmoji(status: RequestStatus): string {
  switch (status) {
    case 'pending': return '🟡';
    case 'approved': return '✅';
    case 'rejected': return '❌';
    case 'withdrawn': return '↩️';
    default: return '⚪';
  }
}
```

### 7.4. Уведомления

Расширение `notificationService.ts`:

```typescript
// Уведомления о заявках

export async function notifyRepresentativeAboutRequestApproval(
  request: TrainingRequest
): Promise<void> {
  const representative = await getRepresentativeById(request.representativeId);
  if (!representative?.telegramChatId || !representative.notificationsEnabled) {
    return;
  }
  
  const message = 
    `✅ *Ваша заявка одобрена!*\n\n` +
    `Группа: ${request.group?.code}\n` +
    `Курс: ${request.group?.courseName}\n` +
    `Сотрудников: ${request.employeesCount}\n` +
    `Даты обучения: ${formatDate(request.group?.startDate)} - ${formatDate(request.group?.endDate)}\n\n` +
    `Подробности в личном кабинете.`;
  
  await sendMessage(representative.telegramChatId, message);
}

export async function notifyRepresentativeAboutRequestRejection(
  request: TrainingRequest
): Promise<void> {
  const representative = await getRepresentativeById(request.representativeId);
  if (!representative?.telegramChatId || !representative.notificationsEnabled) {
    return;
  }
  
  const message = 
    `❌ *Ваша заявка отклонена*\n\n` +
    `Группа: ${request.group?.code}\n` +
    `Причина: ${request.rejectionReason || 'Не указана'}\n\n` +
    `Вы можете подать новую заявку.`;
  
  await sendMessage(representative.telegramChatId, message);
}

export async function notifyAdminsAboutNewRequest(
  request: TrainingRequest
): Promise<void> {
  const adminChatIds = process.env.TELEGRAM_ADMIN_CHAT_IDS?.split(',') || [];
  
  for (const chatId of adminChatIds) {
    const message = 
      `📩 *Новая заявка на обучение*\n\n` +
      `Организация: ${request.organization?.name}\n` +
      `Группа: ${request.group?.code}\n` +
      `Сотрудников: ${request.employeesCount}\n` +
      `Подана: ${formatDate(request.createdAt)}`;
    
    await sendMessage(chatId.trim(), message);
  }
}
```

---

## 8. API ENDPOINTS

### 8.1. Новые endpoints для заявок

```
server/api/training-requests/
├── index.get.ts        # GET /api/training-requests - список (admin/manager)
├── index.post.ts       # POST /api/training-requests - создание (representative)
├── [id].get.ts         # GET /api/training-requests/:id - детали
├── [id]/
│   ├── approve.post.ts # POST /api/training-requests/:id/approve
│   ├── reject.post.ts  # POST /api/training-requests/:id/reject
│   ├── withdraw.post.ts# POST /api/training-requests/:id/withdraw (representative)
│   ├── history.get.ts  # GET /api/training-requests/:id/history
│   └── pdf.post.ts     # POST /api/training-requests/:id/pdf - загрузка файла
├── my.get.ts           # GET /api/training-requests/my (representative)
└── stats.get.ts        # GET /api/training-requests/stats
```

### 8.2. Расширение endpoints групп

```
server/api/groups/
├── ...existing...
├── [id]/
│   ├── ...existing...
│   ├── announcement.patch.ts  # PATCH /api/groups/:id/announcement
│   ├── requests.get.ts        # GET /api/groups/:id/requests
│   └── close-requests.post.ts # POST /api/groups/:id/close-requests
└── announced.get.ts           # GET /api/groups/announced (для представителей)
```

### 8.3. Примеры API

#### POST /api/training-requests

**Доступ:** Представитель (approved)

```typescript
// Request
{
  groupId: "550e8400-e29b-41d4-a716-446655440000",
  employeesCount: 5,
  representativeNotes: "3 бухгалтера и 2 экономиста"
}

// Response
{
  success: true,
  request: {
    id: "...",
    status: "pending",
    employeesCount: 5,
    group: { code: "ПК-2026-001", ... },
    createdAt: "2026-01-10T12:00:00Z"
  }
}
```

#### PATCH /api/groups/:id/announcement

**Доступ:** ADMIN, MANAGER

```typescript
// Request
{
  announcementStatus: "announced",
  maxCapacity: 20,
  isVisibleToRepresentatives: true,
  acceptsRequests: true,
  requestDeadline: "2026-01-15",
  announcementText: "Открыт набор на курс повышения квалификации..."
}

// Response
{
  success: true,
  group: { ... }
}
```

---

## 9. БАЗА ДАННЫХ

### 9.1. Миграции (порядок применения)

```
20260110_041_group_announcements.ts      # Расширение study_groups
20260110_042_training_requests.ts        # Таблица заявок
20260110_043_request_employees.ts        # Сотрудники в заявках (опц.)
20260110_044_request_history.ts          # История изменений
20260110_045_representative_user_link.ts # Связь с users (опц.)
```

### 9.2. Индексы и производительность

```sql
-- Для быстрого поиска анонсов
CREATE INDEX idx_groups_announcement_status 
  ON study_groups(announcement_status);
  
CREATE INDEX idx_groups_visible_accepts 
  ON study_groups(is_visible_to_representatives, accepts_requests);

-- Для быстрого поиска заявок
CREATE INDEX idx_requests_status_created 
  ON training_requests(status, created_at DESC);
  
CREATE INDEX idx_requests_representative_status 
  ON training_requests(representative_id, status);

-- Для истории
CREATE INDEX idx_history_request_created 
  ON request_history(request_id, created_at DESC);
```

---

## 10. КОМПОНЕНТЫ FRONTEND

### 10.1. Admin/Manager Panel

**Расширение страницы групп:**

```
app/components/groups/
├── ...existing...
├── GroupAnnouncementSettings.vue  # Настройки анонса
├── GroupRequestsPanel.vue         # Панель заявок группы
└── GroupCapacityIndicator.vue     # Индикатор заполненности
```

**Новая страница заявок:**

```
app/pages/admin/requests/
├── index.vue                      # Все заявки
└── [id].vue                       # Детали заявки

app/components/requests/
├── RequestsManagementPanel.vue    # Панель управления
├── RequestsTable.vue              # Таблица заявок
├── RequestDetailModal.vue         # Детали заявки (admin)
├── ApproveRequestModal.vue        # Модальное одобрения
├── RejectRequestModal.vue         # Модальное отклонения
├── RequestStatusBadge.vue         # Бейдж статуса
├── RequestFilters.vue             # Фильтры
└── PdfViewer.vue                  # Просмотр PDF
```

### 10.2. Representative Portal

```
app/pages/representative/
├── index.vue                      # Анонсы групп
├── apply/
│   └── [groupId].vue              # Форма подачи заявки
├── requests/
│   ├── index.vue                  # Список моих заявок
│   └── [id].vue                   # Детали заявки
└── students.vue                   # Слушатели организации

app/components/representative/
├── AnnouncedGroupCard.vue         # Карточка группы
├── AnnouncedGroupsList.vue        # Список групп
├── RequestForm.vue                # Форма заявки
├── RequestCard.vue                # Карточка заявки
├── RequestsList.vue               # Список заявок
├── RequestStatusTimeline.vue      # Timeline статусов
├── PdfUploader.vue                # Загрузка PDF
└── OrganizationHeader.vue         # Шапка с орг-ацией
```

---

## 11. ПЛАН РЕАЛИЗАЦИИ

### Этап 1: База данных и репозитории (2-3 дня)

- [ ] Миграция 041: расширение study_groups
- [ ] Миграция 042: таблица training_requests
- [ ] Миграция 043: таблица request_history
- [ ] Расширение groupRepository.ts
- [ ] Создание trainingRequestRepository.ts

### Этап 2: API endpoints (2-3 дня)

- [ ] API для заявок (CRUD + approve/reject)
- [ ] API для анонсов групп
- [ ] Расширение API групп

### Этап 3: Admin Panel (3-4 дня)

- [ ] Компоненты настройки анонсов
- [ ] Страница управления заявками
- [ ] Модальные окна (approve/reject)
- [ ] Фильтры и поиск

### Этап 4: Representative Portal (4-5 дней)

- [ ] Layout представителя
- [ ] Страница анонсов
- [ ] Форма подачи заявки
- [ ] Страница "Мои заявки"
- [ ] Загрузка PDF

### Этап 5: Telegram Bot (2-3 дня)

- [ ] Команды /groups, /apply, /requests
- [ ] FSM для подачи заявки
- [ ] Уведомления о заявках

### Этап 6: Тестирование и документация (2 дня)

- [ ] Тестирование сценариев
- [ ] Документация API
- [ ] Инструкция для представителей

**Общая оценка:** 15-20 рабочих дней

---

## 12. ТЕХНИЧЕСКИЕ РИСКИ

### 12.1. Риски и митигация

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Конфликты при одновременной подаче заявок | Средняя | Высокое | Использовать транзакции и row-level locking |
| Нагрузка на БД при большом количестве заявок | Низкая | Среднее | Правильные индексы, пагинация |
| Потеря PDF-файлов | Низкая | Высокое | Резервное копирование, S3 storage |
| Спам заявками | Средняя | Среднее | Rate limiting, проверка статуса представителя |
| Конфликт с существующим Telegram-ботом | Низкая | Среднее | Модульная архитектура сервиса |

### 12.2. Вопросы для уточнения ✅ РЕШЕНО

1. **Авторизация представителей в веб-интерфейсе:** ✅
   - **Решение:** Добавить новую роль `REPRESENTATIVE` в таблицу `users`
   - При одобрении представителя автоматически создаётся учётная запись

2. **Сотрудники в заявке:** ✅
   - **Решение:** Multi-select из существующего списка `students` организации
   - Не ручной ввод, а выбор из уже импортированных сотрудников

3. **Бронирование мест:** ✅
   - **Решение:** Добавлен статус `reserved` (забронировано)
   - Бронь действует 3 дня, в течение которых нужно загрузить PDF
   - После загрузки PDF — финальное одобрение

4. **Автоматическое зачисление:**
   - При статусе `approved` студенты автоматически добавляются в `study_group_students`

5. **Multi-organization представители:**
   - На данном этапе: один представитель = одна организация
   - При необходимости можно расширить позже

---

## 📝 ПРИМЕЧАНИЯ

### Совместимость с существующим кодом

Данное ТЗ разработано с учётом:

1. **Существующей архитектуры репозиториев** - все новые репозитории следуют тем же паттернам
2. **Системы разрешений** - новые permissions добавляются в существующий enum
3. **Telegram-бота** - расширение, а не замена текущего функционала
4. **Файловой системы** - использование существующей таблицы files
5. **Activity logs** - все действия логируются в существующую систему

### Переиспользование компонентов

По правилам проекта (minimum.md), будут переиспользованы:
- Существующие UI-компоненты (Button, Modal, Table, etc.)
- Компоненты форм (Input, Select, FileUploader)
- Компоненты уведомлений
- Паттерны пагинации и фильтрации

### Новые компоненты (уникальные для этого модуля)

| Компонент | Назначение |
|-----------|------------|
| `EmployeeMultiSelect.vue` | Multi-select сотрудников организации |
| `RequestStatusBadge.vue` | Бейдж статуса заявки с цветовой индикацией |
| `RequestStatusTimeline.vue` | Timeline истории изменений заявки |
| `AnnouncedGroupCard.vue` | Карточка анонсированной группы |
| `ReservationCountdown.vue` | Обратный отсчёт до истечения брони |

---

*Документ подготовлен на основе анализа кодовой базы проекта nuxt-tailadmin и исходного ТЗ.*
*Обновлено: 10.01.2026 с учётом уточнений заказчика.*

