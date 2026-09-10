'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { diffSnapshot, formatProgramMessages, formatSnapshot } = require('../format');

test('marks lower positions and larger buffers as improvements', () => {
  const changes = diffSnapshot(
    { rawPosition: 150, ovpPosition: 60, ovpBuffer: 6, vppPosition: 43, vppBuffer: 23, agreement: true, ovp: true, vpp: true },
    { rawPosition: 149, ovpPosition: 59, ovpBuffer: 7, vppPosition: 42, vppBuffer: 24, agreement: true, ovp: true, vpp: true }
  );
  assert.ok(changes.every((line) => line.startsWith('🟢')));
});

test('formats a complete Telegram status with program name', () => {
  const text = formatSnapshot({
    direction: 'Example master program',
    updateTime: '2026-08-19T13:10:41+03:00',
    sourceUrl: 'https://abit.itmo.ru/rating/master/budget/example',
    rawPosition: 149,
    ovpPosition: 60,
    ovpBuffer: 6,
    vppPosition: 43,
    vppBuffer: 23,
    generalPlaces: 66,
    agreement: true,
    ovp: true,
    vpp: true,
    targetOccupied: true
  });

  assert.match(text, /Example master program/);
  assert.match(text, /Сейчас проходишь/);
  assert.match(text, /<b>ОВП:<\/b> ✅ да 60\/66 \(запас 6\)/);
  assert.match(text, /<b>ВПП:<\/b> ✅ да 43\/66 \(запас 23\)/);
  assert.match(text, /19\.08\.2026/);
});

test('combines multiple programs into one Telegram message when it fits', () => {
  const base = {
    updateTime: '2026-08-19T13:10:41+03:00',
    rawPosition: 10,
    ovpPosition: 5,
    ovpBuffer: 5,
    vppPosition: 4,
    vppBuffer: 6,
    generalPlaces: 10,
    agreement: true,
    ovp: true,
    vpp: true
  };

  const messages = formatProgramMessages([
    { ok: true, snapshot: { ...base, direction: 'Program A' }, previous: null },
    { ok: true, snapshot: { ...base, direction: 'Program B' }, previous: null }
  ]);

  assert.equal(messages.length, 1);
  assert.match(messages[0], /Program A/);
  assert.match(messages[0], /Program B/);
});

test('includes per-program failures without hiding successful programs', () => {
  const messages = formatProgramMessages([
    {
      ok: true,
      snapshot: {
        direction: 'Program A',
        updateTime: '',
        rawPosition: 1,
        ovpPosition: 1,
        ovpBuffer: 9,
        vppPosition: 1,
        vppBuffer: 9,
        generalPlaces: 10,
        agreement: true,
        ovp: true,
        vpp: true
      },
      previous: null
    },
    {
      ok: false,
      sourceUrl: 'https://example.test/b',
      error: new Error('temporary failure')
    }
  ]);

  assert.match(messages[0], /Program A/);
  assert.match(messages[0], /Не удалось проверить программу/);
  assert.match(messages[0], /temporary failure/);
});

test('splits a large report into multiple Telegram messages', () => {
  const results = Array.from({ length: 30 }, (_, index) => ({
    ok: true,
    snapshot: {
      direction: `Program ${index} ${'x'.repeat(120)}`,
      updateTime: '',
      rawPosition: index + 1,
      ovpPosition: 1,
      ovpBuffer: 9,
      vppPosition: 1,
      vppBuffer: 9,
      generalPlaces: 10,
      agreement: true,
      ovp: true,
      vpp: true
    },
    previous: null
  }));

  const messages = formatProgramMessages(results, 800);
  assert.ok(messages.length > 1);
  assert.ok(messages.every((message) => message.length <= 800));
});
