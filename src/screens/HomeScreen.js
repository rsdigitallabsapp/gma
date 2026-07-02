import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Image, Alert, Modal, Pressable,
  Animated, Easing,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, fonts, spacing, radius } from '../theme';
import { Storage } from '../storage';
import { CATEGORIES } from '../data/categories';
import { AFFIRMATIONS } from '../data/affirmations';

const logo = require('../../assets/logo.png');
const STREAK_COLOR = '#C6A67B';

const DURATIONS = [
  { label: 'Just today',        value: 'today' },
  { label: 'One week',          value: 'week' },
  { label: 'One month',         value: 'month' },
  { label: 'Until I change it', value: 'forever' },
];

function addDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function expiresDateFor(value) {
  if (value === 'today') return addDays(0);
  if (value === 'week')  return addDays(7);
  if (value === 'month') return addDays(30);
  return 'forever';
}

function formatWakeTime({ hour, minute }) {
  const period = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minute === 0 ? '00' : '30'} ${period}`;
}

function lockLabel(expiresDate) {
  if (!expiresDate) return null;
  if (expiresDate === 'forever') return 'Locked · Until changed';
  const [y, m, d] = expiresDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `Locked until ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

function getWeekDays() {
  try {
    const today = new Date();
    const dow = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));

    const history = Storage.getHistory() || [];
    const doneSet = new Set(history.map(h => h.date));
    if (Storage.isDoneToday()) doneSet.add(Storage.todayString());

    const todayStr = Storage.todayString();
    return ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return { label, done: doneSet.has(dateStr), isToday: dateStr === todayStr, isFuture: dateStr > todayStr };
    });
  } catch {
    return ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(label => ({ label, done: false, isToday: false, isFuture: false }));
  }
}

function loadState() {
  const isPremium = Storage.isPremium();
  const categories = Storage.getCategories();
  const lockedAff = Storage.getLockedAffirmation();
  const todayAff = lockedAff || Storage.getTodayAffirmation() || { text: '' };
  const weekDays = getWeekDays();
  return {
    streak: Storage.getStreak(),
    categories,
    todayAffirmation: todayAff,
    wakeTime: Storage.getWakeTime(),
    isPremium,
    customCount: isPremium ? Storage.getCustomAffirmations().length : 0,
    isDone: Storage.isDoneToday(),
    selectedCategories: CATEGORIES.filter(c => categories.includes(c.id)),
    shieldCount: isPremium ? Storage.getShieldCount() : 0,
    activeLockLabel: lockedAff ? lockLabel(Storage.getLockExpiresDate()) : null,
    isFav: todayAff.id ? Storage.isFavorite(todayAff.id) : false,
    weekDays,
    weekDone: weekDays.filter(d => d.done).length,
  };
}

function FlameIcon({ size = 44, color = STREAK_COLOR }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill={color}
        d="M12 23c-4.6 0-8-3.4-8-8 0-5 4.5-10.1 5-10.7.2-.2.5-.3.7-.2.3.1.4.3.4.6-.1 1.5.4 3 1.5 4 .2-2.1 1.3-4 3.1-5.2.3-.2.7-.2.9.1.1.2.2.4.1.6C15.4 5.4 15 7.1 15 8.5c0 .6.5 1.5 1.1 1.5.4 0 .8-.3 1-.7.1-.2.3-.4.6-.4s.5.2.6.4c.4.8.7 2.5.7 3.7 0 4.6-3.4 8-8 8z"
      />
    </Svg>
  );
}

