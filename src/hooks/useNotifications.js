import * as Notifications from 'expo-notifications';
import { Storage } from '../storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleDailyAffirmationNotification(hour, minute) {
  const existingId = Storage.getNotificationId();
  if (existingId) {
    await Notifications.cancelScheduledNotificationAsync(existingId).catch(() => {});
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Good morning',
      body: 'Your affirmation is ready. Say it three times.',
      data: { screen: 'Affirmation' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  Storage.setNotificationId(id);
  return id;
}

export async function cancelDailyNotification() {
  const id = Storage.getNotificationId();
  if (id) {
    await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
  }
}
