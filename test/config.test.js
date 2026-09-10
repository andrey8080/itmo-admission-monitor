'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { parseHttpUrl, parsePositiveInt, readConfig } = require('../config');

test('reads configuration from environment only', () => {
  const config = readConfig({
    APPLICANT_ID: 'target-applicant',
    GENERAL_PLACES: '66',
    RATING_URL: 'https://example.test/rating',
    TELEGRAM_BOT_TOKEN: 'token',
    TELEGRAM_CHAT_ID: 'chat'
  });

  assert.equal(config.applicantId, 'target-applicant');
  assert.equal(config.generalPlaces, 66);
  assert.equal(config.ratingUrl, 'https://example.test/rating');
  assert.equal(config.stateFile, '.state/rating-state.json');
});

test('requires applicant id and credentials', () => {
  assert.throws(() => readConfig({}), /APPLICANT_ID is required/);
});

test('validates positive integer values', () => {
  assert.equal(parsePositiveInt('10', 'VALUE'), 10);
  assert.throws(() => parsePositiveInt('0', 'VALUE'), /positive integer/);
});

test('accepts only http and https rating URLs', () => {
  assert.equal(parseHttpUrl('https://example.test/path', 'URL'), 'https://example.test/path');
  assert.throws(() => parseHttpUrl('file:///tmp/test', 'URL'), /http or https/);
});
