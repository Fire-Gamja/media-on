import { router, useLocalSearchParams } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlatformHeaderIcon } from '../../../components/common/PlatformHeaderIcon';
import { COLORS } from '../../../constants/colors';
import { getAuthErrorMessage } from '../../../services/auth';
import {
  formatNoticeTitle,
  getNoticeAttachmentUrls,
  getPublishedNotice,
  type Notice,
  type NoticeAttachment,
} from '../../../services/notices';

const sirenIcon = require('../../../../assets/figma/student/siren.png');

export default function NoticeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const noticeId = Array.isArray(id) ? id[0] : id;
  const [notice, setNotice] = useState<Notice | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>({});
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [areAttachmentsLoading, setAreAttachmentsLoading] = useState(false);

  useEffect(() => {
    if (!noticeId) {
      setErrorMessage('공지사항 주소가 올바르지 않습니다.');
      return;
    }

    void getPublishedNotice(noticeId)
      .then(setNotice)
      .catch((error) => setErrorMessage(getAuthErrorMessage(error)));
  }, [noticeId]);

  useEffect(() => {
    const attachments = notice?.attachments ?? [];
    let isActive = true;

    setAttachmentUrls({});
    setAttachmentError(null);

    if (attachments.length === 0) {
      setAreAttachmentsLoading(false);
      return () => {
        isActive = false;
      };
    }

    setAreAttachmentsLoading(true);
    void getNoticeAttachmentUrls(attachments)
      .then((urls) => {
        if (isActive) setAttachmentUrls(urls);
      })
      .catch((error) => {
        if (isActive) setAttachmentError(getAuthErrorMessage(error));
      })
      .finally(() => {
        if (isActive) setAreAttachmentsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [notice]);

  const openAttachment = async (attachment: NoticeAttachment) => {
    const url = attachmentUrls[attachment.path];
    if (!url) {
      Alert.alert('첨부파일 준비 중', '잠시 후 다시 시도해 주세요.');
      return;
    }

    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Alert.alert('파일 열기 실패', '첨부파일을 열지 못했습니다.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <PlatformHeaderIcon name="back" />
        </Pressable>
        <Text style={styles.headerTitle}>공지사항</Text>
        <View style={styles.headerSide} />
      </View>

      {!notice && !errorMessage ? (
        <View style={styles.stateBox}>
          <ActivityIndicator size="large" color={COLORS.navy} />
        </View>
      ) : errorMessage ? (
        <View style={styles.stateBox}>
          <Text style={styles.errorTitle}>{errorMessage}</Text>
        </View>
      ) : notice ? (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.titleRow}>
            {notice.is_urgent ? (
              <Image source={sirenIcon} style={styles.sirenIcon} />
            ) : null}
            <Text style={styles.title}>
              {formatNoticeTitle(notice.title, notice.is_urgent)}
            </Text>
          </View>
          <Text style={styles.date}>
            {formatDate(notice.published_at ?? notice.created_at)}
          </Text>
          <View style={styles.divider} />
          <Text style={styles.body}>{notice.content}</Text>
          {notice.attachments.length > 0 ? (
            <View style={styles.attachmentSection}>
              <View style={styles.attachmentHeader}>
                <Text style={styles.attachmentTitle}>첨부파일</Text>
                <View style={styles.attachmentCountBadge}>
                  <Text style={styles.attachmentCountText}>
                    {notice.attachments.length}
                  </Text>
                </View>
              </View>

              {areAttachmentsLoading ? (
                <View style={styles.attachmentState}>
                  <ActivityIndicator color={COLORS.navy} size="small" />
                  <Text style={styles.attachmentStateText}>첨부파일을 불러오는 중입니다.</Text>
                </View>
              ) : attachmentError ? (
                <Text style={styles.attachmentError}>{attachmentError}</Text>
              ) : (
                <View style={styles.attachmentList}>
                  {notice.attachments.map((attachment) => {
                    const isImage =
                      attachment.kind === 'image' ||
                      attachment.mimeType.startsWith('image/');
                    const url = attachmentUrls[attachment.path];

                    return isImage ? (
                      <Pressable
                        accessibilityLabel={`${attachment.name} 이미지 크게 보기`}
                        accessibilityRole="button"
                        key={attachment.path}
                        onPress={() => void openAttachment(attachment)}
                        style={({ pressed }) => [
                          styles.imageCard,
                          pressed && styles.pressed,
                        ]}
                      >
                        {url ? (
                          <ExpoImage
                            accessibilityLabel={attachment.name}
                            contentFit="cover"
                            source={{ uri: url }}
                            style={styles.attachmentImage}
                            transition={180}
                          />
                        ) : (
                          <View style={styles.imagePlaceholder}>
                            <ActivityIndicator color={COLORS.navy} size="small" />
                          </View>
                        )}
                        <View style={styles.imageCaptionRow}>
                          <Text numberOfLines={1} style={styles.imageCaption}>
                            {attachment.name}
                          </Text>
                          <Text style={styles.openText}>크게 보기</Text>
                        </View>
                      </Pressable>
                    ) : (
                      <Pressable
                        accessibilityLabel={`${attachment.name} 파일 열기`}
                        accessibilityRole="button"
                        key={attachment.path}
                        onPress={() => void openAttachment(attachment)}
                        style={({ pressed }) => [
                          styles.fileRow,
                          pressed && styles.pressed,
                        ]}
                      >
                        <View style={styles.fileIcon}>
                          <Text style={styles.fileIconText}>FILE</Text>
                        </View>
                        <View style={styles.fileInfo}>
                          <Text numberOfLines={2} style={styles.fileName}>
                            {attachment.name}
                          </Text>
                          <Text style={styles.fileSize}>{formatFileSize(attachment.size)}</Text>
                        </View>
                        <Text style={styles.openText}>열기</Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          ) : null}
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

function formatFileSize(size: number) {
  if (!Number.isFinite(size) || size <= 0) return '파일';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.surface },
  header: { height: 64, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backText: { width: 40, color: COLORS.navy, fontSize: 38, lineHeight: 40 },
  headerTitle: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
  headerSide: { width: 40 },
  stateBox: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  errorTitle: { color: COLORS.error, fontSize: 14, textAlign: 'center' },
  scrollView: { flex: 1, backgroundColor: COLORS.surface },
  content: { padding: 24, paddingBottom: 48 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  sirenIcon: { width: 23, height: 23, marginTop: 4, resizeMode: 'contain' },
  title: { flex: 1, color: COLORS.text, fontSize: 23, lineHeight: 33, fontWeight: '800' },
  date: { marginTop: 14, color: COLORS.subText, fontSize: 12 },
  divider: { height: 1, marginVertical: 24, backgroundColor: COLORS.border },
  body: { color: COLORS.text, fontSize: 15, lineHeight: 26 },
  attachmentSection: { marginTop: 34 },
  attachmentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  attachmentTitle: { color: COLORS.text, fontSize: 17, fontWeight: '800' },
  attachmentCountBadge: { minWidth: 24, height: 24, paddingHorizontal: 7, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: COLORS.softNavy },
  attachmentCountText: { color: COLORS.navy, fontSize: 12, fontWeight: '800' },
  attachmentState: { minHeight: 88, marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 14, backgroundColor: COLORS.background },
  attachmentStateText: { color: COLORS.subText, fontSize: 13 },
  attachmentError: { marginTop: 14, padding: 16, color: COLORS.error, fontSize: 13, lineHeight: 19, borderRadius: 14, backgroundColor: '#FFF5F5' },
  attachmentList: { marginTop: 14, gap: 12 },
  imageCard: { overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, backgroundColor: COLORS.surface },
  attachmentImage: { width: '100%', height: 220, backgroundColor: COLORS.background },
  imagePlaceholder: { height: 220, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  imageCaptionRow: { minHeight: 48, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  imageCaption: { flex: 1, color: COLORS.text, fontSize: 13, fontWeight: '600' },
  fileRow: { minHeight: 72, padding: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, backgroundColor: COLORS.surface },
  fileIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: COLORS.softNavy },
  fileIconText: { color: COLORS.navy, fontSize: 9, fontWeight: '900', letterSpacing: 0.3 },
  fileInfo: { flex: 1, marginHorizontal: 12 },
  fileName: { color: COLORS.text, fontSize: 14, lineHeight: 19, fontWeight: '700' },
  fileSize: { marginTop: 4, color: COLORS.subText, fontSize: 11 },
  openText: { color: '#3550FF', fontSize: 12, fontWeight: '800' },
  pressed: { opacity: 0.66 },
});
