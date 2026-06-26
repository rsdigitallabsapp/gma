import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'gma-storage' });

const KEYS = {
  ONBOARDED: 'onboarded',
  CATEGORIES: 'categories',
  WAKE_HOUR: 'wakeHour',
  WAKE_MINUTE: 'wakeMinute',
  STREAK: 'streak',
  LAST_COMPLETED_DATE: 'lastCompletedDate',
  SEEN_AFFIRMATION_IDS: 'seenAffirmationIds',
  NOTIFICATION_ID: 'notificationId',
  TODAY_AFFIRMATION: 'todayAffirmation',
  IS_PREMIUM: 'isPremium',
  CUSTOM_AFFIRMATIONS: 'customAffirmations',
};

export const Storage = {
  isOnboarded: () => storage.getBoolean(KEYS.ONBOARDED) ?? false,
  setOnboarded: () => storage.set(KEYS.ONBOARDED, true),

  getCategories: () => {
    const raw = storage.getString(KEYS.CATEGORIES);
    return raw ? JSON.parse(raw) : [];
  },
  setCategories: (ids) => storage.set(KEYS.CATEGORIES, JSON.stringify(ids)),

  getWakeTime: () => ({
    hour: storage.getNumber(KEYS.WAKE_HOUR) ?? 7,
    minute: storage.getNumber(KEYS.WAKE_MINUTE) ?? 0,
  }),
  setWakeTime: (hour, minute) => {
    storage.set(KEYS.WAKE_HOUR, hour);
    storage.set(KEYS.WAKE_MINUTE, minute);
  },

  getStreak: () => storage.getNumber(KEYS.STREAK) ?? 0,
  setStreak: (n) => storage.set(KEYS.STREAK, n),

  getLastCompletedDate: () => storage.getString(KEYS.LAST_COMPLETED_DATE) ?? '',
  setLastCompletedDate: (dateStr) => storage.set(KEYS.LAST_COMPLETED_DATE, dateStr),

  getSeenIds: () => {
    const raw = storage.getString(KEYS.SEEN_AFFIRMATION_IDS);
    return raw ? JSON.parse(raw) : [];
  },
  addSeenId: (id) => {
    const current = Storage.getSeenIds();
    if (!current.includes(id)) {
      storage.set(KEYS.SEEN_AFFIRMATION_IDS, JSON.stringify([...current, id]));
    }
  },

  getNotificationId: () => storage.getString(KEYS.NOTIFICATION_ID) ?? null,
  setNotificationId: (id) => storage.set(KEYS.NOTIFICATION_ID, id),

  getTodayAffirmation: () => {
    const raw = storage.getString(KEYS.TODAY_AFFIRMATION);
    return raw ? JSON.parse(raw) : null;
  },
  setTodayAffirmation: (affirmation) =>
    storage.set(KEYS.TODAY_AFFIRMATION, JSON.stringify(affirmation)),

  isPremium: () => storage.getBoolean(KEYS.IS_PREMIUM) ?? false,
  setPremium: (value = true) => storage.set(KEYS.IS_PREMIUM, value),

  getCustomAffirmations: () => {
    const raw = storage.getString(KEYS.CUSTOM_AFFIRMATIONS);
    return raw ? JSON.parse(raw) : [];
  },
  addCustomAffirmation: (text) => {
    const current = Storage.getCustomAffirmations();
    const entry = { id: `custom_${Date.now()}`, text: text.trim() };
    storage.set(KEYS.CUSTOM_AFFIRMATIONS, JSON.stringify([...current, entry]));
    return entry;
  },
  deleteCustomAffirmation: (id) => {
    const current = Storage.getCustomAffirmations();
    storage.set(KEYS.CUSTOM_AFFIRMATIONS, JSON.stringify(current.filter(a => a.id !== id)));
  },

  todayString: () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  },

  isDoneToday: () => {
    const last = storage.getString(KEYS.LAST_COMPLETED_DATE) ?? '';
    const today = Storage.todayString();
    return last === today;
  },

  markDoneToday: () => {
    const today = Storage.todayString();
    const last = Storage.getLastCompletedDate();
    const yesterday = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();

    const newStreak = last === yesterday ? Storage.getStreak() + 1 : 1;
    Storage.setStreak(newStreak);
    Storage.setLastCompletedDate(today);
    return newStreak;
  },
};
