'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { buildNextState, getPreviousSnapshot } = require('../gh-check');

test('supports legacy single-program state during migration', () => {
  const legacy = {
    direction: 'Legacy program',
    sourceUrl: 'https://example.test/one',
    rawPosition: 10
  };

  assert.equal(
    getPreviousSnapshot(legacy, 'https://example.test/one', 1),
    legacy
  );
  assert.equal(
    getPreviousSnapshot(legacy, 'https://example.test/one', 2),
    null
  );
});

test('stores snapshots by program URL and preserves previous state on partial failure', () => {
  const programs = [
    { ratingUrl: 'https://example.test/one', generalPlaces: 10 },
    { ratingUrl: 'https://example.test/two', generalPlaces: 20 }
  ];

  const previousState = {
    version: 2,
    programs: {
      'https://example.test/two': { rawPosition: 20 }
    }
  };

  const next = buildNextState(programs, previousState, [
    {
      ok: true,
      sourceUrl: 'https://example.test/one',
      snapshot: { rawPosition: 5 }
    },
    {
      ok: false,
      sourceUrl: 'https://example.test/two',
      error: new Error('temporary')
    }
  ]);

  assert.deepEqual(next, {
    version: 2,
    programs: {
      'https://example.test/one': { rawPosition: 5 },
      'https://example.test/two': { rawPosition: 20 }
    }
  });
});
