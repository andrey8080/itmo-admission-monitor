'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { readConfig } = require('./config');
const { fetchRating } = require('./rating');
const { escapeHtml, formatProgramMessages } = require('./format');
const { sendTelegramMessage } = require('./telegram');

const MAX_CONCURRENT_PROGRAMS = 4;

async function main() {
  const config = readConfig();
  const previousState = readJson(config.stateFile);
  const results = await checkPrograms(config, previousState);
  const messages = formatProgramMessages(results);

  for (const message of messages) {
    await sendTelegramMessage(
      config.telegramBotToken,
      config.telegramChatId,
      message
    );
  }

  writeJson(
    config.stateFile,
    buildNextState(config.programs, previousState, results)
  );

  const failed = results.filter((result) => !result.ok);

  console.log(
    JSON.stringify({
      event: 'rating-check-finished',
      programs: results.length,
      succeeded: results.length - failed.length,
      failed: failed.length,
      snapshots: results
        .filter((result) => result.ok)
        .map((result) => ({
          direction: result.snapshot.direction,
          updateTime: result.snapshot.updateTime,
          rawPosition: result.snapshot.rawPosition,
          ovp: result.snapshot.ovp,
          vpp: result.snapshot.vpp,
          ovpPosition: result.snapshot.ovpPosition,
          vppPosition: result.snapshot.vppPosition
        }))
    })
  );

  if (failed.length) {
    process.exitCode = 1;
  }
}

async function checkPrograms(config, previousState) {
  const results = new Array(config.programs.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < config.programs.length) {
      const index = nextIndex;
      nextIndex += 1;

      const program = config.programs[index];
      const previous = getPreviousSnapshot(
        previousState,
        program.ratingUrl,
        config.programs.length
      );

      try {
        const snapshot = await fetchRating(
          program.ratingUrl,
          config.applicantId,
          program.generalPlaces
        );

        results[index] = {
          ok: true,
          sourceUrl: program.ratingUrl,
          snapshot,
          previous
        };
      } catch (error) {
        console.error(
          JSON.stringify({
            event: 'program-check-error',
            sourceUrl: program.ratingUrl,
            message: error.message
          })
        );

        results[index] = {
          ok: false,
          sourceUrl: program.ratingUrl,
          error,
          previous
        };
      }
    }
  }

  const workerCount = Math.min(
    MAX_CONCURRENT_PROGRAMS,
    config.programs.length
  );

  await Promise.all(
    Array.from({ length: workerCount }, () => worker())
  );

  return results;
}

function getPreviousSnapshot(previousState, sourceUrl, programCount) {
  if (!previousState) return null;

  if (
    previousState.version === 2 &&
    previousState.programs &&
    typeof previousState.programs === 'object'
  ) {
    return previousState.programs[sourceUrl] || null;
  }

  if (programCount === 1 && !previousState.programs) {
    return previousState;
  }

  return null;
}

function buildNextState(programs, previousState, results) {
  const byUrl = new Map(
    results.map((result) => [result.sourceUrl, result])
  );

  const nextPrograms = {};

  for (const program of programs) {
    const result = byUrl.get(program.ratingUrl);

    if (result?.ok) {
      nextPrograms[program.ratingUrl] = result.snapshot;
      continue;
    }

    const previous = getPreviousSnapshot(
      previousState,
      program.ratingUrl,
      programs.length
    );

    if (previous) {
      nextPrograms[program.ratingUrl] = previous;
    }
  }

  return {
    version: 2,
    programs: nextPrograms
  };
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

if (require.main === module) {
  main().catch(async (error) => {
    console.error(error);

    try {
      const config = readConfig();
      await sendTelegramMessage(
        config.telegramBotToken,
        config.telegramChatId,
        `🔴 <b>Ошибка мониторинга рейтинга</b>\n\n${escapeHtml(error.message || String(error))}`
      );
    } catch (notifyError) {
      console.error('Cannot notify Telegram about failure:', notifyError);
    }

    process.exitCode = 1;
  });
}

module.exports = {
  MAX_CONCURRENT_PROGRAMS,
  buildNextState,
  checkPrograms,
  getPreviousSnapshot,
  main,
  readJson,
  writeJson
};
