import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { supabase } from '../lib/supabase';

export type PushNotificationEvent =
  | 'assistant_inquiry_answered'
  | 'equipment_request_status'
  | 'facility_report_status'
  | 'notice_published'
  | 'room_request_status';

const STORED_PUSH_TOKEN_KEY = 'media-on:expo-push-token';
const NOTIFICATION_CHANNEL_ID = 'media-on';

let registrationPromise: Promise<string | null> | null = null;

export async function registerCurrentDeviceForPush() {
  if (Platform.OS === 'web' || !supabase) {
    return null;
  }

  if (registrationPromise) {
    return registrationPromise;
  }

  registrationPromise = registerDevice();

  try {
    return await registrationPromise;
  } finally {
    registrationPromise = null;
  }
}

async function registerDevice() {
  if (!supabase || (Platform.OS !== 'android' && Platform.OS !== 'ios')) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('approval_status')
    .eq('id', user.id)
    .single<{ approval_status: string }>();

  if (profile?.approval_status !== 'approved') {
    return null;
  }

  const Notifications = await import('expo-notifications');

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
      name: 'MEDIA ON 알림',
      description: '공지사항과 신청·문의 처리 상태를 알려드립니다.',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#182366',
      sound: 'default',
    });
  }

  const currentPermissions = await Notifications.getPermissionsAsync();
  let permissionStatus = currentPermissions.status;

  if (permissionStatus !== 'granted') {
    const requestedPermissions =
      await Notifications.requestPermissionsAsync();
    permissionStatus = requestedPermissions.status;
  }

  if (permissionStatus !== 'granted') {
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    console.warn(
      'EAS projectId가 없어 푸시 토큰을 발급하지 못했습니다. eas init을 먼저 실행해 주세요.',
    );
    return null;
  }

  const pushToken = (
    await Notifications.getExpoPushTokenAsync({ projectId })
  ).data;
  const { error } = await supabase.rpc('register_push_device', {
    push_token: pushToken,
    device_platform: Platform.OS,
  });

  if (error) {
    throw new Error('기기의 푸시 알림 정보를 저장하지 못했습니다.');
  }

  await AsyncStorage.setItem(STORED_PUSH_TOKEN_KEY, pushToken);
  return pushToken;
}

export async function disablePushForCurrentDevice() {
  const pushToken = await AsyncStorage.getItem(STORED_PUSH_TOKEN_KEY);

  if (!pushToken) {
    return;
  }

  try {
    if (supabase) {
      await supabase.rpc('disable_push_device', {
        push_token: pushToken,
      });
    }
  } finally {
    await AsyncStorage.removeItem(STORED_PUSH_TOKEN_KEY);
  }
}

export async function sendPushNotificationEvent(
  event: PushNotificationEvent,
  resourceId: string,
) {
  if (!supabase) {
    return false;
  }

  try {
    const { error } = await supabase.functions.invoke(
      'send-push-notification',
      {
        body: { event, resourceId },
      },
    );

    if (error) {
      console.warn('푸시 알림 전송 요청에 실패했습니다.', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.warn('푸시 알림 전송 요청에 실패했습니다.', error);
    return false;
  }
}
