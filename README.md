# ITMO Admission Monitor

Небольшой монитор рейтинга поступления в ИТМО на **Node.js 22**. GitHub Actions периодически загружает страницу рейтинга, находит заданного абитуриента, рассчитывает позиции по ОВП/ВПП и отправляет статус в Telegram.

Проект не требует собственного сервера: расписание выполняется в GitHub Actions, а рабочее состояние между запусками сохраняется в Actions cache.

## Возможности

- проверка рейтинга по расписанию;
- поиск абитуриента по `APPLICANT_ID`;
- расчёт сырой позиции, ОВП/ВПП и запаса мест;
- сравнение текущего состояния с предыдущим;
- Telegram-уведомления после каждой проверки;
- повторные попытки и timeout при загрузке страницы ИТМО;
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

Предыдущее состояние восстанавливается из GitHub Actions cache. State-файлы не коммитятся в репозиторий.

## Быстрый запуск через GitHub Actions

### 1. Создайте Telegram-бота

Получите bot token через BotFather и определите `chat_id`, куда должны приходить уведомления.

### 2. Настройте GitHub Actions Variables

Откройте:

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

### 4. Запустите workflow

Откройте:

```text
Actions → ITMO admission monitor → Run workflow
```

По умолчанию workflow также запускается раз в 30 минут.

Расписание находится в:

```text
.github/workflows/admission-monitor.yml
```

и может быть изменено через cron.

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

State, используемый для сравнения соседних запусков, сохраняется только в GitHub Actions cache и не содержит applicant ID.

## Ограничения

Парсер зависит от структуры `programList` внутри `__NEXT_DATA__` страницы рейтинга ИТМО. Если формат сайта изменится, `rating.js` потребуется адаптировать.

GitHub Actions schedule не гарантирует запуск строго в указанную минуту: при нагрузке scheduled workflow может стартовать с задержкой.