export function HomeScreen({ navigation }) {
  const [state, setState] = useState(loadState);
  const [showKeepModal, setShowKeepModal] = useState(false);
  const [keepDuration, setKeepDuration] = useState('week');
  const [displayStreak, setDisplayStreak] = useState(0);
  const [activeCategory, setActiveCategory] = useState(null); // null = all selected
  const [showCategorySheet, setShowCategorySheet] = useState(false);

  // Animation values
  const flameScale   = useRef(new Animated.Value(0.6)).current;
  const streakAnim   = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const dotAnims     = useRef(Array.from({ length: 7 }, () => new Animated.Value(0))).current;
  const flamePulse   = useRef(null);

  useFocusEffect(useCallback(() => {
    const newState = loadState();
    setState(newState);

    const { streak, weekDone } = newState;

    // Reset
    flameScale.setValue(0.6);
    streakAnim.setValue(0);
    progressAnim.setValue(0);
    dotAnims.forEach(a => a.setValue(0));
    setDisplayStreak(0);
    if (flamePulse.current) flamePulse.current.stop();

    // Count-up listener
    const listenerId = streakAnim.addListener(({ value }) => {
      setDisplayStreak(Math.round(value));
    });

    // Flame entrance → then idle pulse
    Animated.spring(flameScale, {
      toValue: 1,
      tension: 120,
      friction: 6,
      useNativeDriver: true,
    }).start(() => {
      if (streak > 0) {
        flamePulse.current = Animated.loop(
          Animated.sequence([
            Animated.timing(flameScale, {
              toValue: 1.1,
              duration: 1100,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(flameScale, {
              toValue: 1,
              duration: 1100,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ])
        );
        flamePulse.current.start();
      }
    });

    // Streak count-up
    Animated.timing(streakAnim, {
      toValue: streak,
      duration: 700,
      delay: 120,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // Progress bar fill
    Animated.timing(progressAnim, {
      toValue: weekDone / 7,
      duration: 900,
      delay: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // Day dots stagger pop
    Animated.stagger(
      55,
      dotAnims.map(a =>
        Animated.spring(a, {
          toValue: 1,
          tension: 180,
          friction: 7,
          useNativeDriver: true,
        })
      )
    ).start();

    return () => {
      streakAnim.removeListener(listenerId);
      if (flamePulse.current) flamePulse.current.stop();
    };
  }, []));

  const {
    streak = 0,
    todayAffirmation = { text: '' },
    wakeTime,
    isPremium = false,
    customCount = 0,
    isDone = false,
    selectedCategories = [],
    shieldCount = 0,
    activeLockLabel = null,
    isFav = false,
    weekDays = ['M','T','W','T','F','S','S'].map(label => ({ label, done: false, isToday: false, isFuture: false })),
    weekDone = 0,
  } = state;

  const wakeLabel = formatWakeTime(wakeTime || { hour: 7, minute: 0 });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const handleUseShield = () => {
    Alert.alert(
      'Use Streak Shield?',
      `This will protect your ${streak}-day streak for today. You have ${shieldCount} shield${shieldCount !== 1 ? 's' : ''} left this month.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Use Shield', onPress: () => { Storage.useShield(); setState(loadState()); } },
      ]
    );
  };

  const pickRandom = (categoryId, excludeId) => {
    const categories = Storage.getCategories();
    const base = AFFIRMATIONS.filter(a =>
      categoryId ? a.category === categoryId : categories.includes(a.category)
    );
    const custom = isPremium
      ? Storage.getCustomAffirmations().map(a => ({ ...a, category: 'custom' }))
      : [];
    const pool = [...base, ...custom].filter(a => a.id !== excludeId);
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const handleShuffle = () => {
    const newAff = pickRandom(activeCategory, todayAffirmation.id);
    if (!newAff) return;
    Storage.clearAffirmationLock();
    Storage.setTodayAffirmation(newAff);
    setState(prev => ({ ...prev, todayAffirmation: newAff, activeLockLabel: null, isFav: Storage.isFavorite(newAff.id) }));
  };

  const handleCategorySelect = (categoryId) => {
    setActiveCategory(categoryId);
    setShowCategorySheet(false);
    const newAff = pickRandom(categoryId, todayAffirmation.id);
    if (!newAff) return;
    Storage.clearAffirmationLock();
    Storage.setTodayAffirmation(newAff);
    setState(prev => ({ ...prev, todayAffirmation: newAff, activeLockLabel: null, isFav: Storage.isFavorite(newAff.id) }));
  };

  const handleFavorite = () => {
    if (!todayAffirmation.id) return;
    Storage.toggleFavorite(todayAffirmation.id);
    setState(prev => ({ ...prev, isFav: !prev.isFav }));
  };

  const handleKeepConfirm = () => {
    const expires = expiresDateFor(keepDuration);
    Storage.setAffirmationLock(todayAffirmation, expires);
    setShowKeepModal(false);
    setState(prev => ({ ...prev, activeLockLabel: lockLabel(expires) }));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
        </View>

        {/* Streak card */}
        <View style={styles.streakCard}>
          {/* Left — animated flame + count-up */}
          <View style={styles.streakLeft}>
            <Animated.View style={{ transform: [{ scale: flameScale }] }}>
              <FlameIcon size={48} color={streak > 0 ? STREAK_COLOR : colors.textMuted} />
            </Animated.View>
            <Text style={[styles.streakNumber, streak === 0 && { color: colors.textMuted }]}>
              {displayStreak}
            </Text>
            <Text style={styles.streakLabel}>Day{'\n'}Streak</Text>
          </View>

          <View style={styles.streakDivider} />

          {/* Right — animated progress bar + staggered dots */}
          <View style={styles.streakRight}>
            <View style={styles.progressRow}>
              <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
              </View>
              <Text style={styles.progressLabel}>{weekDone}/7</Text>
            </View>

            <View style={styles.weekDots}>
              {weekDays.map((day, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.weekDotCol,
                    {
                      opacity: dotAnims[i],
                      transform: [{ scale: dotAnims[i] }],
                    },
                  ]}
                >
                  <View style={[
                    styles.weekDot,
                    day.done && styles.weekDotDone,
                    day.isToday && !day.done && styles.weekDotToday,
                  ]}>
                    {day.done && <Text style={styles.weekDotCheck}>✓</Text>}
                  </View>
                  <Text style={[styles.weekDotLabel, day.isToday && styles.weekDotLabelToday]}>
                    {day.label}
                  </Text>
                </Animated.View>
              ))}
            </View>
          </View>
        </View>

        {isPremium && shieldCount > 0 && !isDone && streak > 0 && (
          <TouchableOpacity style={styles.shieldBtn} onPress={handleUseShield} activeOpacity={0.8}>
            <Text style={styles.shieldBtnText}>Use Streak Shield · {shieldCount} left this month</Text>
          </TouchableOpacity>
        )}

        {!isPremium && (
          <TouchableOpacity style={styles.premiumBanner} onPress={() => navigation.navigate('Paywall')} activeOpacity={0.85}>
            <View>
              <Text style={styles.premiumBannerTitle}>Unlock ARISE Premium</Text>
              <Text style={styles.premiumBannerSub}>All categories · Custom affirmations · Streak Shield · Stats & History</Text>
            </View>
            <Text style={styles.premiumBannerArrow}>›</Text>
          </TouchableOpacity>
        )}

        {/* Today's affirmation */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionLabel}>Today's affirmation</Text>
            <TouchableOpacity
              style={styles.categoryChip}
              onPress={() => isPremium ? setShowCategorySheet(true) : navigation.navigate('Paywall')}
              activeOpacity={0.7}
            >
              <Text style={styles.categoryChipText}>
                {activeCategory ? CATEGORIES.find(c => c.id === activeCategory)?.label : 'All'} ▾
              </Text>
              {!isPremium && <View style={styles.categoryLock}><Text style={styles.categoryLockText}>PRO</Text></View>}
            </TouchableOpacity>
          </View>
          <View style={styles.affirmationCard}>
            {activeLockLabel && <Text style={styles.lockLabel}>{activeLockLabel}</Text>}
            <Text style={styles.affirmationText}>{todayAffirmation.text}</Text>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleShuffle} activeOpacity={0.7}>
                <Text style={styles.actionIcon}>↻</Text>
                <Text style={styles.actionLabel}>Shuffle</Text>
              </TouchableOpacity>
              <View style={styles.actionDivider} />
              <TouchableOpacity style={styles.actionBtn} onPress={handleFavorite} activeOpacity={0.7}>
                <Text style={[styles.actionIcon, isFav && styles.actionIconFav]}>{isFav ? '♥' : '♡'}</Text>
                <Text style={[styles.actionLabel, isFav && styles.actionLabelFav]}>{isFav ? 'Saved' : 'Save'}</Text>
              </TouchableOpacity>
              <View style={styles.actionDivider} />
              <TouchableOpacity style={styles.actionBtn} onPress={() => setShowKeepModal(true)} activeOpacity={0.7}>
                <Text style={styles.actionIcon}>⏱</Text>
                <Text style={styles.actionLabel}>Keep for</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.affirmationCardDivider} />

            {isDone ? (
              <Text style={styles.doneBadge}>✅ Completed</Text>
            ) : (
              <TouchableOpacity style={styles.sayItBtn} onPress={() => navigation.replace('Affirmation')}>
                <Text style={styles.sayItBtnText}>Say it now</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Settings</Text>

          <TouchableOpacity style={styles.settingRow} onPress={() => navigation.navigate('EditWakeTime')} activeOpacity={0.7}>
            <Text style={styles.settingKey}>Wake-up reminder</Text>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>{wakeLabel}</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} onPress={() => navigation.navigate('EditCategories')} activeOpacity={0.7}>
            <Text style={styles.settingKey}>Categories</Text>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue} numberOfLines={1}>
                {selectedCategories.length > 0 ? selectedCategories.map(c => c.label).join(', ') : 'All'}
              </Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>

          <Text style={[styles.sectionLabel, { marginTop: spacing.sm, marginBottom: spacing.xs }]}>Premium</Text>

          <TouchableOpacity style={styles.settingRow} onPress={() => navigation.navigate(isPremium ? 'CustomAffirmations' : 'Paywall')} activeOpacity={0.7}>
            <View style={styles.settingLabelRow}>
              <Text style={styles.settingKey}>Custom affirmations</Text>
              {!isPremium && <View style={styles.premiumBadge}><Text style={styles.premiumBadgeText}>PREMIUM</Text></View>}
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>{isPremium ? (customCount === 0 ? 'None yet' : `${customCount} saved`) : 'Unlock'}</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} onPress={() => isPremium ? navigation.navigate('Stats') : navigation.navigate('Paywall')} activeOpacity={0.7}>
            <View style={styles.settingLabelRow}>
              <Text style={styles.settingKey}>Stats</Text>
              {!isPremium && <View style={styles.premiumBadge}><Text style={styles.premiumBadgeText}>PREMIUM</Text></View>}
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingRow, { borderBottomWidth: 0 }]} onPress={() => isPremium ? navigation.navigate('History') : navigation.navigate('Paywall')} activeOpacity={0.7}>
            <View style={styles.settingLabelRow}>
              <Text style={styles.settingKey}>Affirmation history</Text>
              {!isPremium && <View style={styles.premiumBadge}><Text style={styles.premiumBadgeText}>PREMIUM</Text></View>}
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Category picker sheet */}
      <Modal visible={showCategorySheet} transparent animationType="slide" onRequestClose={() => setShowCategorySheet(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowCategorySheet(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetQuestion}>Choose a focus category</Text>

            <TouchableOpacity
              style={[styles.categoryRow, activeCategory === null && styles.categoryRowActive]}
              onPress={() => handleCategorySelect(null)}
              activeOpacity={0.7}
            >
              <Text style={[styles.categoryRowText, activeCategory === null && styles.categoryRowTextActive]}>
                All categories
              </Text>
              {activeCategory === null && <Text style={styles.categoryRowCheck}>✓</Text>}
            </TouchableOpacity>

            {selectedCategories.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[styles.categoryRow, activeCategory === c.id && styles.categoryRowActive]}
                onPress={() => handleCategorySelect(c.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.categoryRowText, activeCategory === c.id && styles.categoryRowTextActive]}>
                  {c.label}
                </Text>
                {activeCategory === c.id && <Text style={styles.categoryRowCheck}>✓</Text>}
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCategorySheet(false)} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showKeepModal} transparent animationType="slide" onRequestClose={() => setShowKeepModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowKeepModal(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetAffirmation} numberOfLines={2}>"{todayAffirmation.text}"</Text>
            <Text style={styles.sheetQuestion}>How long do you want to work with this?</Text>

            {DURATIONS.map(d => (
              <TouchableOpacity key={d.value} style={styles.durationRow} onPress={() => setKeepDuration(d.value)} activeOpacity={0.7}>
                <View style={[styles.radio, keepDuration === d.value && styles.radioSelected]} />
                <Text style={[styles.durationLabel, keepDuration === d.value && styles.durationLabelSelected]}>{d.label}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.confirmBtn} onPress={handleKeepConfirm} activeOpacity={0.85}>
              <Text style={styles.confirmBtnText}>Set affirmation</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowKeepModal(false)} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },

  header: { marginTop: spacing.sm, marginBottom: spacing.sm, alignItems: 'center' },
  logo: { width: 130, height: 130 },

  streakCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  streakLeft: {
    alignItems: 'center',
    width: 76,
    paddingHorizontal: 4,
  },
  streakNumber: {
    fontFamily: fonts.display,
    fontSize: 30,
    color: STREAK_COLOR,
    lineHeight: 34,
    marginTop: 2,
  },
  streakLabel: {
    color: colors.textDim,
    fontSize: 11,
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    lineHeight: 15,
    marginTop: 1,
  },
  streakDivider: {
    width: 1,
    height: 72,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  streakRight: { flex: 1 },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: STREAK_COLOR,
    borderRadius: 3,
  },
  progressLabel: {
    color: colors.textMuted,
    fontSize: 11,
    width: 28,
    textAlign: 'right',
  },
  weekDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekDotCol: {
    alignItems: 'center',
    gap: 4,
  },
  weekDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDotDone: { backgroundColor: STREAK_COLOR },
  weekDotToday: {
    borderWidth: 1.5,
    borderColor: STREAK_COLOR,
    backgroundColor: 'transparent',
  },
  weekDotCheck: {
    color: colors.bg,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
  weekDotLabel: {
    color: colors.textMuted,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  weekDotLabelToday: { color: STREAK_COLOR },

  shieldBtn: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.goldDim,
    backgroundColor: colors.surfaceElevated,
    marginBottom: spacing.md,
  },
  shieldBtnText: { color: colors.gold, fontSize: 12, letterSpacing: 0.5 },

  premiumBanner: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.goldDim,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  premiumBannerTitle: { color: colors.gold, fontSize: 14, fontWeight: '600', marginBottom: 3 },
  premiumBannerSub: { color: colors.textMuted, fontSize: 12, lineHeight: 17, maxWidth: 270 },
  premiumBannerArrow: { color: colors.gold, fontSize: 24, lineHeight: 26 },

  section: { marginBottom: spacing.md },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  sectionLabel: {
    color: colors.textDim,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.full,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipText: { color: colors.gold, fontSize: 11, fontWeight: '600' },
  categoryLock: {
    backgroundColor: colors.goldDim,
    borderRadius: radius.full,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  categoryLockText: { color: colors.gold, fontSize: 8, fontWeight: '700', letterSpacing: 0.5 },

  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryRowActive: {},
  categoryRowText: { color: colors.textDim, fontSize: 16 },
  categoryRowTextActive: { color: colors.text, fontWeight: '600' },
  categoryRowCheck: { color: colors.gold, fontSize: 16 },
  lockLabel: {
    color: colors.gold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  affirmationCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  affirmationText: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.text,
    lineHeight: 30,
    marginBottom: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  actionBtn: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  actionIcon: { fontSize: 18, color: colors.textDim, marginBottom: 3 },
  actionIconFav: { color: colors.gold },
  actionLabel: { fontSize: 10, color: colors.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' },
  actionLabelFav: { color: colors.gold },
  actionDivider: { width: 1, height: 32, backgroundColor: colors.border },
  affirmationCardDivider: { height: 1, backgroundColor: colors.border, marginBottom: spacing.md },
  doneBadge: { color: colors.gold, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' },
  sayItBtn: {
    backgroundColor: colors.gold,
    borderRadius: radius.full,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    alignSelf: 'flex-start',
  },
  sayItBtnText: { color: colors.bg, fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },

  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: 2,
  },
  settingLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingKey: { color: colors.text, fontSize: 15 },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: 180 },
  settingValue: { color: colors.textDim, fontSize: 14, textAlign: 'right', flexShrink: 1 },
  chevron: { color: colors.textMuted, fontSize: 20, lineHeight: 22 },
  premiumBadge: { backgroundColor: colors.goldDim, borderRadius: radius.full, paddingHorizontal: 7, paddingVertical: 2 },
  premiumBadgeText: { color: colors.gold, fontSize: 9, fontWeight: '700', letterSpacing: 1 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.md,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },
  sheetAffirmation: { fontFamily: fonts.display, fontSize: 20, color: colors.text, lineHeight: 28, marginBottom: spacing.sm },
  sheetQuestion: { color: colors.textDim, fontSize: 14, marginBottom: spacing.md },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border },
  radioSelected: { borderColor: colors.gold, backgroundColor: colors.gold },
  durationLabel: { color: colors.textDim, fontSize: 16 },
  durationLabelSelected: { color: colors.text, fontWeight: '500' },
  confirmBtn: { backgroundColor: colors.gold, borderRadius: radius.full, paddingVertical: 16, alignItems: 'center', marginTop: spacing.md },
  confirmBtnText: { color: colors.bg, fontSize: 15, fontWeight: '600', letterSpacing: 0.5 },
  cancelBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelBtnText: { color: colors.textMuted, fontSize: 14 },
});
