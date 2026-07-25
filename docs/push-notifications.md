# Push notification setup

MEDIA ON uses Expo Push Service with Supabase Edge Functions. Remote push
notifications do not work in Expo Go on Android, so test them with an installed
EAS build.

## 1. Connect the Expo project

Sign in to Expo and connect this repository to an EAS project.

```bash
npx eas-cli login
npx eas-cli init
```

`eas init` adds `expo.extra.eas.projectId` to the app configuration. The app
uses that ID when requesting its Expo push token.

## 2. Configure platform credentials

- Android: configure FCM V1 credentials for the EAS project.
- iOS: configure APNs credentials and register the test device. A paid Apple
  Developer account is required.

Follow the Expo setup guide:
https://docs.expo.dev/push-notifications/push-notifications-setup/

## 3. Apply the database migration

Run this migration after the existing `202607200001` through `202607200008`
migrations:

```text
supabase/migrations/202607250009_create_push_notifications.sql
```

It creates the protected device-token table and authenticated RPC functions
used to register and disable a device.

## 4. Deploy the notification function

```bash
npx supabase functions deploy send-push-notification
```

The hosted function receives its Supabase URL and API keys automatically.

Expo enhanced push security is optional. If it is enabled in the EAS
dashboard, save the matching access token as a Supabase Edge Function secret:

```bash
npx supabase secrets set EXPO_ACCESS_TOKEN=YOUR_EXPO_ACCESS_TOKEN
```

Never add this token to an `EXPO_PUBLIC_` environment variable or commit it to
Git.

## 5. Build the Android test APK

```bash
npx eas-cli build --platform android --profile preview
```

Install the resulting APK, sign in with an approved account, and allow
notifications when Android asks.

## 6. Test the events

1. Publish a new notice and confirm that an approved student receives it.
2. Change an equipment request status.
3. Change a room request status.
4. Change a facility report status.
5. Complete an assistant inquiry answer.
6. Tap each notification and confirm that the matching detail screen opens.
7. Log out, then confirm that the device no longer receives notifications for
   that account.
