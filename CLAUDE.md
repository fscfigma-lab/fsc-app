# FSC App — документация для Claude

## Где живёт приложение
- **Продакшн**: https://fscfigma-lab.github.io/fsc-app/
- **Стейджинг**: https://fscfigma-lab.github.io/fsc-app-dev/
- **Главный файл**: `index.html` (~5400 строк, всё в одном файле)
- **Service Worker**: `sw.js` (кэш `fsc-v34`, BASE = `/fsc-app`)
- **Манифест**: `manifest.json` (start_url и scope = `/fsc-app/`)
- **Push worker**: `OneSignalSDKWorker.js` (нативный VAPID web push)

## Backend
- **Supabase URL**: `https://yhsedgaimfgbcqbjltkv.supabase.co`
- **Supabase anon key**: в коде (допустимо, row-level security не нужен)
- Данные — JSON blob: таблица `app_data`, строка `{id:'main', data:D}`
- Стейджинг: строка `{id:'dev', data:D}`
- Бэкапы: `{id:'bk_{timestamp}', data:D}`, хранятся последние 10

## Секретные ключи — где хранятся (НИКОГДА не в коде/git)
- `D.anthropicKey` — Anthropic API key
- `D.tgBotToken` — Telegram bot token
- `D.tgAdminId` — Telegram ID администратора
- `D.tgTechDirId` — Telegram ID техдиректора
- `D.githubPat` — GitHub Personal Access Token
- `D.ntfyTopic` — ntfy.sh топик для push-уведомлений
- `D.gcalClientId` — Google OAuth Client ID
- `currentUser` — **только** в `localStorage('fsc4_user')`, никогда в Supabase

> GitHub push protection блокирует Anthropic API ключи — никогда не коммитить!

## Роли
- `admin` | `management` | `manager`
- При логине: `curProjDetail=null; curPage='dashboard'`

## Глобальные переменные состояния
```
D             — весь объект данных (projects, tasks, stages, team, log, ...)
curPage       — текущая страница
curProjDetail — ID открытого проекта (null = список)
pfilt         — фильтр статуса ('all'|'active'|'overdue'|'paused'|'done')
pSearch       — строка поиска проектов
pMgrFilt      — фильтр по менеджеру
gZoom         — зум Ганта ('weeks'|'months'|'quarters')
```

## Поля данных — ВАЖНО не путать
| Объект | Поле дедлайна | Другие поля |
|--------|--------------|-------------|
| Этап (stage) | `s.deadline` (НЕ s.dead!) | `s.id`, `s.pid`, `s.name`, `s.icon`, `s.done` |
| Задача (task) | `t.dead` | `t.id`, `t.pid`, `t.name`, `t.who`, `t.prio`, `t.done`, `t.notes` (НЕ t.note!) |
| Проект | `p.deadline`, `p.start` | `p.id`, `p.name`, `p.client`, `p.status`, `p.pct`, `p.mgr` |
| Базовая линия | `p.bl_deadline`, `p.bl_start` | `p.bl_stages` |

### Приоритеты задач
`critical` | `high` | `medium` | `low` (поле `prio`)

### Статусы проектов
`active` | `overdue` | `paused` | `done`  
Статус **авто-вычисляется** при синке с Google Sheets: pct=100 → done, иначе сравнивается deadline с сегодня.

## Функции сохранения
```javascript
save()        // localStorage + Supabase; каждые 20 вызовов → autoBackup()
              // ВАЖНО: перед сохранением читает Supabase и восстанавливает
              // отсутствующие секретные ключи (tgBotToken, anthropicKey и др.)
autoBackup()  // bk_{timestamp} в Supabase
exportJSON()  // скачивает .json
importJSON()  // загружает из файла
```

## Google Sheets синхронизация
- `syncFromSheets()` — запускается **автоматически каждые 10 минут**
- Читает лист «Текущие проекты»: название, клиент, %, дедлайн, менеджер
- Авто-вычисляет статус по pct + deadline
- `_parseSheetDate()` понимает форматы: `DD.MM.YYYY`, `DD.MM.YY`, `DD.MM`, ISO, с текстовыми суффиксами типа `30.06.26(закончен)`

## Гант
- `rGantt()` — рендер всего Ганта
- `pos(d)` — дата → % позиция на шкале
- `pStart`, `pEnd`, `total` — диапазон текущего вида
- Классы: `.g-bar` (проект), `.g-sbar` (этап)
- **Drag-to-reschedule**: мышь и touch, хранит последние 10 операций в `_gUndo`
- Кнопка «↩ Отменить перенос» появляется на 8 сек после перетаскивания
- Ctrl+Z / Cmd+Z — undo последнего переноса

## GitHub
- Репо: `https://github.com/fscfigma-lab/fsc-app`
- Ветка: `main` → автодеплой на GitHub Pages (~2 мин после push)
- `.github/workflows/web-push.yml` — каждые 30 мин
- `.github/workflows/daily-push.yml` — 09:00 + 18:00 МСК
- `.gitignore` включает `*.bak`

## Функции приложения

### Авторизация
PIN-код, изоляция сессий по устройству.

### Дашборд
Приветствие, сводка задач (просрочен/сегодня/активные), лента изменений 🔔

### Проекты
CRUD, статусы, фильтры по поиску/статусу/менеджеру, детальная карточка с прогрессом.

### Этапы
CRUD внутри проекта, модальное окно `openStageModal`.

### Задачи
CRUD, приоритеты, фильтр по проекту.

### Команда
CRUD: имя, роль, инициалы, Telegram.

### Гант
- Глобальный: все проекты, зум недели/месяцы/кварталы, прогресс %, milestone ◆, базовая линия
- Мини-Гант: внутри проекта — этапы + задачи по критичности
- Drag-to-reschedule с undo

### AI / Голосовой ассистент
Anthropic Claude API, генерация плана проекта с этапами.

### Push-уведомления (ntfy.sh + native VAPID)
- ntfy.sh: бесплатно, без регистрации, iOS/Android
- Native web push через VAPID (OneSignalSDKWorker.js)
- Триггеры: просрочка, сегодняшний дедлайн, назначение задачи, выполнение этапа

### Резервное копирование
Авто-бэкап каждые 20 сохранений, последние 10 бэкапов, экспорт/импорт JSON, восстановление из облака. Кнопка 🗄️ (только admin).

### Google Calendar
OAuth 2.0 без сервера. Синхронизирует дедлайны проектов (красный), этапов (жёлтый), задач high/critical (оранжевый). Upsert — не дублирует.

### Persistent Storage
`navigator.storage.persist()` при старте.

### Адаптивность
Нижняя навигация на мобильном, кнопка «Назад», mob-ubar.

## Бэклог
- 📷 Камера — фото к задачам/этапам
- 🔗 Зависимости задач + стрелки на Ганте
- 🔴 Критический путь
- 📄 PDF-экспорт Ганта
- 👥 Загрузка ресурсов (кто перегружен)
