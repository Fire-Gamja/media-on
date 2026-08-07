const FLEXIBLE_GAP = '[\\s._\\-!@#$%^&*()~`\'"/\\\\|]*';

// 자주 쓰이는 축약, 발음대로 쓴 오타, 자모 표기까지 같은 계열로 처리합니다.
// 긴 표현부터 검사해 일부만 가려지고 나머지가 노출되는 경우를 줄입니다.
const PROFANITY_PATTERNS = [
  `개+${FLEXIBLE_GAP}(?:새+|쌔+|색+)${FLEXIBLE_GAP}(?:끼+|기+|키+|꺄+)`,
  `(?:씨+|시+|씹+|십+)${FLEXIBLE_GAP}(?:발+|팔+|벌+)(?!점)`,
  `(?:미친|미췬)${FLEXIBLE_GAP}(?:놈+|년+|새끼|색끼|인간)`,
  `(?:호로|후레)${FLEXIBLE_GAP}(?:자식|새끼|색끼)`,
  `(?:새+|쌔+|색+)${FLEXIBLE_GAP}(?:끼+|기+|키+|꺄+)`,
  `개+${FLEXIBLE_GAP}(?:새+|쌔+)(?!우)`,
  `개+${FLEXIBLE_GAP}색+(?!상)`,
  `(?:병+|빙+|븅+|등+)${FLEXIBLE_GAP}신+`,
  `(?:지+|쥐+)${FLEXIBLE_GAP}(?:랄+|럴+)`,
  `(?:좆+|좇+|좃+|졷+|죶+)`,
  `(?:존+|죤+|줜+)${FLEXIBLE_GAP}(?:나+|내+)`,
  `(?:졸+|죨+)${FLEXIBLE_GAP}라+`,
  `(?:조+|좆+)${FLEXIBLE_GAP}까+`,
  `개+${FLEXIBLE_GAP}같+`,
  `(?:엿+${FLEXIBLE_GAP}(?:먹|같)|닥+${FLEXIBLE_GAP}쳐+|꺼+${FLEXIBLE_GAP}져+|뒤+${FLEXIBLE_GAP}져+|디+${FLEXIBLE_GAP}져+)`,
  `(?:또+${FLEXIBLE_GAP}라이+|양+${FLEXIBLE_GAP}아치+|꼴+${FLEXIBLE_GAP}(?:통+|값+))`,
  `ㅅ${FLEXIBLE_GAP}ㅂ`,
  `ㅂ${FLEXIBLE_GAP}ㅅ`,
  `ㅈ${FLEXIBLE_GAP}ㄹ`,
  `f${FLEXIBLE_GAP}u${FLEXIBLE_GAP}c${FLEXIBLE_GAP}k`,
  `s${FLEXIBLE_GAP}h${FLEXIBLE_GAP}i${FLEXIBLE_GAP}t`,
  `b${FLEXIBLE_GAP}i${FLEXIBLE_GAP}t${FLEXIBLE_GAP}c${FLEXIBLE_GAP}h`,
] as const;

export function maskProfanity(value: string) {
  return maskProfanityInput(value).trim();
}

export function maskProfanityInput(value: string) {
  return PROFANITY_PATTERNS.reduce(
    (result, pattern) =>
      result.replace(
        new RegExp(pattern, 'giu'),
        (match) => '*'.repeat(Array.from(match).length),
      ),
    value,
  );
}
