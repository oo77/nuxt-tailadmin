# План реализации: Визуальный редактор шаблонов сертификатов

> **Дата создания:** 2025-12-26  
> **Оценка времени:** 2-3 дня  
> **Приоритет:** Высокий

---

## 📋 Обзор проекта

### Текущее состояние

Сейчас система работает так:

1. Пользователь загружает DOCX-файл шаблона
2. Система извлекает переменные `[НАЗВАНИЕ]` из документа
3. При генерации сертификата — подставляет данные через docxtemplater
4. Конвертация в PDF через LibreOffice (НЕ РАБОТАЕТ без установки LibreOffice)

### Новый подход

Встроенный визуальный редактор шаблонов:

1. Пользователь создаёт шаблон прямо в браузере (drag-and-drop)
2. Добавляет текст, переменные, QR-код, изображения
3. Шаблон сохраняется как JSON-структура
4. Генерация PDF происходит на сервере через Puppeteer или на клиенте через jsPDF

---

## 🗂️ Что нужно УДАЛИТЬ / ИЗМЕНИТЬ

### Файлы для удаления (после миграции)

```
❌ server/api/certificates/templates/[id]/upload.post.ts  — загрузка DOCX
❌ server/utils/certificateGenerator.ts (частично)         — парсинг DOCX, docxtemplater
```

### Файлы для модификации

```
📝 server/types/certificate.ts                           — новые типы для редактора
📝 server/repositories/certificateTemplateRepository.ts  — хранение JSON шаблона
📝 app/pages/certificates/templates/[id].vue             — полная переработка (редактор)
📝 app/pages/groups/[id]/certificates.vue                — адаптация под новый генератор
```

### База данных — изменения

```sql
ALTER TABLE certificate_templates
  ADD COLUMN template_data JSON COMMENT 'JSON-структура шаблона редактора',
  ADD COLUMN layout VARCHAR(20) DEFAULT 'A4_landscape' COMMENT 'Макет: A4_portrait, A4_landscape',
  ADD COLUMN background_url VARCHAR(500) COMMENT 'URL фонового изображения';
```

---

## 🔧 Что нужно УСТАНОВИТЬ

### NPM-пакеты

```bash
# Клиентская часть (редактор)
npm install fabric                 # Canvas-редактор с drag-and-drop
npm install @types/fabric          # TypeScript типы

# Генерация PDF
npm install puppeteer              # Серверная генерация PDF (качественно)
npm install @types/puppeteer       # TypeScript типы

# Опционально (для клиентской генерации)
npm install jspdf html2canvas      # Клиентская генерация PDF (резервный вариант)
```

### Зависимости Puppeteer

На Windows Puppeteer автоматически скачает Chromium. На сервере может потребоваться:

```bash
# Ubuntu/Debian
sudo apt install -y libgbm1 libasound2 libatk1.0-0 libcups2 libxcomposite1
```

---

## 📐 Архитектура нового редактора

### Структура данных шаблона (JSON)

```typescript
interface CertificateTemplateData {
  // Макет
  layout:
    | "A4_portrait"
    | "A4_landscape"
    | "letter_portrait"
    | "letter_landscape";
  width: number; // в пикселях (для A4 landscape: 1123, portrait: 794)
  height: number; // в пикселях (для A4 landscape: 794, portrait: 1123)

  // Фон
  background: {
    type: "color" | "image" | "preset";
    value: string; // HEX-цвет, URL изображения, или ID пресета
  };

  // Элементы на холсте
  elements: TemplateElement[];
}

type TemplateElement =
  | TextElement
  | VariableElement
  | ImageElement
  | QRElement
  | ShapeElement;

interface BaseElement {
  id: string;
  type: "text" | "variable" | "image" | "qr" | "shape";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  locked: boolean;
}

interface TextElement extends BaseElement {
  type: "text";
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  textAlign: "left" | "center" | "right";
  color: string;
  lineHeight: number;
}

interface VariableElement extends BaseElement {
  type: "variable";
  variableKey: string; // 'student.fullName', 'certificate.number', etc.
  placeholder: string; // Отображаемый текст в редакторе
  // + все стили TextElement
  fontFamily: string;
  fontSize: number;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  textAlign: "left" | "center" | "right";
  color: string;
}

interface ImageElement extends BaseElement {
  type: "image";
  src: string; // URL или base64
  objectFit: "contain" | "cover" | "fill";
  opacity: number; // 0-1
}

interface QRElement extends BaseElement {
  type: "qr";
  dataSource: "certificate_url"; // URL для верификации сертификата
  size: number;
  color: string;
  backgroundColor: string;
}

interface ShapeElement extends BaseElement {
  type: "shape";
  shapeType: "rectangle" | "circle" | "line";
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
}
```

