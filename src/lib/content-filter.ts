const BLOCKED_WORDS = [
  '씨발',
  '시발',
  'ㅅㅂ',
  '병신',
  'ㅂㅅ',
  '개새끼',
  '새끼',
  '좆',
  '지랄',
  '미친놈',
  '미친년',
  '꺼져',
] as const;

export function maskProfanity(value: string) {
  return maskProfanityInput(value).trim();
}

export function maskProfanityInput(value: string) {
  return BLOCKED_WORDS.reduce(
    (result, word) =>
      result.replace(
        new RegExp(createFlexiblePattern(word), 'gi'),
        (match) => '*'.repeat(Array.from(match).length),
      ),
    value,
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createFlexiblePattern(value: string) {
  return Array.from(value)
    .map(escapeRegExp)
    .join('[\\s._\\-!@#$%^&*()~`\'"/\\\\|]*');
}
