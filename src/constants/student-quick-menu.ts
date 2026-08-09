import type { ImageSourcePropType } from 'react-native';

import type { TranslationKey } from '../i18n/translations';

export type QuickMenuId =
  | 'notice'
  | 'equipment'
  | 'room'
  | 'report'
  | 'preGraduation'
  | 'assistant'
  | 'faq'
  | 'language'
  | 'timetable';

export type QuickMenuItem = {
  id: QuickMenuId;
  titleKey: TranslationKey;
  icon: ImageSourcePropType;
};

export const QUICK_MENU_ITEMS: readonly QuickMenuItem[] = [
  {
    id: 'notice',
    titleKey: 'home.notice',
    icon: require('../../assets/figma/student-v2/file-text.svg'),
  },
  {
    id: 'equipment',
    titleKey: 'home.equipment',
    icon: require('../../assets/figma/student-v2/tool.svg'),
  },
  {
    id: 'room',
    titleKey: 'home.room',
    icon: require('../../assets/figma/student-v2/monitor.svg'),
  },
  {
    id: 'report',
    titleKey: 'home.report',
    icon: require('../../assets/figma/student-v2/toolbox.svg'),
  },
  {
    id: 'preGraduation',
    titleKey: 'home.preGraduation',
    icon: require('../../assets/figma/student-v2/book-open.svg'),
  },
  {
    id: 'assistant',
    titleKey: 'home.assistant',
    icon: require('../../assets/figma/student-v2/message-square.svg'),
  },
  {
    id: 'faq',
    titleKey: 'home.faq',
    icon: require('../../assets/figma/student-v2/help-circle.svg'),
  },
  {
    id: 'language',
    titleKey: 'home.language',
    icon: require('../../assets/figma/student-v2/globe.svg'),
  },
  {
    id: 'timetable',
    titleKey: 'home.timetable',
    icon: require('../../assets/figma/student-v2/calendar.svg'),
  },
];

export const DEFAULT_QUICK_MENU_IDS: readonly QuickMenuId[] = [
  'notice',
  'equipment',
  'room',
  'report',
  'preGraduation',
  'assistant',
  'faq',
  'language',
];

export const QUICK_MENU_ITEM_BY_ID = new Map(
  QUICK_MENU_ITEMS.map((item) => [item.id, item]),
);
