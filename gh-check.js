'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { readConfig } = require('./config');
const { fetchRating } = require('./rating');
const { formatSnapshot } = require('./format');
const { sendTelegramMessage } = require('./telegram');

async function main() {
  const config = readConfig();
  const previous = readJson(config.stateFile);

  try {
    const current = await fetchRating(
      config.ratingUrl,
      config.applicantId,
      config.generalPlaces
    );

    const message = formatSnapshot(current, previous);
    await sendTelegramMessage(
      config.telegramBotToken,
      config.telegramChatId,
      message
    );

    writeJson(config.stateFile, current);

    console.log(
      JSON.stringify({
        event: 'rating-check-ok',
        updateTime: current.updateTime,
        rawPosition: current.rawPosition,
        ovp: current.ovp,
        vpp: current.vpp,
        ovpPosition: current.ovpPosition,
        vppPosition: current.vppPosition
      })
    );
  } catch (error) {
    console.error(error);

    try {
      await sendTelegramMessage(
        config.telegramBotToken,
        config.telegramChatId,
        `🔴 <b>Ошибка проверки рейтинга</b>\n\n${escapeHtml(error.message || String(error))}`
      );
    } catch (notifyError) {
      console.error('Cannot notify Telegram about failure:', notifyError);
    }

    process.exitCode = 1;
  }
}

function readJson(fileName) {
  try {
    const text = fs.readFileSync(fileName, 'utf8');
    return JSON.parse(text);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

function writeJson(fileName, value) {
  const fullPath = path.resolve(fileName);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

main();
