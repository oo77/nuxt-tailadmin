---
description: Реализация системы объявлений о наборе на обучение
---

# Workflow: Реализация системы объявлений

Этот workflow описывает пошаговую реализацию новой системы объявлений согласно ТЗ в `docs/Announcements_System_TZ.md`.

## Предварительные действия

1. **Ознакомиться с ТЗ**
   - Прочитать `docs/Announcements_System_TZ.md`
   - Понять концепцию разделения объявлений и учебных групп

2. **Создать ветку для разработки**
   ```bash
   git checkout -b feature/announcements-system
   ```

## Этап 1: База данных (Приоритет: Высокий)

### 1.1. Создать миграции для новых таблиц

**Файлы для создания:**
- `server/database/migrations/20260111_050_announcements.ts`
- `server/database/migrations/20260111_051_announcement_groups.ts`
- `server/database/migrations/20260111_052_announcement_requests.ts`
- `server/database/migrations/20260111_053_announcement_request_groups.ts`
- `server/database/migrations/20260111_054_announcement_request_employees.ts`
- `server/database/migrations/20260111_055_announcement_history.ts`

**Действия:**
1. Создать миграцию для таблицы `announcements`
2. Создать миграцию для таблицы `announcement_groups`
3. Создать миграцию для таблицы `announcement_requests`
4. Создать миграцию для таблицы `announcement_request_groups`
5. Создать миграцию для таблицы `announcement_request_employees`
6. Создать миграцию для таблицы `announcement_history`

### 1.2. Создать миграцию для удаления старых полей

**Файл:** `server/database/migrations/20260111_056_remove_group_announcement_fields.ts`

**Действия:**
1. Удалить поля из `study_groups`:
   - `announcement_status`
   - `max_capacity`
   - `current_reserved`
   - `is_visible_to_representatives`
   - `accepts_requests`
   - `request_deadline`
   - `announcement_text`

### 1.3. Применить миграции

```bash
npm run db:migrate
```

### 1.4. Проверить структуру БД

```bash
npm run db:status
```

## Этап 2: TypeScript типы (Приоритет: Высокий)

### 2.1. Создать типы для объявлений

**Файл:** `app/types/announcement.ts`

**Типы для создания:**
```typescript
export type AnnouncementStatus = 'draft' | 'published' | 'closed' | 'archived';
export type AnnouncementType = 'single_group' | 'multiple_groups' | 'program';
export type RequestStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';
export type RequestType = 'with_employees' | 'reservation';

export interface Announcement {
  id: string;
  title: string;
  description?: string;
  announcementType: AnnouncementType;
  status: AnnouncementStatus;
  // ... остальные поля
}

export interface AnnouncementGroup {
  id: string;
  announcementId: string;
  groupId: string;
  maxCapacity?: number;
  currentReserved: number;
  // ... остальные поля
}

export interface AnnouncementRequest {
  id: string;
  announcementId: string;
  organizationId: string;
  representativeId: string;
  status: RequestStatus;
  requestType: RequestType;
  // ... остальные поля
}
```

### 2.2. Обновить типы разрешений

**Файл:** `app/types/permissions.ts`

**Добавить новые разрешения:**
- `ANNOUNCEMENTS_VIEW`
- `ANNOUNCEMENTS_CREATE`
- `ANNOUNCEMENTS_EDIT`
- `ANNOUNCEMENTS_DELETE`
- `ANNOUNCEMENTS_PUBLISH`
- `ANNOUNCEMENT_REQUESTS_VIEW_ALL`
- `ANNOUNCEMENT_REQUESTS_REVIEW`
- `ANNOUNCEMENT_REQUESTS_APPROVE`

### 2.3. Обновить распределение прав

**Файл:** `server/utils/permissions.ts`

Добавить новые разрешения для ролей ADMIN, MANAGER, REPRESENTATIVE.

## Этап 3: Backend репозитории (Приоритет: Высокий)

