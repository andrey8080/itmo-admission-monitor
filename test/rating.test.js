'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { analyzeProgramList, parseRatingPage } = require('../rating');

const programList = {
  update_time: '2026-08-19T13:10:41+03:00',
  direction: {
    direction_title: 'Example master program',
    budget_min: 67,
    target_reception: 1
  },
  by_target_quota: [{ highest_passageway_priority: true, is_send_agreement: true }],
  general_competition: [
    candidate('candidate-1', 2, true, true),
    candidate('candidate-2', 3, false, false),
    candidate('target-applicant', 4, true, true),
    candidate('candidate-4', 5, true, false),
    candidate('candidate-5', 6, false, true)
  ]
};

test('calculates raw, OVP and VPP positions independently', () => {
  const result = analyzeProgramList(programList, 'target-applicant', 66, 'https://example.test');
  assert.equal(result.rawPosition, 4);
  assert.equal(result.ovpPosition, 2);
  assert.equal(result.vppPosition, 2);
  assert.equal(result.ovpBelow, 1);
  assert.equal(result.vppBelow, 1);
  assert.equal(result.ovpBuffer, 64);
  assert.equal(result.vppBuffer, 64);
  assert.equal(result.targetOccupied, true);
  assert.equal('applicantId' in result, false);
});

test('extracts programList from a Next.js page', () => {
  const nextData = JSON.stringify({ props: { pageProps: { programList } } });
  const html = `<html><script id="__NEXT_DATA__" type="application/json">${nextData}</script></html>`;
  assert.equal(parseRatingPage(html, 'target-applicant', 66).rawPosition, 4);
});

test('does not expose configured applicant id in errors', () => {
  assert.throws(
    () => analyzeProgramList(programList, 'private-value', 66),
    (error) => !error.message.includes('private-value') && /was not found/.test(error.message)
  );
});

function candidate(sspvoId, position, mainTop, highest) {
  return {
    sspvo_id: sspvoId,
    position,
    priority: 1,
    total_scores: 100,
    is_send_agreement: true,
    main_top_priority: mainTop,
    highest_passageway_priority: highest
  };
}
