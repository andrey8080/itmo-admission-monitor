'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { sendTelegramMessage } = require('../telegram');

test('sends a Telegram message with HTML formatting', async () => {
  let request;

  const fetchImpl = async (url, options) => {
    request = { url, options };
    return {
      ok: true,
      json: async () => ({ ok: true })
    };
  };

  const result = await sendTelegramMessage(
    'test-token',
    '12345',
    '<b>Hello</b>',
    fetchImpl
  );

  assert.deepEqual(result, { ok: true });
  assert.equal(
    request.url,
    'https://api.telegram.org/bottest-token/sendMessage'
  );
  assert.equal(request.options.method, 'POST');
  assert.deepEqual(JSON.parse(request.options.body), {
    chat_id: '12345',
    text: '<b>Hello</b>',
    parse_mode: 'HTML',
    disable_web_page_preview: true
  });
});

test('requires Telegram credentials', async () => {
  await assert.rejects(
    () => sendTelegramMessage('', '12345', 'test', async () => {}),
    /TELEGRAM_BOT_TOKEN/
  );

  await assert.rejects(
    () => sendTelegramMessage('token', '', 'test', async () => {}),
    /TELEGRAM_CHAT_ID/
  );
});
