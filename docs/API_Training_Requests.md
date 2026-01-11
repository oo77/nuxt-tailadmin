# API Endpoints для системы заявок на обучение

## Этап 2: Реализованные API endpoints

### 1. API для заявок на обучение (`/api/training-requests`)

| Метод | Endpoint | Доступ | Описание |
|-------|----------|--------|----------|
| `GET` | `/api/training-requests` | ADMIN, MANAGER | Список всех заявок с пагинацией и фильтрами |
| `POST` | `/api/training-requests` | REPRESENTATIVE | Создание новой заявки на обучение |
| `GET` | `/api/training-requests/:id` | ADMIN, MANAGER, REPRESENTATIVE (владелец) | Детальная информация о заявке |
| `GET` | `/api/training-requests/my` | REPRESENTATIVE | Список своих заявок (представителя) |
| `GET` | `/api/training-requests/stats` | ADMIN, MANAGER | Статистика заявок |
| `POST` | `/api/training-requests/:id/reserve` | ADMIN, MANAGER | Бронирование мест (pending → reserved) |
| `POST` | `/api/training-requests/:id/approve` | ADMIN, MANAGER | Одобрение заявки (reserved → approved) |
| `POST` | `/api/training-requests/:id/reject` | ADMIN, MANAGER | Отклонение заявки |
| `POST` | `/api/training-requests/:id/withdraw` | REPRESENTATIVE (владелец) | Отзыв заявки |
| `GET` | `/api/training-requests/:id/history` | ADMIN, MANAGER, REPRESENTATIVE (владелец) | История изменений заявки |
| `POST` | `/api/training-requests/:id/pdf` | REPRESENTATIVE (владелец) | Загрузка PDF-файла заявки |

### 2. Расширение API групп (`/api/groups`)

| Метод | Endpoint | Доступ | Описание |
|-------|----------|--------|----------|
| `GET` | `/api/groups/announced` | REPRESENTATIVE, ADMIN, MANAGER | Список анонсированных групп |
| `PATCH` | `/api/groups/:id/announcement` | ADMIN, MANAGER | Обновление настроек анонса группы |
| `GET` | `/api/groups/:id/requests` | ADMIN, MANAGER | Список заявок на конкретную группу |
| `POST` | `/api/groups/:id/close-requests` | ADMIN, MANAGER | Закрытие группы для заявок |

---

## Жизненный цикл заявки

```
ПОДАЧА ЗАЯВКИ (REPRESENTATIVE)
        │
        ▼
    ┌────────┐
    │PENDING │  ← На рассмотрении
    └───┬────┘
        │
   ┌────┼────┬────────────────┐
   │    │    │                │
   ▼    ▼    ▼                ▼
RESERVED REJECTED        WITHDRAWN
   │     (отклонена)     (отозвана)
   │
   ▼ (PDF загружен)
APPROVED
   │
   └── Студенты зачислены в группу
```

---

## Параметры запросов

### GET /api/training-requests

Query параметры:
- `page` (number) - номер страницы (по умолчанию: 1)
- `limit` (number) - количество на странице (по умолчанию: 20, макс: 100)
- `status` (string) - фильтр по статусу: `pending`, `reserved`, `approved`, `rejected`, `withdrawn`
- `groupId` (string) - фильтр по ID группы
- `organizationId` (string) - фильтр по ID организации
- `representativeId` (string) - фильтр по ID представителя
- `dateFrom` (string) - дата создания от (YYYY-MM-DD)
- `dateTo` (string) - дата создания до (YYYY-MM-DD)
- `search` (string) - поиск по организации, коду группы, имени представителя

### POST /api/training-requests

Body:
```json
{
  "groupId": "uuid",
  "studentIds": ["student-uuid-1", "student-uuid-2"],
  "representativeNotes": "Дополнительная информация (опционально)"
}
```

### POST /api/training-requests/:id/reserve

Body:
```json
{
  "expiresInDays": 3  // По умолчанию: 3 дня
}
```

### POST /api/training-requests/:id/reject

