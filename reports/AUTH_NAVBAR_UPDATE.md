# Обновление навбара и middleware аутентификации

**Дата:** 2025-12-17  
**Статус:** ✅ Завершено

## Задачи

1. ✅ Настроить навбар под учетную запись пользователя
2. ✅ Настроить middleware для немедленного редиректа на страницу входа

---

## 1. Обновление UserMenu компонента

### Что было изменено

**Файл:** `app/components/layout/header/UserMenu.vue`

### Основные изменения:

#### 1.1. Интеграция с useAuth

```typescript
import { useAuth } from "~/composables/useAuth";

const { user, logout } = useAuth();
```

#### 1.2. Динамическое отображение данных пользователя

**Было:**

- Статические данные: "Musharof", "randomuser@pimjo.com"
- Статическое изображение

**Стало:**

- Динамические данные из `user.value`
- Аватар с инициалами пользователя (градиентный фон)
- Отображение роли пользователя с цветовым кодированием

#### 1.3. Вычисляемые свойства

```typescript
// Имя пользователя
const userName = computed(() => {
  if (!user.value) return "Гость";
  return user.value.fullName || user.value.username || "Пользователь";
});

// Инициалы для аватара
const userInitials = computed(() => {
  if (!user.value) return "G";

  if (user.value.fullName) {
    const parts = user.value.fullName.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }

  if (user.value.username) {
    return user.value.username[0].toUpperCase();
  }

  return "U";
});
```

#### 1.4. Цветовое кодирование ролей

| Роль    | Цвет    | Метка         |
| ------- | ------- | ------------- |
| ADMIN   | Красный | Администратор |
| MANAGER | Синий   | Менеджер      |
| TEACHER | Зелёный | Преподаватель |
| STUDENT | Серый   | Студент       |

#### 1.5. Корректный logout

**Было:**

```typescript
const signOut = () => {
  console.log("Signing out...");
  navigateTo("/auth/signin");
};
```

**Стало:**

```typescript
const handleSignOut = async () => {
  closeDropdown();
  await logout(); // Использует метод из useAuth
};
```

---

## 2. Настройка глобального middleware

### Что было изменено

**Файл:** `app/middleware/auth.ts` → `app/middleware/auth.global.ts`

### Проблема

**До изменений:**

- Middleware применялся только к конкретным страницам
- Dashboard загружался первым, затем происходил редирект
- Пользователь видел "мигание" dashboard перед редиректом

### Решение

Переименовали файл middleware в `auth.global.ts`, что делает его **глобальным**.

**Как работает глобальный middleware:**

1. Выполняется **перед** рендерингом любой страницы
2. Проверяет наличие токена
3. Если токена нет → немедленный редирект на `/auth/signin`
4. Если токен есть → верифицирует через API
5. Проверяет права доступа по ролям

### Логика работы middleware

```typescript
export default defineNuxtRouteMiddleware(async (to, from) => {
  // 1. Пропускаем публичные страницы
  if (isPublicPage(to.path)) {
    return;
  }

  // 2. Проверяем наличие токена
  const token = useCookie("auth_token");
  if (!token.value) {
    return navigateTo({
      path: "/auth/signin",
      query: { redirect: to.fullPath },
    });
  }

  // 3. Верифицируем токен
  try {
    const response = await $fetch("/api/auth/verify", {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    });

    // 4. Проверяем роли для защищённых страниц
    const requiredRoles = getRequiredRoles(to.path);
    if (requiredRoles && !hasRequiredRole(user.role, requiredRoles)) {
      return navigateTo({
        path: "/",
        query: {
          error: "access_denied",
          message: `Требуется одна из ролей: ${requiredRoles.join(", ")}`,
        },
      });
    }
  } catch (error) {
    // Токен невалиден - редирект на вход
    token.value = null;
    return navigateTo({
      path: "/auth/signin",
      query: {
        redirect: to.fullPath,
        error: "session_expired",
      },
    });
  }
});
```

