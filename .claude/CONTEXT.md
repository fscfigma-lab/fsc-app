# Рабочий контекст проекта FSC App

Этот файл — для Claude: история исправлений, паттерны, подводные камни.  
Читай до того как лезть в код.

---

## Владелец и стиль работы
- Маргарита — admin-пользователь, продукт-менеджер проекта
- Ожидает: всё с первого раза, без лишних объяснений
- Не любит: длинные пересказы того что уже сделано, лишние файлы документации
- Язык общения: русский
- Критические ситуации (что-то сломалось перед презентацией) — действуй быстро, не теоретизируй

---

## Исправленные баги — корневые причины

### 1. Задачи показывали "undefined"
**Симптом**: все задачи отображались с пустым именем  
**Причина**: задачи были записаны в Supabase с полем `title`, а приложение читает `task.name`  
**Фикс**: в Supabase переименовали `title` → `name` во всех 15 задачах  
**Урок**: поле задачи — `name`, а НЕ `title`

### 2. Crash для задач с приоритетом critical
**Симптом**: TypeError при открытии проекта с critical-задачами  
**Причина**: `byPrio = {high:[], medium:[], low:[]}` — отсутствовал ключ `critical`  
**Фикс**: добавили `critical:[]` в инициализацию объекта  
**Коммит**: f8132eb

### 3. Статус проекта не обновлялся из Google Sheets
**Симптом**: «Мосфильмовская» показывала overdue хотя была завершена на 100%  
**Причина**: `syncFromSheets()` обновлял только `pct`, но не трогал `status`  
**Фикс**: в syncFromSheets добавлена логика: pct=100 → status='done', иначе сравнивается deadline с today  
**Коммиты**: ab34df0, a9cd34f

### 4. Telegram-токен пропадал после сохранения
**Симптом**: токен бота, adminId, techdirId исчезали из Supabase после работы в браузере  
**Причина**: браузерный `save()` перезаписывал Supabase из локального `D`, который не содержал токена (был загружен раньше чем токен добавили)  
**Фикс**: `save()` теперь сначала читает Supabase и восстанавливает отсутствующие ключи: `tgBotToken`, `tgAdminId`, `tgTechDirId`, `anthropicKey`, `githubPat`  
**Коммит**: 0b78df4  
**Важно**: если после любых изменений в save() эти поля снова пропадут — проверяй логику merge

### 5. Парсер дат Google Sheets не понимал форматы
**Симптом**: 28 проектов без дедлайнов (показывали null)  
**Причина**: `_parseSheetDate()` понимал только `DD.MM.YYYY`, а в Sheets форматы разные  
**Фикс**: новый парсер покрывает: `DD.MM.YY`, `DD.MM.YYYY`, `DD.MM`, ISO, с суффиксами типа `30.06.26(закончен)`  
**Коммит**: ec4f942

### 6. Поле `note` vs `notes`
**Симптом**: заметки к задачам не отображались  
**Причина**: задачи сохранялись с полем `note`, приложение читает `task.notes`  
**Фикс**: переименовали в Supabase  
**Урок**: поле заметок задачи — `notes`, а НЕ `note`

### 7. Случайный drag на Ганте — как восстановить
Если пользователь случайно перетащил бар и не знает что именно:
1. Через `curl` читаем последний бэкап (`bk_*`) и текущий `main` из Supabase
2. Сравниваем дедлайны проектов и этапов
3. Даты вида `2001-*` в бэкапе — это старые битые данные, не трогаем
4. Ищем резкий сдвиг (>30 дней) — это вероятно случайный drag
5. Восстанавливаем через Python + urllib (не нужен внешний модуль)

---

## Важные технические детали

### Service Worker кэш
Версия кэша в `sw.js`: **`fsc-v34`** (обновляй при каждом деплое критических изменений).  
Если пользователь видит старую версию — попроси очистить кэш или переименовать версию.

### Supabase anon key (можно хранить в коде)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inloc2VkZ2FpbWZnYmNxYmpsdGt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMjQxOTMsImV4cCI6MjA5NjYwMDE5M30.aThP2KxMEmw0DHf0PPIMF82SiqSLBRbA9Q-HuHENxIE
```

### Telegram бот (токен хранится ТОЛЬКО в Supabase, D.tgBotToken)
- Bot token: `8839837503:AAFhhnOBP7qMm_E031Tr-Twk5A9gFu2PJkA`
- Admin Telegram ID: `504595878`
- TechDir Telegram ID: `325328091`

### Как читать/писать данные через curl (для экстренного восстановления)
```bash
ANON="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inloc2VkZ2FpbWZnYmNxYmpsdGt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMjQxOTMsImV4cCI6MjA5NjYwMDE5M30.aThP2KxMEmw0DHf0PPIMF82SiqSLBRbA9Q-HuHENxIE"
URL="https://yhsedgaimfgbcqbjltkv.supabase.co"

# Читать текущие данные
curl -s "$URL/rest/v1/app_data?id=eq.main&select=data" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON"

# Список бэкапов
curl -s "$URL/rest/v1/app_data?id=like.bk_*&select=id,updated_at&order=updated_at.desc" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
```

---

## Структура данных D (ключевые поля)
```javascript
D = {
  projects: [{id, name, client, mgr, status, pct, start, deadline, bl_start, bl_deadline, bl_stages}],
  stages:   [{id, pid, name, icon, deadline, done}],
  tasks:    [{id, pid, name, who, prio, dead, done, notes}],
  team:     [{id, name, role, initials, tg, tgId}],
  log:      [{id, ts, msg, pid, user}],
  // Конфиги (хранятся только в Supabase, не светятся в коде):
  anthropicKey, tgBotToken, tgAdminId, tgTechDirId, githubPat,
  ntfyTopic, gcalClientId, gcalEvents, gcalLastSync,
  savedAt, sheetsUrl, pushSub
}
```

---

## Паттерны при работе с кодом

- Весь код в одном файле `index.html` — ищи функции через grep
- Перед любым изменением: `grep -n "имя_функции" index.html`
- После изменений: `git add index.html && git commit -m "..." && git push`
- Деплой занимает ~2 минуты после push
- Для проверки данных в Supabase — curl (см. выше), не нужны внешние модули

## Частые ошибки при редактировании
- НЕ менять `s.deadline` на `s.dead` — это разные вещи
- НЕ менять `t.notes` на `t.note`
- НЕ хардкодить секретные ключи в код
- После изменения SW: обновить версию кэша `fsc-v{N+1}` в sw.js
