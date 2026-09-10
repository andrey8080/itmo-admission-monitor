'use strict';

function readConfig(env = process.env) {
  return {
    applicantId: readRequired(env, 'APPLICANT_ID'),
    generalPlaces: parsePositiveInt(readRequired(env, 'GENERAL_PLACES'), 'GENERAL_PLACES'),
    ratingUrl: parseHttpUrl(readRequired(env, 'RATING_URL'), 'RATING_URL'),
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

function parsePositiveInt(value, name) {
  const number = Number.parseInt(value, 10);
  if (!Number.isInteger(number) || number <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return number;
}

function parseHttpUrl(value, name) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid URL`);
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`${name} must use http or https`);
  }
  return url.toString();
}

module.exports = { parseHttpUrl, parsePositiveInt, readConfig, readRequired };
