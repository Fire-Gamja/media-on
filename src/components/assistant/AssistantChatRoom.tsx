import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { COLORS } from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import {
  getAssistantMessages,
  sendAssistantMessage,
  subscribeToAssistantMessages,
  type AssistantMessage,
} from '../../services/assistant-inquiries';

type Props = {
  inquiryId: string;
  isClosed: boolean;
};

export function AssistantChatRoom({ inquiryId, isClosed }: Props) {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [userId, setUserId] = useState('');
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef<FlatList<AssistantMessage>>(null);

  useEffect(() => {
    let mounted = true;
    void Promise.all([
      getAssistantMessages(inquiryId),
      supabase?.auth.getUser(),
    ])
      .then(([loaded, auth]) => {
        if (!mounted) return;
        setMessages(loaded);
        setUserId(auth?.data.user?.id ?? '');
      })
      .catch((error) => Alert.alert('채팅 조회 실패', error.message))
      .finally(() => mounted && setIsLoading(false));

    const unsubscribe = subscribeToAssistantMessages(inquiryId, (message) => {
      setMessages((current) =>
        current.some((item) => item.id === message.id)
          ? current
          : [...current, message],
      );
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [inquiryId]);

  const send = async () => {
    if (!draft.trim() || isSending || isClosed) return;
    const content = draft;
    setDraft('');
    try {
      setIsSending(true);
      await sendAssistantMessage(inquiryId, content);
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

  if (isLoading) {
    return <ActivityIndicator style={styles.loading} color={COLORS.navy} />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd()}
        renderItem={({ item }) => {
          const mine = item.sender_id === userId;
          return (
            <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
              <Text style={[styles.message, mine && styles.mineText]}>
                {item.content}
              </Text>
              <Text style={[styles.time, mine && styles.mineTime]}>
                {formatTime(item.created_at)}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>첫 메시지를 남겨 주세요.</Text>
        }
      />
      {isClosed ? (
        <View style={styles.closed}>
          <Text style={styles.closedText}>종료된 상담입니다.</Text>
        </View>
      ) : (
        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            multiline
            maxLength={5000}
            placeholder="메시지를 입력하세요"
            placeholderTextColor={COLORS.placeholder}
            style={styles.input}
          />
          <Pressable
            disabled={!draft.trim() || isSending}
            onPress={() => void send()}
            style={[styles.send, (!draft.trim() || isSending) && styles.disabled]}
          >
            <Text style={styles.sendText}>전송</Text>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
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
  container: { flex: 1, minHeight: 420 },
  loading: { margin: 40 },
  list: { padding: 18, gap: 10 },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 16 },
  mine: { alignSelf: 'flex-end', backgroundColor: COLORS.navy },
  theirs: { alignSelf: 'flex-start', backgroundColor: '#EEF0F6' },
  message: { color: COLORS.text, fontSize: 14, lineHeight: 20 },
  mineText: { color: COLORS.white },
  time: { marginTop: 5, color: COLORS.subText, fontSize: 10 },
  mineTime: { color: '#D9DDEF' },
  empty: { marginTop: 50, textAlign: 'center', color: COLORS.subText },
  composer: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
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
    color: COLORS.text,
  },
  send: {
    height: 46,
    paddingHorizontal: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: COLORS.navy,
  },
  sendText: { color: COLORS.white, fontWeight: '800' },
  disabled: { opacity: 0.45 },
  closed: { padding: 18, borderTopWidth: 1, borderTopColor: COLORS.border },
  closedText: { textAlign: 'center', color: COLORS.subText, fontWeight: '700' },
});
