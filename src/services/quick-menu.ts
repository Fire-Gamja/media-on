import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DEFAULT_QUICK_MENU_IDS,
  QUICK_MENU_ITEMS,
  type QuickMenuId,
} from '../constants/student-quick-menu';

const STORAGE_KEY = '@media-on/quick-menu-v1';
const VALID_IDS = new Set(QUICK_MENU_ITEMS.map((item) => item.id));

export async function getQuickMenuIds(): Promise<QuickMenuId[]> {
  const storedValue = await AsyncStorage.getItem(STORAGE_KEY);

  if (!storedValue) return [...DEFAULT_QUICK_MENU_IDS];

  try {
    const parsed = JSON.parse(storedValue) as unknown;
    if (!Array.isArray(parsed)) return [...DEFAULT_QUICK_MENU_IDS];

    const normalized = Array.from(
      new Set(
        parsed.filter(
          (value): value is QuickMenuId =>
            typeof value === 'string' && VALID_IDS.has(value as QuickMenuId),
        ),
      ),
    ).slice(0, 8);

    return normalized.length > 0
      ? normalized
      : [...DEFAULT_QUICK_MENU_IDS];
  } catch {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return [...DEFAULT_QUICK_MENU_IDS];
  }
}

export async function saveQuickMenuIds(ids: readonly QuickMenuId[]) {
  const normalized = Array.from(new Set(ids)).filter((id) =>
    VALID_IDS.has(id),
  );

  if (normalized.length === 0 || normalized.length > 8) {
    throw new Error('빠른 메뉴는 1개 이상 8개 이하로 설정해 주세요.');
  }

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
}

export async function resetQuickMenuIds() {
  await AsyncStorage.removeItem(STORAGE_KEY);
  return [...DEFAULT_QUICK_MENU_IDS];
}
