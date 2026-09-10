'use strict';

async function sendTelegramMessage(token, chatId, text, fetchImpl = fetch) {
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not configured');
  if (!chatId) throw new Error('TELEGRAM_CHAT_ID is not configured');

  const response = await fetchImpl(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    }),
    signal: AbortSignal.timeout(10_000)
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Telegram returned HTTP ${response.status}: ${details.slice(0, 300)}`);
  }
  return response.json();
}

function normalizeHeaders(headers = {}) {
  return Object.fromEntries(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]));
}

function verifyWebhookSecret(event, expectedSecret) {
  if (!expectedSecret) return false;
  const headers = normalizeHeaders(event?.headers);
  return headers['x-telegram-bot-api-secret-token'] === expectedSecret;
}

module.exports = { sendTelegramMessage, verifyWebhookSecret };
