'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { diffSnapshot, formatSnapshot } = require('../format');

test('marks lower positions and larger buffers as improvements', () => {
  const changes = diffSnapshot(
    { rawPosition: 150, ovpPosition: 60, ovpBuffer: 6, vppPosition: 43, vppBuffer: 23, agreement: true, ovp: true, vpp: true },
    { rawPosition: 149, ovpPosition: 59, ovpBuffer: 7, vppPosition: 42, vppBuffer: 24, agreement: true, ovp: true, vpp: true }
  );
  assert.ok(changes.every((line) => line.startsWith('🟢')));
});

test('formats a complete Telegram status', () => {
  const text = formatSnapshot({
    updateTime: '2026-08-19T13:10:41+03:00',
    sourceUrl: 'https://abit.itmo.ru/rating/master/budget/2444',
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
  assert.match(text, /Сейчас проходишь/);
  assert.match(text, /<b>ОВП:<\/b> ✅ да 60\/66 \(запас 6\)/);
  assert.match(text, /<b>ВПП:<\/b> ✅ да 43\/66 \(запас 23\)/);
  assert.match(text, /19\.08\.2026/);
});
