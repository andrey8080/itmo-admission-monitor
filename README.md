# ITMO Admission Monitor

Шаблон мониторинга рейтинга поступления в ИТМО на **Node.js 22 + GitHub Actions + Telegram**.

Сам этот репозиторий предназначен как **reference/template для форков** и не выполняет автоматические проверки по расписанию. После форка пользователь настраивает свои Variables/Secrets и самостоятельно включает cron в workflow.

## Возможности

- загрузка страницы рейтинга ИТМО;
- поиск абитуриента по `APPLICANT_ID`;
- расчёт сырой позиции, ОВП/ВПП и запаса мест;
- сравнение текущего состояния с предыдущим;
- Telegram-уведомления;
- повторные попытки и timeout при загрузке страницы;
- сохранение предыдущего состояния через GitHub Actions cache;
- ручной запуск workflow;
- unit-тесты на встроенном `node:test`;
- отсутствие сторонних npm-зависимостей.

## Как это работает

```text
GitHub Actions
      ↓
  rating.js
      ↓
страница рейтинга ИТМО
      ↓
__NEXT_DATA__ / programList
      ↓
расчёт позиции и запаса
      ↓
  format.js
      ↓
 Telegram Bot API
```

State-файлы не коммитятся в Git. Между запусками состояние может храниться в GitHub Actions cache.

## Использование через fork

### 1. Сделайте fork

Используйте обычный GitHub Fork этого репозитория.

### 2. Настройте GitHub Actions Variables

Откройте в своём форке:

```text
Settings → Secrets and variables → Actions → Variables
```

Создайте:

| Variable | Назначение |
| --- | --- |
| `APPLICANT_ID` | идентификатор абитуриента в рейтинге |
| `GENERAL_PLACES` | количество мест общего конкурса |
| `RATING_URL` | URL страницы нужной конкурсной группы |

### 3. Настройте Secrets

В разделе:

```text
Settings → Secrets and variables → Actions → Secrets
```

создайте:

| Secret | Назначение |
| --- | --- |
| `TELEGRAM_BOT_TOKEN` | токен Telegram-бота |
| `TELEGRAM_CHAT_ID` | id пользователя или чата |

Не добавляйте реальные значения этих параметров в исходный код или `.env.example`.

### 4. Проверьте ручной запуск

Workflow в upstream оставлен только с `workflow_dispatch`, поэтому сам шаблон не запускается автоматически.

После настройки форка откройте:

```text
Actions → ITMO admission monitor → Run workflow
```

и выполните один ручной запуск.

### 5. Включите расписание в своём форке

Откройте:

```text
.github/workflows/admission-monitor.yml
```

и раскомментируйте блок:

```yaml
schedule:
  - cron: '*/30 * * * *'
```

После коммита workflow начнёт запускаться по cron в вашем форке.

> GitHub Actions schedule не гарантирует старт строго в указанную минуту: при нагрузке возможны задержки.

Более короткая инструкция также находится в [`TEMPLATE_USAGE.md`](./TEMPLATE_USAGE.md).

## Локальный запуск

Требуется **Node.js 22+**.

```bash
git clone https://github.com/andrey8080/itmo-admission-monitor.git
cd itmo-admission-monitor
cp .env.example .env
```

Заполните `.env` своими значениями, затем:

```bash
npm test
npm run check:local
```

`.env` находится в `.gitignore` и не должен попадать в Git.

## Конфигурация

Пример находится в [`.env.example`](./.env.example):

```env
APPLICANT_ID=your_applicant_id
GENERAL_PLACES=66
RATING_URL=https://abit.itmo.ru/rating/master/budget/PROGRAM_ID
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
STATE_FILE=.state/rating-state.json
```

Все параметры, кроме `STATE_FILE`, обязательны.

## Структура

```text
itmo-admission-monitor/
├── .github/
│   └── workflows/
│       └── admission-monitor.yml
├── test/
│   ├── config.test.js
│   ├── format.test.js
│   ├── rating.test.js
│   └── telegram.test.js
├── TEMPLATE_USAGE.md
├── config.js
├── format.js
├── gh-check.js
├── rating.js
├── telegram.js
├── .env.example
└── package.json
```

## Тесты

```bash
npm test
```

Тесты проверяют расчёт позиций, парсинг `__NEXT_DATA__`, форматирование сообщений, Telegram helper и валидацию конфигурации.

## Privacy & security

В репозитории не должны храниться:

- реальный `APPLICANT_ID`;
- Telegram bot token;
- Telegram chat ID;
- `.env`;
- рабочий `.rating-state.json` или содержимое `.state/`.

Персональные параметры для GitHub Actions передаются через **Variables**, секретные Telegram credentials — через **Secrets**.

State, используемый для сравнения соседних запусков, не содержит applicant ID.

## Ограничения

Парсер зависит от структуры `programList` внутри `__NEXT_DATA__` страницы рейтинга ИТМО. Если формат сайта изменится, `rating.js` потребуется адаптировать.