---

## 📁 Структура новых файлов

```
app/
├── components/
│   └── certificates/
│       ├── editor/
│       │   ├── CertificateEditor.vue          # Главный компонент редактора
│       │   ├── EditorCanvas.vue               # Fabric.js холст
│       │   ├── EditorToolbar.vue              # Панель инструментов
│       │   ├── EditorSidebar.vue              # Свойства выбранного элемента
│       │   ├── ElementText.vue                # Настройки текста
│       │   ├── ElementVariable.vue            # Настройки переменной
│       │   ├── ElementImage.vue               # Настройки изображения
│       │   ├── ElementQR.vue                  # Настройки QR-кода
│       │   ├── BackgroundSelector.vue         # Выбор фона
│       │   ├── LayoutSelector.vue             # Выбор макета
│       │   └── PresetTemplates.vue            # Готовые шаблоны
│       └── ...existing modals...
│
├── composables/
│   └── useCertificateEditor.ts                # Логика редактора
│
└── pages/
    └── certificates/
        └── templates/
            ├── [id].vue                        # Редактирование (переработанное)
            └── [id]/
                └── editor.vue                  # Страница редактора (новая)

server/
├── api/
│   └── certificates/
│       ├── templates/
│       │   ├── [id]/
│       │   │   ├── upload.post.ts              # УДАЛИТЬ
│       │   │   └── background.post.ts          # НОВЫЙ: загрузка фона
│       │   └── ...existing...
│       └── generate/
│           └── [certificateId].get.ts          # НОВЫЙ: генерация PDF
│
├── utils/
│   ├── certificateGenerator.ts                 # ПЕРЕРАБОТАТЬ
│   └── pdfGenerator.ts                         # НОВЫЙ: Puppeteer генератор
│
└── types/
    └── certificate.ts                          # ДОПОЛНИТЬ новыми типами
```

---

## 📅 План реализации по дням

### День 1: Инфраструктура и базовый редактор

#### 1.1 Подготовка (1 час)

- [ ] Установить npm-пакеты: `fabric`, `@types/fabric`, `puppeteer`
- [ ] Создать миграцию БД для новых полей
- [ ] Обновить типы в `certificate.ts`

#### 1.2 Базовый холст (3 часа)

- [ ] Создать `EditorCanvas.vue` с Fabric.js
- [ ] Настроить размеры холста (A4 landscape по умолчанию)
- [ ] Реализовать zoom и pan (масштабирование, перемещение)
- [ ] Добавить сетку для выравнивания

#### 1.3 Панель инструментов (2 часа)

- [ ] Создать `EditorToolbar.vue`
- [ ] Кнопки: Текст, Переменная, Изображение, QR, Фигуры
- [ ] Выбор макета (A4 portrait/landscape)
- [ ] Кнопки: Отмена/Повтор, Сохранить, Предпросмотр

#### 1.4 Боковая панель свойств (2 часа)

- [ ] Создать `EditorSidebar.vue`
- [ ] Показывать свойства выбранного элемента
- [ ] Поля: позиция X/Y, размер, поворот
- [ ] Стили текста: шрифт, размер, цвет, выравнивание

---

### День 2: Элементы и функциональность

#### 2.1 Текстовые элементы (2 часа)

- [ ] Добавление статического текста
- [ ] Редактирование текста двойным кликом
- [ ] Стили: шрифт, размер, цвет, жирный/курсив
- [ ] Многострочный текст

#### 2.2 Переменные (2 часа)

- [ ] Компонент `ElementVariable.vue`
- [ ] Выбор переменной из списка (student.fullName, course.name и т.д.)
- [ ] Отображение placeholder в редакторе
- [ ] Специальный стиль для переменных (подсветка)

#### 2.3 Изображения и фон (2 часа)

- [ ] Загрузка изображений (логотип, подпись, печать)
- [ ] Компонент `BackgroundSelector.vue`
- [ ] Загрузка пользовательского фона
- [ ] Готовые пресеты фонов (рамки сертификатов)

#### 2.4 QR-код (1 час)

- [ ] Компонент `ElementQR.vue`
- [ ] Автоматическое содержимое (URL сертификата)
- [ ] Настройки: размер, цвет

#### 2.5 Сохранение шаблона (1 час)

- [ ] Сериализация Fabric.js объектов в JSON
- [ ] API endpoint для сохранения `template_data`
- [ ] Загрузка шаблона из JSON при открытии

---

### День 3: Генерация PDF и финализация

#### 3.1 Серверная генерация PDF (3 часа)

- [ ] Создать `pdfGenerator.ts` с Puppeteer
- [ ] HTML-шаблон для рендеринга
- [ ] Подстановка переменных
- [ ] API endpoint `/api/certificates/generate/[id]`

