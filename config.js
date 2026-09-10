'use strict';

function readConfig(env = process.env) {
  const applicantId = readRequired(env, 'APPLICANT_ID');
  const ratingUrls = parseHttpUrlList(
    env.RATING_URLS?.trim() || env.RATING_URL?.trim(),
    'RATING_URLS'
  );
  const generalPlaces = parsePositiveIntList(
    readRequired(env, 'GENERAL_PLACES'),
    'GENERAL_PLACES',
    ratingUrls.length
  );

  return {
    applicantId,
    programs: ratingUrls.map((ratingUrl, index) => ({
      ratingUrl,
      generalPlaces: generalPlaces.length === 1
        ? generalPlaces[0]
        : generalPlaces[index]
    })),
    telegramBotToken: readRequired(env, 'TELEGRAM_BOT_TOKEN'),
    telegramChatId: readRequired(env, 'TELEGRAM_CHAT_ID'),
    stateFile: env.STATE_FILE?.trim() || '.state/rating-state.json'
  };
}

function readRequired(env, name) {
  const value = env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function splitList(value) {
  return String(value || '')
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parsePositiveInt(value, name) {
  const number = Number.parseInt(value, 10);
  if (!Number.isInteger(number) || number <= 0 || String(number) !== String(value).trim()) {
    throw new Error(`${name} must contain positive integers`);
  }
  return number;
}

function parsePositiveIntList(value, name, expectedCount) {
  const items = splitList(value);
  if (!items.length) throw new Error(`${name} is required`);

  const numbers = items.map((item) => parsePositiveInt(item, name));

  if (numbers.length !== 1 && numbers.length !== expectedCount) {
    throw new Error(
      `${name} must contain either one value or ${expectedCount} values`
    );
  }

  return numbers;
}

function parseHttpUrl(value, name) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must contain valid URLs`);
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`${name} must use http or https`);
  }
  return url.toString();
}

function parseHttpUrlList(value, name) {
  const items = splitList(value);
  if (!items.length) {
    throw new Error(
      `${name} is required (RATING_URL is supported for a single program)`
    );
  }
  return items.map((item) => parseHttpUrl(item, name));
}

module.exports = {
  parseHttpUrl,
  parseHttpUrlList,
  parsePositiveInt,
  parsePositiveIntList,
  readConfig,
  readRequired,
  splitList
};
