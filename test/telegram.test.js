'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { verifyWebhookSecret } = require('../telegram');

test('checks Telegram secret header case-insensitively', () => {
  assert.equal(verifyWebhookSecret({ headers: { 'X-Telegram-Bot-Api-Secret-Token': 'abc' } }, 'abc'), true);
  assert.equal(verifyWebhookSecret({ headers: { 'x-telegram-bot-api-secret-token': 'bad' } }, 'abc'), false);
});
