# Техническое задание: Система объявлений о наборе на обучение

## Концепция

Система объявлений — это отдельный модуль, предназначенный для публикации информации о планируемом обучении и приёма заявок от представителей организаций. Объявления **не являются частью** страниц учебных групп и управляются независимо.

### Ключевые принципы:

1. **Разделение ответственности**: Учебные группы остаются учебными сущностями, объявления — точкой входа для организаций
2. **Централизация**: Все заявки, PDF-документы и бронирования управляются через объявления
3. **Гибкость**: Одно объявление может включать несколько учебных групп
4. **Масштабируемость**: Легко добавлять новые типы объявлений и заявок

---

## Этап 1: База данных

### 1.1. Таблица `announcements` (Объявления)

```sql
CREATE TABLE announcements (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  announcement_type ENUM('single_group', 'multiple_groups', 'program') DEFAULT 'single_group',
  
  -- Статус объявления
  status ENUM('draft', 'published', 'closed', 'archived') DEFAULT 'draft',
  
  -- Даты
  published_at DATETIME,
  deadline DATETIME,
  start_date DATE,
  end_date DATE,
  
  -- Настройки приёма заявок
  accepts_requests BOOLEAN DEFAULT true,
  requires_employee_list BOOLEAN DEFAULT false,
  allows_reservation BOOLEAN DEFAULT true,
  max_total_capacity INT,
  
  -- Дополнительная информация
  requirements TEXT,
  contact_info TEXT,
  
  -- Метаданные
  created_by VARCHAR(36),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_published_at (published_at),
  INDEX idx_deadline (deadline)
);
```

### 1.2. Таблица `announcement_groups` (Связь объявлений и групп)

```sql
CREATE TABLE announcement_groups (
  id VARCHAR(36) PRIMARY KEY,
  announcement_id VARCHAR(36) NOT NULL,
  group_id VARCHAR(36) NOT NULL,
  
  -- Настройки для конкретной группы в объявлении
  max_capacity INT,
  current_reserved INT DEFAULT 0,
  display_order INT DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE CASCADE,
  UNIQUE KEY unique_announcement_group (announcement_id, group_id),
  INDEX idx_announcement (announcement_id),
  INDEX idx_group (group_id)
);
```

### 1.3. Таблица `announcement_requests` (Заявки на объявления)

```sql
CREATE TABLE announcement_requests (
  id VARCHAR(36) PRIMARY KEY,
  announcement_id VARCHAR(36) NOT NULL,
  organization_id VARCHAR(36) NOT NULL,
  representative_id VARCHAR(36) NOT NULL,
  
  -- Статус заявки
  status ENUM('draft', 'pending', 'approved', 'rejected', 'cancelled') DEFAULT 'draft',
  
  -- Тип заявки
  request_type ENUM('with_employees', 'reservation') DEFAULT 'with_employees',
  
  -- Общая информация
  total_requested_slots INT DEFAULT 0,
  comment TEXT,
  
  -- PDF документ
  pdf_file_path VARCHAR(500),
  pdf_uploaded_at DATETIME,
  
  -- Статусы и даты
  submitted_at DATETIME,
  reviewed_at DATETIME,
  reviewed_by VARCHAR(36),
  rejection_reason TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (representative_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  
  INDEX idx_announcement (announcement_id),
  INDEX idx_organization (organization_id),
  INDEX idx_status (status),
  INDEX idx_submitted (submitted_at)
);
```

### 1.4. Таблица `announcement_request_groups` (Группы в заявке)

```sql
CREATE TABLE announcement_request_groups (
  id VARCHAR(36) PRIMARY KEY,
  request_id VARCHAR(36) NOT NULL,
  announcement_group_id VARCHAR(36) NOT NULL,
  
  -- Количество мест
  requested_slots INT DEFAULT 0,
  reserved_slots INT DEFAULT 0,
  
  -- Статус для конкретной группы
  status ENUM('pending', 'approved', 'rejected', 'waitlist') DEFAULT 'pending',
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (request_id) REFERENCES announcement_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (announcement_group_id) REFERENCES announcement_groups(id) ON DELETE CASCADE,
  UNIQUE KEY unique_request_group (request_id, announcement_group_id),
  INDEX idx_request (request_id)
);
```

