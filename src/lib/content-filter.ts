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
  return BLOCKED_WORDS.reduce(
    (result, word) =>
      result.replace(
        new RegExp(escapeRegExp(word), 'gi'),
        '*'.repeat(Array.from(word).length),
      ),
    value.trim(),
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
