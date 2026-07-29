import {
  type ComponentRef,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  KeyboardChatScrollView,
  KeyboardStickyView,
} from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '../../constants/colors';
import { maskProfanityInput } from '../../lib/content-filter';
import { supabase } from '../../lib/supabase';
import {
  getAssistantMessages,
  sendAssistantMessage,
  subscribeToAssistantInquiryStatus,
  subscribeToAssistantMessages,
  transitionAssistantInquiry,
  type AssistantInquiryStatus,
  type AssistantMessage,
} from '../../services/assistant-inquiries';

type Props = {
  inquiryId: string;
  status: AssistantInquiryStatus;
  canStartChat?: boolean;
  header?: ReactNode;
  onStatusChange?: (status: AssistantInquiryStatus) => void;
};

export function AssistantChatRoom({
  inquiryId,
  status,
  canStartChat = false,
  header,
  onStatusChange,
}: Props) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [liveStatus, setLiveStatus] = useState(status);
  const [userId, setUserId] = useState('');
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const listRef =
    useRef<ComponentRef<typeof KeyboardChatScrollView>>(null);

  useEffect(() => {
    setLiveStatus(status);
  }, [status]);

  const mergeMessages = useCallback((incoming: AssistantMessage[]) => {
    setMessages((current) => {
      const byId = new Map(current.map((message) => [message.id, message]));
      incoming.forEach((message) => byId.set(message.id, message));
      return [...byId.values()].sort((left, right) =>
        left.created_at.localeCompare(right.created_at),
      );
    });
  }, []);

  const refreshMessages = useCallback(async () => {
    mergeMessages(await getAssistantMessages(inquiryId));
  }, [inquiryId, mergeMessages]);

  useEffect(() => {
    let mounted = true;

    void Promise.all([
      getAssistantMessages(inquiryId),
      supabase?.auth.getUser(),
    ])
      .then(([loaded, auth]) => {
        if (!mounted) return;
        mergeMessages(loaded);
        setUserId(auth?.data.user?.id ?? '');
      })
      .catch((error) =>
        Alert.alert(
          '채팅 조회 실패',
          error instanceof Error
            ? error.message
            : '채팅을 불러오지 못했습니다.',
        ),
      )
      .finally(() => mounted && setIsLoading(false));

    const unsubscribeMessages = subscribeToAssistantMessages(
      inquiryId,
      (message) => {
        mergeMessages([message]);
      },
    );
    const unsubscribeStatus = subscribeToAssistantInquiryStatus(
      inquiryId,
      updateStatus,
    );
    const polling = setInterval(() => {
      void refreshMessages().catch(() => undefined);
    }, 2500);

    return () => {
      mounted = false;
      clearInterval(polling);
      unsubscribeMessages();
      unsubscribeStatus();
    };
  }, [inquiryId, mergeMessages, refreshMessages]);

  const updateStatus = (nextStatus: AssistantInquiryStatus) => {
    setLiveStatus(nextStatus);
    onStatusChange?.(nextStatus);
  };

  const send = async () => {
    if (!draft.trim() || isSending || liveStatus !== 'in_progress') return;

    const content = draft;
    setDraft('');

    try {
      setIsSending(true);
      await sendAssistantMessage(inquiryId, content);
      await refreshMessages();
    } catch (error) {
      setDraft(content);
      Alert.alert(
        '전송 실패',
        error instanceof Error ? error.message : '메시지를 보내지 못했습니다.',
      );
    } finally {
      setIsSending(false);
    }
  };

  const startChat = () => {
    Alert.alert(
      '채팅 시작',
      '학생과 실시간 상담을 시작하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '채팅 시작하기',
          onPress: () => void changeStatus('in_progress'),
        },
      ],
    );
  };

  const endChat = () => {
    Alert.alert(
      '상담 종료',
      '상담을 종료하면 더 이상 메시지를 보낼 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '상담 종료',
          style: 'destructive',
          onPress: () => void changeStatus('answered'),
        },
      ],
    );
  };

  const changeStatus = async (nextStatus: AssistantInquiryStatus) => {
    try {
      setIsChangingStatus(true);
      await transitionAssistantInquiry(inquiryId, nextStatus);
      updateStatus(nextStatus);
    } catch (error) {
      Alert.alert(
        '상담 상태 변경 실패',
        error instanceof Error
          ? error.message
          : '상담 상태를 변경하지 못했습니다.',
      );
    } finally {
      setIsChangingStatus(false);
    }
  };

  if (isLoading) {
    return <ActivityIndicator style={styles.loading} color={COLORS.navy} />;
  }

  return (
    <View style={styles.container}>
      <KeyboardChatScrollView
        ref={listRef}
        style={styles.chatScroll}
        contentContainerStyle={styles.list}
        automaticallyAdjustKeyboardInsets={false}
        keyboardDismissMode="interactive"
        keyboardLiftBehavior="always"
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => listRef.current?.scrollToEnd()}
        onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
      >
        {header ? <View style={styles.header}>{header}</View> : null}
        {messages.length === 0 ? (
          <Text style={styles.empty}>
            상담이 시작되면 이곳에서 실시간으로 대화할 수 있습니다.
          </Text>
        ) : (
          messages.map((item) => {
            const mine = item.sender_id === userId;

            return (
              <View
                key={item.id}
                style={[styles.bubble, mine ? styles.mine : styles.theirs]}
              >
                <Text style={[styles.message, mine && styles.mineText]}>
                  {item.content}
                </Text>
                <Text style={[styles.time, mine && styles.mineTime]}>
                  {formatTime(item.created_at)}
                </Text>
              </View>
            );
          })
        )}
      </KeyboardChatScrollView>

      {liveStatus === 'submitted' ? (
        canStartChat ? (
          <View style={styles.statusAction}>
            <Text style={styles.waitingText}>
              학생의 문의가 완료되었습니다. 채팅을 시작해 주세요.
            </Text>
            <Pressable
              disabled={isChangingStatus}
              onPress={startChat}
              style={[
                styles.primaryButton,
                isChangingStatus && styles.disabled,
              ]}
            >
              {isChangingStatus ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.primaryButtonText}>채팅 시작하기</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <View style={styles.waiting}>
            <Text style={styles.waitingText}>
              문의가 완료되었습니다. 조교가 채팅을 시작하면 상담할 수
              있습니다.
            </Text>
          </View>
        )
      ) : liveStatus === 'answered' ? (
        <View style={styles.closed}>
          <Text style={styles.closedText}>상담이 완료되었습니다.</Text>
        </View>
      ) : (
        <KeyboardStickyView
          offset={{ closed: 0, opened: insets.bottom }}
          style={[
            styles.chatFooter,
            { paddingBottom: insets.bottom },
          ]}
        >
          <View style={styles.composer}>
            <TextInput
              value={draft}
              onChangeText={(value) =>
                setDraft(maskProfanityInput(value))
              }
              multiline
              maxLength={5000}
              placeholder="메시지를 입력하세요"
              placeholderTextColor={COLORS.placeholder}
              keyboardAppearance="light"
              selectionColor={COLORS.navy}
              textAlignVertical="center"
              onFocus={() =>
                requestAnimationFrame(() =>
                  listRef.current?.scrollToEnd({ animated: true }),
                )
              }
              style={styles.input}
            />
            <Pressable
              disabled={!draft.trim() || isSending}
              onPress={() => void send()}
              style={[
                styles.send,
                (!draft.trim() || isSending) && styles.disabled,
              ]}
            >
              <Text style={styles.sendText}>전송</Text>
            </Pressable>
          </View>
          <Pressable
            disabled={isChangingStatus}
            onPress={endChat}
            style={[
              styles.endButton,
              isChangingStatus && styles.disabled,
            ]}
          >
            {isChangingStatus ? (
              <ActivityIndicator color={COLORS.error} />
            ) : (
              <Text style={styles.endButtonText}>상담 종료</Text>
            )}
          </Pressable>
        </KeyboardStickyView>
      )}
    </View>
  );
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  chatScroll: { flex: 1 },
  loading: { margin: 40 },
  list: { flexGrow: 1, padding: 18, paddingBottom: 24, gap: 10 },
  header: { marginBottom: 16 },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 16 },
  mine: { alignSelf: 'flex-end', backgroundColor: COLORS.navy },
  theirs: { alignSelf: 'flex-start', backgroundColor: '#EEF0F6' },
  message: { color: COLORS.text, fontSize: 14, lineHeight: 20 },
  mineText: { color: COLORS.white },
  time: { marginTop: 5, color: COLORS.subText, fontSize: 10 },
  mineTime: { color: '#D9DDEF' },
  empty: {
    marginTop: 50,
    paddingHorizontal: 16,
    color: COLORS.subText,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  chatFooter: { backgroundColor: COLORS.surface },
  composer: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  input: {
    flex: 1,
    maxHeight: 110,
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
  },
  send: {
    height: 46,
    paddingHorizontal: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: COLORS.navy,
  },
  sendText: { color: COLORS.white, fontSize: 14, fontWeight: '800' },
  disabled: { opacity: 0.45 },
  waiting: {
    padding: 18,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.softNavy,
  },
  waitingText: {
    color: COLORS.subText,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  statusAction: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  primaryButton: {
    height: 50,
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: COLORS.navy,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  endButton: {
    height: 48,
    marginHorizontal: 12,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F5B8B8',
    borderRadius: 13,
    backgroundColor: '#FFF5F5',
  },
  endButtonText: { color: COLORS.error, fontSize: 14, fontWeight: '800' },
  closed: {
    padding: 18,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: '#EAF8F0',
  },
  closedText: {
    color: COLORS.success,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
});