Body:
```json
{
  "reason": "Причина отклонения"  // Обязательно
}
```

### PATCH /api/groups/:id/announcement

Body:
```json
{
  "announcementStatus": "announced",      // draft | announced | closed
  "maxCapacity": 20,                      // Максимум слушателей
  "isVisibleToRepresentatives": true,     // Видна представителям
  "acceptsRequests": true,                 // Принимает заявки
  "requestDeadline": "2026-01-15",        // Дедлайн подачи заявок
  "announcementText": "Текст анонса..."   // Описание для представителей
}
```

---

## Структура файлов

```
server/api/training-requests/
├── index.get.ts        # GET - список заявок
├── index.post.ts       # POST - создание заявки
├── [id].get.ts         # GET - детали заявки
├── my.get.ts           # GET - мои заявки (representative)
├── stats.get.ts        # GET - статистика
└── [id]/
    ├── approve.post.ts  # POST - одобрение
    ├── reserve.post.ts  # POST - бронирование
    ├── reject.post.ts   # POST - отклонение
    ├── withdraw.post.ts # POST - отзыв
    ├── history.get.ts   # GET - история
    └── pdf.post.ts      # POST - загрузка PDF

server/api/groups/
├── announced.get.ts              # GET - анонсированные группы
└── [id]/
    ├── announcement.patch.ts     # PATCH - настройки анонса
    ├── requests.get.ts           # GET - заявки на группу
    └── close-requests.post.ts    # POST - закрытие группы
```

---

## Добавленные разрешения (Permission)

### Для серверных типов (`server/types/permissions.ts`)

```typescript
// Training Requests
REQUESTS_VIEW = 'requests:view',
REQUESTS_VIEW_OWN = 'requests:view_own',
REQUESTS_CREATE = 'requests:create',
REQUESTS_APPROVE = 'requests:approve',
REQUESTS_REJECT = 'requests:reject',
REQUESTS_WITHDRAW = 'requests:withdraw',
REQUESTS_MANAGE = 'requests:manage',

// Representative Specific
STUDENTS_VIEW_ORG = 'students:view_org',
SCHEDULE_VIEW_ORG = 'schedule:view_org',
CERTIFICATES_VIEW_ORG = 'certificates:view_org',
GROUPS_VIEW_ANNOUNCED = 'groups:view_announced',
GROUPS_MANAGE_ANNOUNCEMENTS = 'groups:manage_announcements',
```

### Маппинг ролей

**MANAGER** получил дополнительные права:
- `REQUESTS_VIEW` - просмотр всех заявок
- `REQUESTS_APPROVE` - одобрение/бронирование
- `REQUESTS_REJECT` - отклонение
- `GROUPS_MANAGE_ANNOUNCEMENTS` - управление анонсами

**REPRESENTATIVE** (новая роль) получил:
- `GROUPS_VIEW`, `GROUPS_VIEW_ANNOUNCED` - просмотр групп/анонсов
- `REQUESTS_VIEW_OWN`, `REQUESTS_CREATE`, `REQUESTS_WITHDRAW` - работа с заявками
- `STUDENTS_VIEW_ORG`, `SCHEDULE_VIEW_ORG`, `CERTIFICATES_VIEW_ORG` - данные своей организации
- `FILES_VIEW`, `FILES_UPLOAD` - работа с файлами

---

## Добавленные типы действий (`server/types/activityLog.ts`)

```typescript
type ActionType = 
  | ... // существующие
  | 'UPLOAD'         // Загрузка файла
  | 'RESERVE'        // Бронирование
  | 'WITHDRAW'       // Отзыв

type EntityType = 
  | ... // существующие
  | 'TRAINING_REQUEST'  // Заявка на обучение
```

---

## Следующие шаги (Этап 3)

1. **Frontend компоненты для личного кабинета представителя**:
   - Страница анонсов групп
   - Форма подачи заявки с multi-select сотрудников
   - Список и детали своих заявок

2. **Административные компоненты**:
   - Панель управления заявками
   - Настройки анонсов для групп
   - Статистика заявок
