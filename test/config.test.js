'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  parseHttpUrl,
  parseHttpUrlList,
  parsePositiveInt,
  parsePositiveIntList,
  readConfig
} = require('../config');

test('reads a single program from RATING_URL for backwards compatibility', () => {
  const config = readConfig({
    APPLICANT_ID: 'target-applicant',
    GENERAL_PLACES: '66',
    RATING_URL: 'https://example.test/rating',
    TELEGRAM_BOT_TOKEN: 'token',
    TELEGRAM_CHAT_ID: 'chat'
  });

  assert.deepEqual(config.programs, [
    {
      ratingUrl: 'https://example.test/rating',
      generalPlaces: 66
    }
  ]);
  assert.equal(config.stateFile, '.state/rating-state.json');
});

test('reads multiple programs from RATING_URLS', () => {
  const config = readConfig({
    APPLICANT_ID: 'target-applicant',
    GENERAL_PLACES: '66,50',
    RATING_URLS: 'https://example.test/one,\nhttps://example.test/two',
    TELEGRAM_BOT_TOKEN: 'token',
    TELEGRAM_CHAT_ID: 'chat'
  });

  assert.deepEqual(config.programs, [
    { ratingUrl: 'https://example.test/one', generalPlaces: 66 },
    { ratingUrl: 'https://example.test/two', generalPlaces: 50 }
  ]);
});

test('broadcasts one GENERAL_PLACES value to every program', () => {
  const config = readConfig({
    APPLICANT_ID: 'target-applicant',
    GENERAL_PLACES: '66',
    RATING_URLS: 'https://example.test/one,https://example.test/two',
    TELEGRAM_BOT_TOKEN: 'token',
    TELEGRAM_CHAT_ID: 'chat'
  });

  assert.deepEqual(
    config.programs.map((program) => program.generalPlaces),
    [66, 66]
  );
});

test('rejects mismatched GENERAL_PLACES list', () => {
  assert.throws(
    () => readConfig({
      APPLICANT_ID: 'target-applicant',
      GENERAL_PLACES: '66,50',
      RATING_URLS: 'https://example.test/one,https://example.test/two,https://example.test/three',
      TELEGRAM_BOT_TOKEN: 'token',
      TELEGRAM_CHAT_ID: 'chat'
    }),
    /either one value or 3 values/
  );
});

test('requires applicant id and rating URLs', () => {
  assert.throws(() => readConfig({}), /APPLICANT_ID is required/);

  assert.throws(
    () => readConfig({
      APPLICANT_ID: 'target-applicant',
      GENERAL_PLACES: '66',
      TELEGRAM_BOT_TOKEN: 'token',
      TELEGRAM_CHAT_ID: 'chat'
    }),
    /RATING_URLS is required/
  );
});

test('validates positive integer values', () => {
  assert.equal(parsePositiveInt('10', 'VALUE'), 10);
  assert.deepEqual(parsePositiveIntList('10,20', 'VALUE', 2), [10, 20]);
  assert.throws(() => parsePositiveInt('0', 'VALUE'), /positive integers/);
});

test('accepts only http and https rating URLs', () => {
  assert.equal(parseHttpUrl('https://example.test/path', 'URL'), 'https://example.test/path');
  assert.deepEqual(
    parseHttpUrlList('https://example.test/a,https://example.test/b', 'URLS'),
    ['https://example.test/a', 'https://example.test/b']
  );
  assert.throws(() => parseHttpUrl('file:///tmp/test', 'URL'), /http or https/);
});