### 3.1. Создать репозиторий объявлений

**Файл:** `server/repositories/announcementRepository.ts`

**Функции для реализации:**
- `getAnnouncements(params)` - список с пагинацией
- `getAnnouncementById(id)` - детальная информация
- `createAnnouncement(data)` - создание
- `updateAnnouncement(id, data)` - обновление
- `deleteAnnouncement(id)` - удаление
- `publishAnnouncement(id)` - публикация
- `closeAnnouncement(id)` - закрытие
- `getAnnouncementStats(id)` - статистика

### 3.2. Создать репозиторий заявок

**Файл:** `server/repositories/announcementRequestRepository.ts`

**Функции для реализации:**
- `getRequestsByAnnouncement(announcementId, filters)` - заявки по объявлению
- `getRequestById(id)` - детальная информация
- `createRequest(data)` - создание заявки
- `updateRequest(id, data)` - обновление
- `approveRequest(id, reviewerId)` - одобрение
- `rejectRequest(id, reviewerId, reason)` - отклонение
- `getRequestsByOrganization(orgId)` - заявки организации
- `updateRequestEmployees(requestGroupId, employeeIds)` - обновление списка сотрудников

## Этап 4: Backend API endpoints (Приоритет: Высокий)

### 4.1. API для объявлений (Администраторы)

**Создать файлы:**
- `server/api/announcements/index.get.ts` - список объявлений
- `server/api/announcements/index.post.ts` - создание
- `server/api/announcements/[id].get.ts` - детали
- `server/api/announcements/[id].put.ts` - обновление
- `server/api/announcements/[id].delete.ts` - удаление
- `server/api/announcements/[id]/publish.patch.ts` - публикация
- `server/api/announcements/[id]/close.patch.ts` - закрытие
- `server/api/announcements/[id]/requests.get.ts` - заявки по объявлению

### 4.2. API для заявок (Администраторы)

**Создать файлы:**
- `server/api/requests/[id].get.ts` - детали заявки
- `server/api/requests/[id]/approve.patch.ts` - одобрение
- `server/api/requests/[id]/reject.patch.ts` - отклонение
- `server/api/requests/[id]/employees.put.ts` - обновление сотрудников

### 4.3. API для представителей

**Создать файлы:**
- `server/api/representative/announcements.get.ts` - опубликованные объявления
- `server/api/representative/announcements/[id].get.ts` - детали объявления
- `server/api/representative/announcements/[id]/apply.post.ts` - подача заявки
- `server/api/representative/requests.get.ts` - мои заявки
- `server/api/representative/requests/[id].get.ts` - детали моей заявки

## Этап 5: Frontend компоненты (Приоритет: Средний)

### 5.1. Административные компоненты

**Создать компоненты:**
- `app/components/announcements/AnnouncementList.vue` - список объявлений
- `app/components/announcements/AnnouncementCard.vue` - карточка объявления
- `app/components/announcements/AnnouncementFormModal.vue` - форма создания/редактирования
- `app/components/announcements/AnnouncementFilters.vue` - фильтры
- `app/components/announcements/AnnouncementStatusBadge.vue` - бейдж статуса
- `app/components/announcements/AnnouncementGroups.vue` - список групп в объявлении
- `app/components/announcements/AnnouncementRequests.vue` - список заявок
- `app/components/announcements/AnnouncementStats.vue` - статистика
- `app/components/announcements/RequestDetailModal.vue` - детали заявки
- `app/components/announcements/RequestReviewModal.vue` - рассмотрение заявки

### 5.2. Компоненты для представителей

**Создать компоненты:**
- `app/components/representative/PublicAnnouncementCard.vue` - карточка объявления
- `app/components/representative/AnnouncementDetailModal.vue` - детали объявления
- `app/components/representative/RequestForm.vue` - форма заявки
- `app/components/representative/GroupSelector.vue` - выбор групп
- `app/components/representative/EmployeeMultiSelect.vue` - выбор сотрудников
- `app/components/representative/PdfUploader.vue` - загрузка PDF
- `app/components/representative/MyRequestsList.vue` - мои заявки
- `app/components/representative/RequestStatusBadge.vue` - статус заявки

