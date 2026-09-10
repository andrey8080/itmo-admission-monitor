# ITMO Admission Monitor

Шаблон мониторинга рейтинга поступления в ИТМО на **Node.js 22 + GitHub Actions + Telegram**.

Репозиторий рассчитан на форки: upstream сам по расписанию не запускается. После форка пользователь указывает свои данные, включает cron и получает Telegram-уведомления по одной или нескольким конкурсным программам.

## Возможности

- отслеживание **от 1 до N программ** для одного абитуриента;
- поиск по `APPLICANT_ID`;
- расчёт сырой позиции, ОВП, ВПП и запаса мест;
- отдельное сравнение изменений по каждой программе;
- автоматическое получение названия программы со страницы ИТМО;
- единый Telegram-отчёт по всем программам;
- автоматическое разбиение большого отчёта на несколько сообщений;
- частичный успех: ошибка одной программы не скрывает результаты остальных;
- до 4 параллельных запросов к рейтингам;
- retry и timeout при загрузке страниц;
- хранение предыдущего состояния через GitHub Actions cache;
- unit-тесты на встроенном `node:test`;
- отсутствие сторонних npm-зависимостей.

## Как это работает

```text
GitHub Actions
      ↓
   gh-check.js
      ↓
 ┌────┼───────────────┐
 ↓    ↓               ↓
URL 1 URL 2 ...     URL N
 ↓    ↓               ↓
rating.js → __NEXT_DATA__ / programList
      ↓
расчёт позиции для каждой программы
      ↓
  format.js
      ↓
сводный Telegram-отчёт
```

State хранится отдельно по URL программы:

```text
programs[url] -> previous snapshot
```

Рабочий state не коммитится в Git.

## Использование через fork

### 1. Сделайте fork

Создайте обычный GitHub Fork этого репозитория.

### 2. Настройте Variables

Откройте в своём форке:

```text
Settings → Secrets and variables → Actions → Variables
```

Создайте:

| Variable | Назначение |
| --- | --- |
| `APPLICANT_ID` | идентификатор абитуриента в рейтингах |
| `RATING_URLS` | один или несколько URL конкурсных программ |
| `GENERAL_PLACES` | число мест либо список значений по программам |

### Одна программа

```text
RATING_URLS=https://abit.itmo.ru/rating/master/budget/PROGRAM_ID
GENERAL_PLACES=66
```

Для обратной совместимости вместо `RATING_URLS` можно использовать старую переменную `RATING_URL`, если программа только одна.

### Несколько программ

URL можно разделять запятыми:

```text
RATING_URLS=https://abit.itmo.ru/rating/master/budget/PROGRAM_ID_1,https://abit.itmo.ru/rating/master/budget/PROGRAM_ID_2,https://abit.itmo.ru/rating/master/budget/PROGRAM_ID_3
```

или переносами строк.

Если число мест одинаковое для всех программ:

```text
GENERAL_PLACES=66
```

Если отличается, укажите значения в том же порядке, что и URL:

```text
GENERAL_PLACES=66,50,40
```

В этом случае:

```text
PROGRAM_ID_1 → 66 мест
PROGRAM_ID_2 → 50 мест
PROGRAM_ID_3 → 40 мест
```

Количество значений `GENERAL_PLACES` должно быть либо `1`, либо совпадать с количеством URL.

Название направления отдельно вводить не требуется — монитор получает его со страницы рейтинга.

### 3. Настройте Secrets

Откройте:

```text
Settings → Secrets and variables → Actions → Secrets
```

Создайте:

| Secret | Назначение |
| --- | --- |
| `TELEGRAM_BOT_TOKEN` | токен Telegram-бота |
| `TELEGRAM_CHAT_ID` | id пользователя или чата |

Не храните реальные значения в исходном коде или `.env.example`.

### 4. Проверьте ручной запуск

Upstream workflow содержит только `workflow_dispatch`, поэтому сам шаблон не выполняет автоматический мониторинг.

После настройки форка запустите:

```text
Actions → ITMO admission monitor → Run workflow
```

### 5. Включите cron в своём форке

В `.github/workflows/admission-monitor.yml` раскомментируйте:

```yaml
schedule:
  - cron: '*/30 * * * *'
```

После коммита ваш fork начнёт запускать монитор по расписанию.

> GitHub Actions schedule может стартовать с задержкой относительно указанной минуты.

Короткая инструкция есть в [`TEMPLATE_USAGE.md`](./TEMPLATE_USAGE.md), отдельный пример мультипрограммной настройки — в [`MULTI_PROGRAMS.md`](./MULTI_PROGRAMS.md).

## Локальный запуск

Требуется **Node.js 22+**.

```bash
git clone https://github.com/andrey8080/itmo-admission-monitor.git
cd itmo-admission-monitor
cp .env.example .env
```

Заполните `.env`, затем:

```bash
npm test
npm run check:local
```

## `.env`

Пример для нескольких программ:

```env
APPLICANT_ID=your_applicant_id
RATING_URLS=https://abit.itmo.ru/rating/master/budget/PROGRAM_ID_1,https://abit.itmo.ru/rating/master/budget/PROGRAM_ID_2
GENERAL_PLACES=66,50
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
STATE_FILE=.state/rating-state.json
```

`STATE_FILE` необязателен.

## Telegram-отчёт

Для каждой программы формируется отдельная секция:

```text
🎓 Название программы

🟢 Сейчас проходишь

Официальный срез: ...
Сырое место: ...
ОВП: ...
ВПП: ...
```

Если есть предыдущее состояние, ниже выводятся изменения метрик.

Если одна страница временно недоступна, в отчёте появится ошибка только для неё, а успешно загруженные программы всё равно будут показаны.

При большом количестве программ отчёт автоматически разбивается на несколько Telegram-сообщений.

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
│   ├── state.test.js
│   └── telegram.test.js
├── MULTI_PROGRAMS.md
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

Проверяются:

- одиночная и мультипрограммная конфигурация;
- соответствие `GENERAL_PLACES` количеству URL;
- парсинг рейтинга;
- расчёт ОВП/ВПП;
- форматирование Telegram-сообщений;
- частичные ошибки;
- разбиение длинных отчётов;
- миграция старого single-program state;
- отсутствие applicant ID в сохранённом snapshot.

## Privacy & security

В репозитории не должны храниться:

- реальный `APPLICANT_ID`;
- Telegram bot token;
- Telegram chat ID;
- `.env`;
- рабочий `.rating-state.json` или содержимое `.state/`.

Персональные параметры GitHub Actions передаются через **Variables**, Telegram credentials — через **Secrets**.

## Ограничения

Парсер зависит от `programList` внутри `__NEXT_DATA__` страниц рейтинга ИТМО. Если структура сайта изменится, `rating.js` потребуется адаптировать.

`GENERAL_PLACES` задаётся пользователем, потому что число мест общего конкурса может различаться между конкурсными группами.