### 1.5. Таблица `announcement_request_employees` (Сотрудники в заявке)

```sql
CREATE TABLE announcement_request_employees (
  id VARCHAR(36) PRIMARY KEY,
  request_group_id VARCHAR(36) NOT NULL,
  student_id VARCHAR(36) NOT NULL,
  
  -- Статус сотрудника
  status ENUM('proposed', 'confirmed', 'enrolled', 'rejected') DEFAULT 'proposed',
  
  -- Дополнительная информация
  notes TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (request_group_id) REFERENCES announcement_request_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY unique_request_student (request_group_id, student_id),
  INDEX idx_request_group (request_group_id),
  INDEX idx_student (student_id)
);
```

### 1.6. Таблица `announcement_history` (История изменений)

```sql
CREATE TABLE announcement_history (
  id VARCHAR(36) PRIMARY KEY,
  announcement_id VARCHAR(36),
  request_id VARCHAR(36),
  
  action VARCHAR(100) NOT NULL,
  actor_id VARCHAR(36),
  details JSON,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
  FOREIGN KEY (request_id) REFERENCES announcement_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_announcement (announcement_id),
  INDEX idx_request (request_id),
  INDEX idx_created (created_at)
);
```

---

## Этап 2: Права доступа

### 2.1. Новые разрешения

```typescript
// app/types/permissions.ts

export enum Permission {
  // ... существующие разрешения
  
  // Объявления
  ANNOUNCEMENTS_VIEW = 'announcements:view',
  ANNOUNCEMENTS_CREATE = 'announcements:create',
  ANNOUNCEMENTS_EDIT = 'announcements:edit',
  ANNOUNCEMENTS_DELETE = 'announcements:delete',
  ANNOUNCEMENTS_PUBLISH = 'announcements:publish',
  
  // Заявки на объявления
  ANNOUNCEMENT_REQUESTS_VIEW_ALL = 'announcement_requests:view_all',
  ANNOUNCEMENT_REQUESTS_REVIEW = 'announcement_requests:review',
  ANNOUNCEMENT_REQUESTS_APPROVE = 'announcement_requests:approve',
  
  // Представители (существующие, но уточнённые)
  REPRESENTATIVE_VIEW_ANNOUNCEMENTS = 'representative:view_announcements',
  REPRESENTATIVE_SUBMIT_REQUESTS = 'representative:submit_requests',
  REPRESENTATIVE_VIEW_OWN_REQUESTS = 'representative:view_own_requests',
}
```

### 2.2. Распределение прав по ролям

```typescript
const rolePermissions: Record<UserRole, Permission[]> = {
  ADMIN: [
    // Все разрешения на объявления
    Permission.ANNOUNCEMENTS_VIEW,
    Permission.ANNOUNCEMENTS_CREATE,
    Permission.ANNOUNCEMENTS_EDIT,
    Permission.ANNOUNCEMENTS_DELETE,
    Permission.ANNOUNCEMENTS_PUBLISH,
    Permission.ANNOUNCEMENT_REQUESTS_VIEW_ALL,
    Permission.ANNOUNCEMENT_REQUESTS_REVIEW,
    Permission.ANNOUNCEMENT_REQUESTS_APPROVE,
  ],
  
  MANAGER: [
    Permission.ANNOUNCEMENTS_VIEW,
    Permission.ANNOUNCEMENTS_CREATE,
    Permission.ANNOUNCEMENTS_EDIT,
    Permission.ANNOUNCEMENTS_PUBLISH,
    Permission.ANNOUNCEMENT_REQUESTS_VIEW_ALL,
    Permission.ANNOUNCEMENT_REQUESTS_REVIEW,
    Permission.ANNOUNCEMENT_REQUESTS_APPROVE,
  ],
  
  REPRESENTATIVE: [
    Permission.REPRESENTATIVE_VIEW_ANNOUNCEMENTS,
    Permission.REPRESENTATIVE_SUBMIT_REQUESTS,
    Permission.REPRESENTATIVE_VIEW_OWN_REQUESTS,
  ],
  
  // ... остальные роли
};
```