## Этап 6: Frontend страницы (Приоритет: Средний)

### 6.1. Административные страницы

**Создать страницы:**
- `app/pages/announcements/index.vue` - список объявлений
- `app/pages/announcements/[id]/index.vue` - детали объявления

### 6.2. Страницы представителя

**Создать страницы:**
- `app/pages/representative/announcements/index.vue` - доступные объявления
- `app/pages/representative/announcements/[id]/apply.vue` - подача заявки
- `app/pages/representative/requests/index.vue` - мои заявки

### 6.3. Обновить навигацию

**Файлы для обновления:**
- `app/layouts/default.vue` - добавить пункт меню "Объявления"
- `app/layouts/representative.vue` - добавить пункты меню

## Этап 7: Composables и утилиты (Приоритет: Средний)

### 7.1. Создать composables

**Создать файлы:**
- `app/composables/useAnnouncements.ts` - работа с объявлениями
- `app/composables/useAnnouncementRequests.ts` - работа с заявками
- `app/composables/useRepresentativeAnnouncements.ts` - объявления для представителей

### 7.2. Обновить существующие composables

**Файл:** `app/composables/usePermissions.ts`

Добавить shortcuts для новых разрешений:
- `canViewAnnouncements`
- `canManageAnnouncements`
- `canReviewRequests`

## Этап 8: Удаление старого функционала (Приоритет: Низкий)

### 8.1. Удалить компоненты объявлений из групп

**Удалить:**
- `app/components/groups/GroupAnnouncementSettings.vue`
- Связанный код из `app/pages/groups/[id]/index.vue`

### 8.2. Удалить старые API endpoints

**Удалить:**
- `server/api/groups/[id]/announcement.patch.ts`
- `server/api/groups/announced.get.ts`

### 8.3. Удалить старые функции из репозитория

**Файл:** `server/repositories/groupRepository.ts`

Удалить функции:
- `updateAnnouncementSettings`
- `getAnnouncedGroupsForRepresentatives`
- `checkCapacityAvailable`
- `closeGroupForRequests`
- `incrementReservedSlots`
- `decrementReservedSlots`

## Этап 9: Тестирование (Приоритет: Высокий)

### 9.1. Тестирование миграций

```bash
# Откатить все миграции
npm run db:rollback

# Применить заново
npm run db:migrate

# Проверить структуру
npm run db:status
```

### 9.2. Тестирование API

1. Создать объявление через API
2. Добавить группы к объявлению
3. Опубликовать объявление
4. Создать заявку от представителя
5. Одобрить/отклонить заявку
6. Проверить резервирование мест

### 9.3. Тестирование UI

1. Проверить создание объявления через интерфейс
2. Проверить подачу заявки представителем
3. Проверить рассмотрение заявки администратором
4. Проверить все статусы и переходы

## Этап 10: Документация (Приоритет: Низкий)

### 10.1. Обновить README

Добавить описание новой системы объявлений.

### 10.2. Создать руководство пользователя

**Файл:** `docs/Announcements_User_Guide.md`

Описать:
- Как создавать объявления
- Как подавать заявки
- Как обрабатывать заявки

## Проверка завершения

- [ ] Все миграции применены успешно
- [ ] Все API endpoints работают
- [ ] Все компоненты отображаются корректно
- [ ] Права доступа настроены правильно
- [ ] Старый функционал удалён
- [ ] Тесты пройдены
- [ ] Документация обновлена

## Примечания

- Реализацию лучше вести поэтапно, начиная с базы данных
- После каждого этапа проводить тестирование
- Использовать существующие паттерны проекта
- Следовать правилам из MEMORY (минимизация компонентов, единый стиль, валидация)
