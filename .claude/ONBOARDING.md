# Перенос на новый компьютер

## Что нужно установить
1. **Git** — https://git-scm.com (или через `brew install git`)
2. **Claude Code** — https://claude.ai/code → Download
3. Браузер (Chrome/Safari)

## Шаги

### 1. Скопируй папку
Перенеси папку `FSC_App` на новый компьютер (USB / AirDrop / облако).  
`.git` внутри папки уже содержит всю историю — репо не нужно клонировать заново.

### 2. Открой в Claude Code
```
File → Open Folder → выбери FSC_App
```
Claude автоматически прочитает `CLAUDE.md` и `.claude/CONTEXT.md` — контекст загрузится сам.

### 3. Проверь git remote
```bash
git remote -v
# должно быть: https://github.com/fscfigma-lab/fsc-app.git
```
Если remote отсутствует:
```bash
git remote add origin https://github.com/fscfigma-lab/fsc-app.git
```

### 4. Настрой git (если первый раз)
```bash
git config --global user.email "fscfigma@gmail.com"
git config --global user.name "FSC Figma"
```

### 5. GitHub авторизация для push
При первом `git push` откроется браузер для авторизации GitHub.  
Или используй токен из `D.githubPat` (лежит в Supabase).

## Что не нужно переносить / переустанавливать
- Supabase — данные в облаке, подключение автоматическое
- Telegram бот — работает независимо
- GitHub Actions — в репо, работают сами
- Ключи и токены — в Supabase (`D.tgBotToken`, `D.anthropicKey` и др.), не нужно вводить заново

## Проверка после переноса
1. Открой https://fscfigma-lab.github.io/fsc-app/
2. Войди как admin
3. Проверь что проекты загрузились
4. Зайди в Гант — убедись что данные есть
5. `git log --oneline -3` — убедись что история есть

## Если что-то пошло не так
Скажи Claude: «смотри CONTEXT.md» — там описаны все частые проблемы и способы восстановления через curl из Supabase.
