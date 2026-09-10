'use strict';

const NEXT_DATA_RE =
  /<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i;

const FETCH_ATTEMPTS = 3;
const FETCH_TIMEOUT_MS = 60_000;
const RETRY_DELAY_MS = 3_000;

async function fetchRating(
  url,
  applicantId,
  generalPlaces,
  fetchImpl = fetch
) {
  let lastError;

  for (let attempt = 1; attempt <= FETCH_ATTEMPTS; attempt += 1) {
    let response;

    try {
      console.log(
        `[${new Date().toISOString()}] ` +
        `Загрузка рейтинга ИТМО, попытка ${attempt}/${FETCH_ATTEMPTS}`
      );

      response = await fetchImpl(url, {
        headers: {
          accept: 'text/html,application/xhtml+xml',
          'accept-language': 'ru-RU,ru;q=0.9,en;q=0.8',
          'cache-control': 'no-cache',
          pragma: 'no-cache',
          'user-agent':
            'Mozilla/5.0 (X11; Linux x86_64) ' +
            'AppleWebKit/537.36 (KHTML, like Gecko) ' +
            'Chrome/144.0.0.0 Safari/537.36'
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
      });

      if (!response.ok) {
        throw new Error(
          `ITMO returned HTTP ${response.status} ${response.statusText}`
        );
      }

      const html = await response.text();

      console.log(
        `[${new Date().toISOString()}] ` +
        `Страница ИТМО загружена: ${html.length} символов`
      );

      return parseRatingPage(
        html,
        applicantId,
        generalPlaces,
        url
      );
    } catch (error) {
      lastError = error;

      console.error(
        JSON.stringify({
          event: 'rating-fetch-error',
          attempt,
          attempts: FETCH_ATTEMPTS,
          name: error.name,
          message: error.message,
          cause: error.cause
            ? {
                name: error.cause.name,
                code: error.cause.code,
                errno: error.cause.errno,
                syscall: error.cause.syscall,
                address: error.cause.address,
                port: error.cause.port,
                message: error.cause.message
              }
            : null
        })
      );

      try {
        await response?.body?.cancel();
      } catch {
        // Поток уже мог закрыться с ошибкой.
      }

      if (attempt < FETCH_ATTEMPTS) {
        const delayMs = RETRY_DELAY_MS * attempt;

        console.log(
          `[${new Date().toISOString()}] ` +
          `Следующая попытка через ${delayMs / 1000} сек.`
        );

        await delay(delayMs);
      }
    }
  }

  throw new Error(
    `Не удалось загрузить рейтинг ИТМО после ${FETCH_ATTEMPTS} попыток: ` +
    `${lastError?.message || 'неизвестная ошибка'}`,
    {
      cause: lastError
    }
  );
}

function parseRatingPage(
  html,
  applicantId,
  generalPlaces,
  sourceUrl = ''
) {
  const match = html.match(NEXT_DATA_RE);

  if (!match) {
    throw new Error(
      'The ITMO page does not contain __NEXT_DATA__'
    );
  }

  let nextData;

  try {
    nextData = JSON.parse(match[1]);
  } catch (error) {
    throw new Error(
      `Cannot parse ITMO __NEXT_DATA__: ${error.message}`,
      {
        cause: error
      }
    );
  }

  return analyzeProgramList(
    nextData?.props?.pageProps?.programList,
    applicantId,
    generalPlaces,
    sourceUrl
  );
}

function analyzeProgramList(
  programList,
  applicantId,
  generalPlaces,
  sourceUrl = ''
) {
  if (
    !programList ||
    !Array.isArray(programList.general_competition)
  ) {
    throw new Error(
      'The ITMO page has an unexpected programList structure'
    );
  }

  const candidates = programList.general_competition;

  const index = candidates.findIndex(
    (candidate) =>
      String(candidate.sspvo_id) === String(applicantId)
  );

  if (index < 0) {
    throw new Error(
      'Configured applicant was not found in the general competition'
    );
  }

  const candidate = candidates[index];
  const atOrAbove = candidates.slice(0, index + 1);
  const below = candidates.slice(index + 1);

  const ovpPosition = atOrAbove.filter(
    (item) => item.main_top_priority === true
  ).length;

  const vppPosition = atOrAbove.filter(
    (item) => item.highest_passageway_priority === true
  ).length;

  return {
    direction:
      programList.direction?.direction_title || '',

    updateTime:
      programList.update_time || '',

    sourceUrl,

    totalPlaces:
      programList.direction?.budget_min ?? null,

    targetPlaces:
      programList.direction?.target_reception ?? 0,

    generalPlaces,

    rawPosition:
      candidate.position,

    priority:
      candidate.priority,

    totalScore:
      candidate.total_scores,

    agreement:
      candidate.is_send_agreement === true,

    ovp:
      candidate.main_top_priority === true,

    vpp:
      candidate.highest_passageway_priority === true,

    ovpPosition,

    ovpBuffer:
      generalPlaces - ovpPosition,

    vppPosition,

    vppBuffer:
      generalPlaces - vppPosition,

    ovpBelow: below.filter(
      (item) => item.main_top_priority === true
    ).length,

    vppBelow: below.filter(
      (item) => item.highest_passageway_priority === true
    ).length,

    targetOccupied:
      (programList.by_target_quota || []).some(
        (item) =>
          item.highest_passageway_priority === true &&
          item.is_send_agreement === true
      )
  };
}

function snapshotFingerprint(snapshot) {
  const fields = [
    'updateTime',
    'rawPosition',
    'priority',
    'totalScore',
    'agreement',
    'ovp',
    'vpp',
    'ovpPosition',
    'ovpBuffer',
    'vppPosition',
    'vppBuffer',
    'targetOccupied'
  ];

  return JSON.stringify(
    Object.fromEntries(
      fields.map((field) => [
        field,
        snapshot[field]
      ])
    )
  );
}

function delay(ms) {
  return new Promise(
    (resolve) => setTimeout(resolve, ms)
  );
}

module.exports = {
  analyzeProgramList,
  fetchRating,
  parseRatingPage,
  snapshotFingerprint
};
