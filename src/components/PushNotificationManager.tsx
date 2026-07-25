import type { Href } from 'expo-router';
import { router } from 'expo-router';
import type { Notification } from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { supabase } from '../lib/supabase';
import { registerCurrentDeviceForPush } from '../services/push-notifications';

export function PushNotificationManager() {
  useEffect(() => {
    if (Platform.OS === 'web' || !supabase) {
      return;
    }

    const client = supabase;
    let isMounted = true;
    let responseSubscription: { remove(): void } | undefined;

    const registerIfSignedIn = async () => {
      const {
        data: { session },
      } = await client.auth.getSession();

      if (isMounted && session) {
        await registerCurrentDeviceForPush();
      }
    };

    void registerIfSignedIn().catch((error) => {
      console.warn('푸시 알림 등록에 실패했습니다.', error);
    });

    const {
      data: { subscription: authSubscription },
    } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        void registerCurrentDeviceForPush().catch((error) => {
          console.warn('푸시 알림 등록에 실패했습니다.', error);
        });
      }
    });

    void import('expo-notifications').then((Notifications) => {
      if (!isMounted) {
        return;
      }

      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          priority: Notifications.AndroidNotificationPriority.HIGH,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      const lastResponse = Notifications.getLastNotificationResponse();
      if (lastResponse) {
        openNotification(lastResponse.notification);
        Notifications.clearLastNotificationResponse();
      }

      responseSubscription =
        Notifications.addNotificationResponseReceivedListener((response) => {
          openNotification(response.notification);
        });
    });

    return () => {
      isMounted = false;
      authSubscription.unsubscribe();
      responseSubscription?.remove();
    };
  }, []);

  return null;
}

function openNotification(notification: Notification) {
  const url = notification.request.content.data?.url;

  if (typeof url === 'string' && isAllowedNotificationRoute(url)) {
    router.push(url as Href);
  }
}

function isAllowedNotificationRoute(value: string) {
  return [
    '/assistant-inquiries/',
    '/equipment-requests/',
    '/facility-reports/',
    '/notices/',
    '/room-requests/',
  ].some((prefix) => value.startsWith(prefix));
}