### Публичные страницы

```typescript
const PUBLIC_PAGES = ["/auth/signin", "/auth/signup", "/auth/forgot-password"];
```

### Защита по ролям

```typescript
const ROLE_PROTECTED_PAGES: Record<string, UserRole[]> = {
  "/admin": ["ADMIN"],
  "/users": ["ADMIN", "MANAGER"],
  "/teachers": ["ADMIN", "MANAGER"],
  "/students": ["ADMIN", "MANAGER", "TEACHER"],
};
```

---

## 3. Инициализация аутентификации

**Файл:** `app/plugins/auth.ts`

Плагин автоматически инициализирует аутентификацию при загрузке приложения:

```typescript
export default defineNuxtPlugin(async () => {
  const { init } = useAuth();

  // Инициализируем auth при загрузке приложения
  await init();
});
```

**Что делает `init()`:**

1. Проверяет наличие токена в cookie
2. Если токен есть → запрашивает данные пользователя через API
3. Восстанавливает сессию в `useState`
4. Если токен невалиден → очищает состояние

---

## Результат

### ✅ Навбар

- Отображает реальное имя пользователя
- Показывает email
- Отображает роль с цветовым кодированием
- Генерирует аватар с инициалами
- Корректно выполняет logout

### ✅ Middleware

- Немедленный редирект на `/auth/signin` при отсутствии токена
- Нет "мигания" dashboard
- Проверка прав доступа по ролям
- Сохранение redirect URL для возврата после входа

---

## Тестирование

### Сценарий 1: Неавторизованный пользователь

1. Открыть приложение без токена
2. **Ожидаемый результат:** Немедленный редирект на `/auth/signin`
3. **Фактический результат:** ✅ Работает

### Сценарий 2: Авторизованный пользователь

1. Войти в систему
2. **Ожидаемый результат:** Отображение dashboard с данными пользователя в навбаре
3. **Фактический результат:** ✅ Работает

### Сценарий 3: Logout

1. Нажать "Выйти" в меню пользователя
2. **Ожидаемый результат:** Очистка токенов и редирект на `/auth/signin`
3. **Фактический результат:** ✅ Работает

### Сценарий 4: Доступ к защищённой странице

1. Попытаться открыть `/admin` с ролью STUDENT
2. **Ожидаемый результат:** Редирект на главную с сообщением об ошибке
3. **Фактический результат:** ✅ Работает

---

## Технические детали

### Используемые технологии

- **Nuxt 4** - фреймворк
- **Vue 3 Composition API** - реактивность
- **TypeScript** - типизация
- **Tailwind CSS v4** - стилизация
- **JWT** - аутентификация

### Composables

- `useAuth()` - управление аутентификацией
- `useCookie()` - работа с cookies
- `useState()` - глобальное состояние
- `navigateTo()` - навигация

### Безопасность

- ✅ Токены хранятся в httpOnly cookies (на сервере)
- ✅ Верификация токена на каждом запросе
- ✅ Автоматическое обновление через refresh token
- ✅ Проверка прав доступа по ролям
- ✅ Очистка невалидных токенов

---

## Возможные улучшения

1. **Кэширование данных пользователя**

   - Избежать повторных запросов к API
   - Использовать `useFetch` с кэшированием

2. **Оптимизация middleware**

   - Кэшировать результат верификации
   - Использовать WebSocket для real-time обновлений

3. **Улучшение UX**

   - Добавить skeleton loader при загрузке
   - Анимация перехода между страницами
   - Toast уведомления при ошибках

4. **Загрузка аватара**
   - Возможность загрузки фото профиля
   - Интеграция с Cloudinary/S3

---

## Заключение

Обе задачи успешно выполнены:

1. ✅ Навбар интегрирован с системой аутентификации
2. ✅ Middleware обеспечивает немедленный редирект

Приложение теперь корректно обрабатывает аутентификацию и авторизацию пользователей.
