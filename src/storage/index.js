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
  FAVORITES: 'favorites',
  LOCKED_AFFIRMATION: 'lockedAffirmation',
  LOCK_EXPIRES_DATE: 'lockExpiresDate',
  AFFIRMATION_HISTORY: 'affirmationHistory',
  LONGEST_STREAK: 'longestStreak',
  TOTAL_DAYS: 'totalDays',
  SHIELD_COUNT: 'shieldCount',
  SHIELD_MONTH: 'shieldMonth',
  FOCUS_CATEGORY: 'focusCategory',
  FOCUS_EXPIRES_DATE: 'focusExpiresDate',
  FOCUS_SET_DATE: 'focusSetDate',
};

const FREE_CATEGORY_LIMIT = 5;

export { FREE_CATEGORY_LIMIT };

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

  getLongestStreak: () => storage.getNumber(KEYS.LONGEST_STREAK) ?? 0,

  getTotalDays: () => storage.getNumber(KEYS.TOTAL_DAYS) ?? 0,

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

  // Favorites
  getFavorites: () => {
    const raw = storage.getString(KEYS.FAVORITES);
    return raw ? JSON.parse(raw) : [];
  },
  toggleFavorite: (id) => {
    const favs = Storage.getFavorites();
    const updated = favs.includes(id) ? favs.filter(f => f !== id) : [...favs, id];
    storage.set(KEYS.FAVORITES, JSON.stringify(updated));
  },
  isFavorite: (id) => Storage.getFavorites().includes(id),

  // Affirmation lock — keep same affirmation for a set duration
  getLockedAffirmation: () => {
    const raw = storage.getString(KEYS.LOCKED_AFFIRMATION);
    if (!raw) return null;
    const expires = storage.getString(KEYS.LOCK_EXPIRES_DATE) ?? '';
    if (expires !== 'forever' && expires < Storage.todayString()) {
      storage.remove(KEYS.LOCKED_AFFIRMATION);
      storage.remove(KEYS.LOCK_EXPIRES_DATE);
      return null;
    }
    return JSON.parse(raw);
  },
  setAffirmationLock: (affirmation, expiresDate) => {
    storage.set(KEYS.LOCKED_AFFIRMATION, JSON.stringify(affirmation));
    storage.set(KEYS.LOCK_EXPIRES_DATE, expiresDate ?? 'forever');
    Storage.setTodayAffirmation(affirmation);
  },
  clearAffirmationLock: () => {
    storage.remove(KEYS.LOCKED_AFFIRMATION);
    storage.remove(KEYS.LOCK_EXPIRES_DATE);
  },
  getLockExpiresDate: () => storage.getString(KEYS.LOCK_EXPIRES_DATE) ?? null,

  // Affirmation history — most recent first, capped at 90 entries
  getHistory: () => {
    const raw = storage.getString(KEYS.AFFIRMATION_HISTORY);
    return raw ? JSON.parse(raw) : [];
  },
  addToHistory: (affirmation) => {
    const history = Storage.getHistory();
    const entry = {
      id: affirmation.id,
      text: affirmation.text,
      date: Storage.todayString(),
    };
    const updated = [entry, ...history.filter(h => h.date !== entry.date)].slice(0, 90);
    storage.set(KEYS.AFFIRMATION_HISTORY, JSON.stringify(updated));
  },

  // Focus Mode — premium: commit to one category for a period
  getFocus: () => {
    const cat = storage.getString(KEYS.FOCUS_CATEGORY);
    if (!cat) return null;
    const expires = storage.getString(KEYS.FOCUS_EXPIRES_DATE) ?? '';
    if (expires !== 'forever' && expires < Storage.todayString()) {
      storage.remove(KEYS.FOCUS_CATEGORY);
      storage.remove(KEYS.FOCUS_EXPIRES_DATE);
      storage.remove(KEYS.FOCUS_SET_DATE);
      return null;
    }
    return {
      categoryId: cat,
      expires,
      setDate: storage.getString(KEYS.FOCUS_SET_DATE) ?? Storage.todayString(),
    };
  },
  setFocus: (categoryId, expiresDate) => {
    storage.set(KEYS.FOCUS_CATEGORY, categoryId);
    storage.set(KEYS.FOCUS_EXPIRES_DATE, expiresDate ?? 'forever');
    storage.set(KEYS.FOCUS_SET_DATE, Storage.todayString());
  },
  clearFocus: () => {
    storage.remove(KEYS.FOCUS_CATEGORY);
    storage.remove(KEYS.FOCUS_EXPIRES_DATE);
    storage.remove(KEYS.FOCUS_SET_DATE);
  },

  // Streak Shield — 2 uses per calendar month for premium users
  getShieldCount: () => {
    const currentMonth = Storage.todayString().substring(0, 7);
    const storedMonth = storage.getString(KEYS.SHIELD_MONTH) ?? '';
    if (storedMonth !== currentMonth) {
      storage.set(KEYS.SHIELD_COUNT, 2);
      storage.set(KEYS.SHIELD_MONTH, currentMonth);
      return 2;
    }
    return storage.getNumber(KEYS.SHIELD_COUNT) ?? 2;
  },
  useShield: () => {
    const count = Storage.getShieldCount();
    if (count <= 0) return false;
    const today = Storage.todayString();
    storage.set(KEYS.LAST_COMPLETED_DATE, today);
    storage.set(KEYS.SHIELD_COUNT, count - 1);
    storage.set(KEYS.SHIELD_MONTH, today.substring(0, 7));
    return true;
  },

  todayString: () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  },

  isDoneToday: () => {
    const last = storage.getString(KEYS.LAST_COMPLETED_DATE) ?? '';
    return last === Storage.todayString();
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
    storage.set(KEYS.STREAK, newStreak);
    storage.set(KEYS.LAST_COMPLETED_DATE, today);

    // Update longest streak
    const longest = Storage.getLongestStreak();
    if (newStreak > longest) storage.set(KEYS.LONGEST_STREAK, newStreak);

    // Update total days
    const total = Storage.getTotalDays();
    storage.set(KEYS.TOTAL_DAYS, total + 1);

    return newStreak;
  },
};