---

## Этап 3: Backend API

### 3.1. Объявления

#### GET `/api/announcements`
Получить список объявлений с фильтрацией

**Query параметры:**
- `status` - фильтр по статусу
- `page`, `limit` - пагинация
- `search` - поиск по названию

**Response:**
```typescript
{
  success: boolean;
  data: Announcement[];
  total: number;
  page: number;
  totalPages: number;
}
```

#### GET `/api/announcements/:id`
Получить детальную информацию об объявлении

**Response:**
```typescript
{
  success: boolean;
  announcement: {
    id: string;
    title: string;
    description: string;
    status: string;
    groups: AnnouncementGroup[];
    stats: {
      totalRequests: number;
      pendingRequests: number;
      approvedRequests: number;
      totalReservedSlots: number;
    };
  };
}
```

#### POST `/api/announcements`
Создать новое объявление

**Body:**
```typescript
{
  title: string;
  description?: string;
  announcementType: 'single_group' | 'multiple_groups' | 'program';
  groupIds: string[];
  deadline?: string;
  startDate?: string;
  endDate?: string;
  acceptsRequests: boolean;
  requiresEmployeeList: boolean;
  allowsReservation: boolean;
  maxTotalCapacity?: number;
  requirements?: string;
  contactInfo?: string;
}
```

#### PUT `/api/announcements/:id`
Обновить объявление

#### PATCH `/api/announcements/:id/publish`
Опубликовать объявление

#### PATCH `/api/announcements/:id/close`
Закрыть объявление для приёма заявок

#### DELETE `/api/announcements/:id`
Удалить объявление

### 3.2. Заявки

#### GET `/api/announcements/:id/requests`
Получить заявки по объявлению

**Query параметры:**
- `status` - фильтр по статусу
- `organizationId` - фильтр по организации

#### POST `/api/announcements/:id/requests`
Создать заявку (для представителей)

**Body:**
```typescript
{
  requestType: 'with_employees' | 'reservation';
  groups: Array<{
    announcementGroupId: string;
    requestedSlots: number;
    employeeIds?: string[]; // Если requestType === 'with_employees'
  }>;
  comment?: string;
  pdfFile: File; // Обязательный PDF
}
```

#### GET `/api/requests/:id`
Получить детальную информацию о заявке

#### PATCH `/api/requests/:id/approve`
Одобрить заявку

#### PATCH `/api/requests/:id/reject`
Отклонить заявку

**Body:**
```typescript
{
  rejectionReason: string;
}
```

#### PUT `/api/requests/:id/employees`
Обновить список сотрудников в заявке

### 3.3. Для представителей

#### GET `/api/representative/announcements`
Получить опубликованные объявления (для представителей)

#### GET `/api/representative/requests`
Получить свои заявки

---

## Этап 4: Frontend компоненты

### 4.1. Административная панель

#### Страница `/announcements`
Список всех объявлений

**Компоненты:**
- `AnnouncementList.vue` - таблица объявлений
- `AnnouncementFilters.vue` - фильтры
- `AnnouncementFormModal.vue` - создание/редактирование

#### Страница `/announcements/:id`
Детальная информация об объявлении

**Разделы:**
1. Информация об объявлении
2. Связанные группы с индикаторами заполненности
3. Список заявок с фильтрацией
4. Статистика

