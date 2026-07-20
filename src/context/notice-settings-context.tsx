import {
  createContext,
  type PropsWithChildren,
  useContext,
  useState,
} from 'react';

export const NOTICE_COUNT_OPTIONS = [3, 5, 7] as const;

export type NoticeCount = (typeof NOTICE_COUNT_OPTIONS)[number];

type NoticeSettingsContextValue = {
  noticeCount: NoticeCount;
  setNoticeCount: (count: NoticeCount) => void;
};

const NoticeSettingsContext = createContext<
  NoticeSettingsContextValue | undefined
>(undefined);

export function NoticeSettingsProvider({ children }: PropsWithChildren) {
  const [noticeCount, setNoticeCount] = useState<NoticeCount>(3);

  return (
    <NoticeSettingsContext.Provider value={{ noticeCount, setNoticeCount }}>
      {children}
    </NoticeSettingsContext.Provider>
  );
}

export function useNoticeSettings() {
  const context = useContext(NoticeSettingsContext);

  if (!context) {
    throw new Error(
      'useNoticeSettings must be used within NoticeSettingsProvider.',
    );
  }

  return context;
}