#### 3.2 Интеграция с выдачей сертификатов (2 часа)

- [ ] Обновить `issue/[groupId].post.ts` для нового генератора
- [ ] Генерация PDF при выдаче
- [ ] Сохранение файла в `storage/certificates/generated/`

#### 3.3 Предпросмотр (1 час)

- [ ] Кнопка предпросмотра в редакторе
- [ ] Модальное окно с PDF
- [ ] Тестовые данные для preview

#### 3.4 Готовые шаблоны (1 час)

- [ ] 2-3 готовых дизайна сертификатов
- [ ] Возможность выбрать при создании шаблона
- [ ] Кнопка "Начать с шаблона"

#### 3.5 Тестирование и исправления (1 час)

- [ ] Проверить весь флоу: создание → редактирование → выдача → скачивание
- [ ] Исправить баги
- [ ] Проверить mobile-friendly

---

## 🎨 UI/UX редактора

### Макет интерфейса

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ← Назад   │  Шаблон: "Сертификат ARIS"                    [Сохранить]   │
├──────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ ┌──────────────┐ │
│ │  [T] Текст  [x] Переменная  [🖼] Изображение        │ │  СВОЙСТВА    │ │
│ │  [QR] QR-код  [□] Фигура  [🎨] Фон  [📐] Макет      │ │              │ │
│ ├─────────────────────────────────────────────────────┤ │  Позиция     │ │
│ │                                                     │ │  X: [250]    │ │
│ │                                                     │ │  Y: [180]    │ │
│ │          ┌─────────────────────────────┐            │ │              │ │
│ │          │     СЕРТИФИКАТ              │            │ │  Размер      │ │
│ │          │                             │            │ │  W: [400]    │ │
│ │          │  [ФИО_СТУДЕНТА]             │            │ │  H: [50]     │ │
│ │          │                             │            │ │              │ │
│ │          │  успешно завершил курс      │            │ │  Шрифт       │ │
│ │          │  [НАЗВАНИЕ_КУРСА]           │            │ │  [Times NR▾] │ │
│ │          │                             │            │ │  [24] px     │ │
│ │          │  Дата: [ДАТА_ВЫДАЧИ]        │            │ │  [B] [I] [U] │ │
│ │          │                    ┌───┐    │            │ │              │ │
│ │          │                    │QR │    │            │ │  Цвет        │ │
│ │          │                    └───┘    │            │ │  [#000000]   │ │
│ │          └─────────────────────────────┘            │ │              │ │
│ │                                                     │ │  Переменная  │ │
│ │  [−] [100%] [+]   Zoom                              │ │  [student.   │ │
│ │                                                     │ │   fullName]  │ │
│ └─────────────────────────────────────────────────────┘ └──────────────┘ │
├──────────────────────────────────────────────────────────────────────────┤
│  [Отмена] [Повтор]   │   [Предпросмотр]   │   [Сохранить и выйти]        │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Миграция данных

### Существующие шаблоны

Если есть шаблоны с загруженными DOCX-файлами, нужно:

1. Сохранить `originalFileUrl` для обратной совместимости
2. Предложить пользователю пересоздать шаблон в редакторе
3. Старый подход может работать параллельно (если `template_data` пустой — использовать DOCX)

### Выданные сертификаты

Уже выданные сертификаты остаются без изменений — их PDF/DOCX файлы сохранены.

---

## ⚠️ Риски и решения

| Риск                              | Вероятность | Решение                                  |
| --------------------------------- | ----------- | ---------------------------------------- |
| Puppeteer не работает на хостинге | Средняя     | Fallback на клиентскую генерацию (jsPDF) |
| Fabric.js тяжёлый                 | Низкая      | Lazy-load только на странице редактора   |
| Сложность для пользователя        | Средняя     | Готовые шаблоны + подсказки              |
| Шрифты в PDF                      | Средняя     | Использовать Google Fonts + встраивание  |

---

## ✅ Критерии готовности (Definition of Done)

- [ ] Пользователь может создать шаблон с нуля
- [ ] Можно добавить: текст, переменные, изображения, QR-код
- [ ] Можно настроить: шрифт, размер, цвет, позицию
- [ ] Шаблон сохраняется и загружается корректно
- [ ] Генерируется PDF при выдаче сертификата
- [ ] PDF скачивается без ошибок
- [ ] Есть 2-3 готовых шаблона для быстрого старта

---

## 📝 Заметки

- Fabric.js документация: http://fabricjs.com/docs/
- Размеры A4: 210×297 мм → при 96 DPI: 794×1123 px
- Google Fonts для встраивания: Inter, Roboto, PT Serif, Times New Roman