**Компоненты:**
- `AnnouncementHeader.vue`
- `AnnouncementGroups.vue`
- `AnnouncementRequests.vue`
- `AnnouncementStats.vue`
- `RequestDetailModal.vue`
- `RequestReviewModal.vue`

### 4.2. Интерфейс представителя

#### Страница `/representative/announcements`
Список доступных объявлений

**Компоненты:**
- `PublicAnnouncementCard.vue`
- `AnnouncementDetailModal.vue`

#### Страница `/representative/announcements/:id/apply`
Подача заявки на объявление

**Компоненты:**
- `RequestForm.vue`
- `GroupSelector.vue`
- `EmployeeSelector.vue` (мультиселект из студентов организации)
- `PdfUploader.vue`

#### Страница `/representative/requests`
Мои заявки

**Компоненты:**
- `MyRequestsList.vue`
- `RequestStatusBadge.vue`
- `RequestDetailModal.vue`

---

## Этап 5: Миграция данных

### 5.1. Удаление старых полей из `study_groups`

Удалить поля, связанные с объявлениями:
- `announcement_status`
- `max_capacity`
- `current_reserved`
- `is_visible_to_representatives`
- `accepts_requests`
- `request_deadline`
- `announcement_text`

### 5.2. Миграция существующих данных

Если есть группы с настройками анонса:
1. Создать объявления для каждой такой группы
2. Перенести настройки в новую структуру
3. Обновить связи

---

## Этап 6: Workflow системы

### 6.1. Создание объявления (Администратор)

1. Администратор создаёт объявление
2. Выбирает одну или несколько учебных групп
3. Настраивает параметры приёма заявок
4. Публикует объявление

### 6.2. Подача заявки (Представитель)

**Вариант А: Со списком сотрудников**
1. Представитель просматривает опубликованные объявления
2. Выбирает объявление
3. Для каждой группы выбирает сотрудников из своей организации
4. Загружает PDF-файл заявки
5. Отправляет заявку

**Вариант Б: Бронирование мест**
1. Представитель выбирает объявление
2. Указывает количество мест для каждой группы
3. Загружает PDF-файл заявки
4. Отправляет заявку
5. Позже уточняет список сотрудников

### 6.3. Обработка заявки (Администратор)

1. Администратор видит новую заявку
2. Просматривает детали, PDF-документ
3. Проверяет доступность мест
4. Одобряет или отклоняет заявку
5. При одобрении:
   - Резервируются места в группах
   - Если указаны сотрудники — они могут быть зачислены
   - Представитель получает уведомление

---

## Этап 7: Валидация и бизнес-правила

### 7.1. Валидация объявлений

- Нельзя опубликовать объявление без групп
- Deadline не может быть в прошлом
- Если `requiresEmployeeList = true`, то `allowsReservation = false`

### 7.2. Валидация заявок

- PDF-файл обязателен
- Нельзя запросить больше мест, чем доступно
- Если `requiresEmployeeList = true`, список сотрудников обязателен
- Сотрудники должны принадлежать организации представителя

### 7.3. Автоматические действия

- При закрытии объявления все pending заявки переходят в rejected
- При удалении группы из объявления связанные заявки обновляются
- При одобрении заявки резервируются места

---

## Этап 8: Уведомления

### 8.1. Для представителей

- Новое объявление опубликовано
- Заявка одобрена
- Заявка отклонена
- Приближается deadline объявления

### 8.2. Для администраторов

- Новая заявка поступила
- Заявка требует рассмотрения
- Объявление заполнено

---

## Приоритеты реализации

### Фаза 1 (MVP)
1. База данных и миграции
2. Backend API для объявлений
3. Backend API для заявок
4. Административный интерфейс для объявлений
5. Интерфейс представителя для просмотра и подачи заявок

### Фаза 2
1. Расширенная статистика
2. Экспорт данных
3. Уведомления
4. История изменений

### Фаза 3
1. Шаблоны объявлений
2. Массовые операции
3. Интеграция с внешними системами
4. Аналитика и отчёты
