import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../constants/colors';
import { maskProfanityInput } from '../../lib/content-filter';
import { getAuthErrorMessage } from '../../services/auth';
import {
  createNotice,
  getAdminNotice,
  updateNotice,
} from '../../services/notices';

export default function AdminNoticeEditorScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const noticeId = Array.isArray(id) ? id[0] : id;
  const isEditing = Boolean(noticeId);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [isUrgent, setIsUrgent] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!noticeId) return;

    void getAdminNotice(noticeId)
      .then((notice) => {
        setTitle(notice.title);
        setContent(notice.content);
        setIsPublished(notice.is_published);
        setIsUrgent(notice.is_urgent);
      })
      .catch((error) => {
        Alert.alert('조회 실패', getAuthErrorMessage(error), [
          { text: '확인', onPress: () => router.back() },
        ]);
      })
      .finally(() => setIsLoading(false));
  }, [noticeId]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('입력 확인', '제목과 내용을 모두 입력해 주세요.');
      return;
    }

    try {
      setIsSaving(true);
      const input = { title, content, isPublished, isUrgent };

      if (noticeId) {
        await updateNotice(noticeId, input);
      } else {
        await createNotice(input);
      }

      Alert.alert('저장 완료', '공지사항이 저장되었습니다.', [
        { text: '확인', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('저장 실패', getAuthErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>
            {isEditing ? '공지 수정' : '공지 작성'}
          </Text>
          <View style={styles.headerSide} />
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.navy} />
          </View>
        ) : (
          <>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={
                Platform.OS === 'ios' ? 'interactive' : 'on-drag'
              }
              automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            >
              <Text style={styles.label}>제목</Text>
              <TextInput
                value={title}
                onChangeText={(value) =>
                  setTitle(maskProfanityInput(value))
                }
                maxLength={200}
                placeholder="공지 제목을 입력해 주세요"
                placeholderTextColor={COLORS.placeholder}
                style={styles.titleInput}
              />

              <Text style={[styles.label, styles.contentLabel]}>내용</Text>
              <TextInput
                value={content}
                onChangeText={(value) =>
                  setContent(maskProfanityInput(value))
                }
                maxLength={20000}
                multiline
                textAlignVertical="top"
                placeholder="공지 내용을 입력해 주세요"
                placeholderTextColor={COLORS.placeholder}
                style={styles.contentInput}
              />

              <Pressable
                accessibilityRole="switch"
                accessibilityState={{ checked: isUrgent }}
                onPress={() => setIsUrgent((current) => !current)}
                style={[styles.publishRow, styles.urgentRow]}
              >
                <View>
                  <Text style={styles.publishTitle}>긴급 공지로 분류</Text>
                  <Text style={styles.publishDescription}>
                    관리자 홈에서 긴급 공지만 다시 알림으로 발송할 수 있습니다.
                  </Text>
                </View>
                <View
                  style={[
                    styles.switchTrack,
                    isUrgent && styles.urgentSwitchTrack,
                  ]}
                >
                  <View
                    style={[
                      styles.switchThumb,
                      isUrgent && styles.switchThumbActive,
                    ]}
                  />
                </View>
              </Pressable>

              <Pressable
                accessibilityRole="switch"
                accessibilityState={{ checked: isPublished }}
                onPress={() => setIsPublished((current) => !current)}
                style={styles.publishRow}
              >
                <View>
                  <Text style={styles.publishTitle}>학생에게 바로 게시</Text>
                  <Text style={styles.publishDescription}>
                    끄면 임시 저장 상태로 관리자에게만 표시됩니다.
                  </Text>
                </View>
                <View
                  style={[
                    styles.switchTrack,
                    isPublished && styles.switchTrackActive,
                  ]}
                >
                  <View
                    style={[
                      styles.switchThumb,
                      isPublished && styles.switchThumbActive,
                    ]}
                  />
                </View>
              </Pressable>
            </ScrollView>

            <View style={styles.footer}>
              <Pressable
                disabled={isSaving}
                onPress={() => void handleSave()}
                style={({ pressed }) => [
                  styles.saveButton,
                  isSaving && styles.disabled,
                  pressed && !isSaving && styles.pressed,
                ]}
              >
                {isSaving ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.saveText}>저장</Text>
                )}
              </Pressable>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.surface },
  flex: { flex: 1 },
  header: {
    height: 64,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backText: { width: 40, color: COLORS.navy, fontSize: 38, lineHeight: 40 },
  headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  headerSide: { width: 40 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollView: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingBottom: 120 },
  label: { marginBottom: 9, color: COLORS.text, fontSize: 15, fontWeight: '800' },
  contentLabel: { marginTop: 24 },
  titleInput: {
    minHeight: 56,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    fontSize: 15,
  },
  contentInput: {
    minHeight: 260,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 23,
  },
  publishRow: {
    marginTop: 24,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    backgroundColor: COLORS.surface,
  },
  urgentRow: { marginTop: 24 },
  publishTitle: { color: COLORS.text, fontSize: 14, fontWeight: '800' },
  publishDescription: { maxWidth: 250, marginTop: 5, color: COLORS.subText, fontSize: 11, lineHeight: 17 },
  switchTrack: { width: 48, height: 28, padding: 3, justifyContent: 'center', borderRadius: 14, backgroundColor: COLORS.disabled },
  switchTrackActive: { backgroundColor: COLORS.navy },
  urgentSwitchTrack: { backgroundColor: COLORS.error },
  switchThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.white },
  switchThumbActive: { alignSelf: 'flex-end' },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.surface },
  saveButton: { height: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: COLORS.navy },
  saveText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.75 },
});
