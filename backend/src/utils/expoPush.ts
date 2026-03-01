import { Expo, ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo();

export interface PushNotificationPayload {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function sendPushNotification(payload: PushNotificationPayload): Promise<void> {
  if (!Expo.isExpoPushToken(payload.to)) {
    console.warn(`Invalid Expo push token: ${payload.to}`);
    return;
  }

  const message: ExpoPushMessage = {
    to: payload.to,
    sound: 'default',
    title: payload.title,
    body: payload.body,
    data: payload.data,
  };

  try {
    const chunks = expo.chunkPushNotifications([message]);
    for (const chunk of chunks) {
      const receipts = await expo.sendPushNotificationsAsync(chunk);
      for (const receipt of receipts) {
        if (receipt.status === 'error') {
          console.error('Push notification error:', receipt.message);
        }
      }
    }
  } catch (err) {
    console.error('Failed to send push notification:', err);
  }
}

export async function sendPushNotifications(payloads: PushNotificationPayload[]): Promise<void> {
  const validMessages: ExpoPushMessage[] = payloads
    .filter((p) => Expo.isExpoPushToken(p.to))
    .map((p) => ({
      to: p.to,
      sound: 'default' as const,
      title: p.title,
      body: p.body,
      data: p.data,
    }));

  if (validMessages.length === 0) return;

  try {
    const chunks = expo.chunkPushNotifications(validMessages);
    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }
  } catch (err) {
    console.error('Failed to send push notifications:', err);
  }
}
