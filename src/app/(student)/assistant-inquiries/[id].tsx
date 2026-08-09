import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AssistantChatRoom } from '../../../components/assistant/AssistantChatRoom';
import { PlatformHeaderIcon } from '../../../components/common/PlatformHeaderIcon';
import { COLORS } from '../../../constants/colors';
import { getProfileAvatarSource } from '../../../lib/profile-avatar';
import {
  getAuthErrorMessage,
  getCurrentProfile,
  type StudentProfile,
} from '../../../services/auth';
import {
  getMyAssistantInquiry,
  type AssistantInquiry,
  type AssistantInquiryStatus,
} from '../../../services/assistant-inquiries';

export default function AssistantInquiryDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const inquiryId = Array.isArray(id) ? id[0] : id;
  const [inquiry, setInquiry] = useState<AssistantInquiry | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!inquiryId) {
      router.back();
      return;
    }

    void Promise.all([getMyAssistantInquiry(inquiryId), getCurrentProfile()])
      .then(([nextInquiry, nextProfile]) => {
        setInquiry(nextInquiry);
        setProfile(nextProfile);
      })
      .catch((error) =>
        Alert.alert('조회 실패', getAuthErrorMessage(error), [
          { text: '확인', onPress: () => router.back() },
        ]),
      )
      .finally(() => setIsLoading(false));
  }, [inquiryId]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="뒤로 가기"
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <PlatformHeaderIcon name="back" />
        </Pressable>
        {profile && inquiry ? (
          <>
            <Image
              source={getProfileAvatarSource(profile.avatar_url)}
              style={styles.avatar}
            />
            <View style={styles.identity}>
              <Text numberOfLines={1} style={styles.identityText}>
                {profile.student_number} {profile.name}
              </Text>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: getStatusColor(inquiry.status) },
                  ]}
                />
                <Text style={styles.statusText}>
                  {getStatusLabel(inquiry.status)}
                </Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.identity} />
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.navy} />
        </View>
      ) : inquiry ? (
        <AssistantChatRoom
          initialMessage={{
            content: inquiry.content,
            created_at: inquiry.created_at,
            sender_id: inquiry.requester_id,
          }}
          inquiryId={inquiry.id}
          status={inquiry.status}
          onStatusChange={(status: AssistantInquiryStatus) =>
            setInquiry((current) =>
              current ? { ...current, status } : current,
            )
          }
        />
      ) : null}
    </SafeAreaView>
  );
}

function getStatusLabel(status: AssistantInquiryStatus) {
  if (status === 'submitted') return '신청 완료';
  if (status === 'in_progress') return '상담 중';
  return '상담 완료';
}

function getStatusColor(status: AssistantInquiryStatus) {
  if (status === 'submitted') return '#3550FF';
  if (status === 'in_progress') return '#10B981';
  return '#8E8E93';
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.surface },
  header: {
    height: 64,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 36,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  avatar: { width: 38, height: 38, marginLeft: 2, borderRadius: 19 },
  identity: { flex: 1, marginLeft: 10 },
  identityText: {
    color: '#25304A',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 16,
  },
  statusRow: { marginTop: 3, flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 6, height: 6, marginRight: 5, borderRadius: 3 },
  statusText: { color: '#7B8291', fontSize: 11 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
