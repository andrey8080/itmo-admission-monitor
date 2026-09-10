'use strict';

function yesNo(value) {
  return value ? '✅ да' : '❌ нет';
}

function signed(number) {
  return number > 0 ? `+${number}` : String(number);
}

function formatUpdateTime(value) {
  if (!value) return 'не указано';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date) + ' МСК';
}

function formatSnapshot(snapshot, previous = null) {
  const title = snapshot.ovp && snapshot.vpp
    ? '🟢 <b>Сейчас проходишь</b>'
    : snapshot.ovp
      ? '🟡 <b>ОВП есть, но ВПП пока нет</b>'
      : '🔴 <b>ОВП сейчас нет</b>';

  const lines = [
    title,
    '',
    `<b>Официальный срез:</b> ${escapeHtml(formatUpdateTime(snapshot.updateTime))}`,
    `<b>Сырое место:</b> ${snapshot.rawPosition}`,
    `<b>ОВП:</b> ${yesNo(snapshot.ovp)} ${snapshot.ovpPosition}/${snapshot.generalPlaces} (запас ${snapshot.ovpBuffer})`,
    `<b>ВПП:</b> ${yesNo(snapshot.vpp)} ${snapshot.vppPosition}/${snapshot.generalPlaces} (запас ${snapshot.vppBuffer})`,
  ];

  if (previous) {
    const changes = diffSnapshot(previous, snapshot);
    lines.push(
      '',
      changes.length
        ? '<b>Метрики изменились:</b>'
        : '<b>Метрики не изменились.</b>'
    );
    lines.push(...changes.map((change) => `• ${change}`));
  }

  return lines.join('\n');
}

function diffSnapshot(previous, current) {
  const changes = [];
  addNumericChange(changes, 'Сырое место', previous.rawPosition, current.rawPosition, true);
  addNumericChange(changes, 'ОВП-позиция', previous.ovpPosition, current.ovpPosition, true);
  addNumericChange(changes, 'Запас ОВП', previous.ovpBuffer, current.ovpBuffer, false);
  addNumericChange(changes, 'ВПП-позиция', previous.vppPosition, current.vppPosition, true);
  addNumericChange(changes, 'Запас ВПП', previous.vppBuffer, current.vppBuffer, false);
  addBooleanChange(changes, 'Согласие', previous.agreement, current.agreement);
  addBooleanChange(changes, 'ОВП', previous.ovp, current.ovp);
  addBooleanChange(changes, 'ВПП', previous.vpp, current.vpp);
  return changes;
}

function addNumericChange(changes, label, oldValue, newValue, lowerIsBetter) {
  if (oldValue === newValue) return;
  const delta = newValue - oldValue;
  const improved = lowerIsBetter ? delta < 0 : delta > 0;
  changes.push(`${improved ? '🟢' : '🔴'} ${label}: ${oldValue} → ${newValue} (${signed(delta)})`);
}

function addBooleanChange(changes, label, oldValue, newValue) {
  if (oldValue === newValue) return;
  changes.push(`${newValue ? '🟢' : '🔴'} ${label}: ${newValue ? 'да' : 'нет'}`);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

module.exports = { diffSnapshot, escapeHtml, formatSnapshot, formatUpdateTime };
