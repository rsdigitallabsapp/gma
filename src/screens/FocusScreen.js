import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, spacing, radius } from '../theme';
import { CATEGORIES } from '../data/categories';
import { AFFIRMATIONS } from '../data/affirmations';
import { Storage } from '../storage';

const DURATIONS = [
  { label: 'Today',              value: 'today' },
  { label: 'This Week',         value: 'week' },
  { label: 'Until I Change It', value: 'forever' },
];

function expiresDateFor(value) {
  const d = new Date();
  if (value === 'today') {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  if (value === 'week') {
    d.setDate(d.getDate() + 7);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  return 'forever';
}

export function FocusScreen({ navigation }) {
  const userCategories = Storage.getCategories();
  // Premium users see all categories, but highlight their selected ones first
  const selected = CATEGORIES.filter(c => userCategories.includes(c.id));
  const others = CATEGORIES.filter(c => !userCategories.includes(c.id));
  const allCategories = [...selected, ...others];

  const currentFocus = Storage.getFocus();
  const [chosenCategory, setChosenCategory] = useState(currentFocus?.categoryId ?? null);
  const [duration, setDuration] = useState('today');

  const canConfirm = !!chosenCategory;

  const handleConfirm = () => {
    const expires = expiresDateFor(duration);
    Storage.setFocus(chosenCategory, expires);

    // Pick a new affirmation from the focused category and store it
    const pool = AFFIRMATIONS.filter(a => a.category === chosenCategory);
    const seenIds = Storage.getSeenIds();
    const unseen = pool.filter(a => !seenIds.includes(a.id));
    const source = unseen.length > 0 ? unseen : pool;
    if (source.length > 0) {
      const pick = source[Math.floor(Math.random() * source.length)];
      Storage.clearAffirmationLock();
      Storage.setTodayAffirmation(pick);
    }

    navigation.goBack();
  };

  const handleClear = () => {
    Storage.clearFocus();
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.eyebrow}>Premium · Focus Mode</Text>
        <Text style={styles.headline}>What do you want{'\n'}to focus on?</Text>
        <Text style={styles.sub}>
          Commit to one area. Every affirmation and shuffle stays in this category until your focus expires.
        </Text>

        {/* Category list */}
        <View style={styles.categoryList}>
          {allCategories.map(c => {
            const isSelected = chosenCategory === c.id;
            const isUserCat = userCategories.includes(c.id);
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.categoryRow, isSelected && styles.categoryRowSelected]}
                onPress={() => setChosenCategory(c.id)}
                activeOpacity={0.75}
              >
                <View style={[styles.radio, isSelected && styles.radioSelected]} />
                <Text style={[styles.categoryLabel, isSelected && styles.categoryLabelSelected]}>
                  {c.label}
                </Text>
                {isUserCat && !isSelected && (
                  <View style={styles.myBadge}><Text style={styles.myBadgeText}>My list</Text></View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Duration */}
        <Text style={styles.durationTitle}>How long?</Text>
        <View style={styles.durationRow}>
          {DURATIONS.map(d => (
            <TouchableOpacity
              key={d.value}
              style={[styles.durationBtn, duration === d.value && styles.durationBtnActive]}
              onPress={() => setDuration(d.value)}
              activeOpacity={0.75}
            >
              <Text style={[styles.durationLabel, duration === d.value && styles.durationLabelActive]}>
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Confirm */}
        <TouchableOpacity
          style={[styles.confirmBtn, !canConfirm && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={!canConfirm}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmBtnText}>Start My Day</Text>
        </TouchableOpacity>

        {currentFocus && (
          <TouchableOpacity style={styles.clearBtn} onPress={handleClear} activeOpacity={0.7}>
            <Text style={styles.clearBtnText}>Remove current focus</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },

  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: spacing.sm, marginBottom: spacing.lg,
  },
  backArrow: { color: colors.textDim, fontSize: 18 },
  backText: { color: colors.textDim, fontSize: 15 },

  eyebrow: {
    color: colors.gold, fontSize: 11, letterSpacing: 3,
    textTransform: 'uppercase', marginBottom: spacing.xs,
  },
  headline: {
    fontFamily: fonts.display, fontSize: 28,
    color: colors.text, lineHeight: 36, marginBottom: spacing.xs,
  },
  sub: { color: colors.textDim, fontSize: 14, lineHeight: 21, marginBottom: spacing.md },

  categoryList: { gap: 2, marginBottom: spacing.md },
  categoryRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 13, paddingHorizontal: spacing.sm,
    borderRadius: radius.sm, borderWidth: 1, borderColor: 'transparent',
  },
  categoryRowSelected: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.goldDim,
  },
  radio: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 1.5, borderColor: colors.border,
  },
  radioSelected: { borderColor: colors.gold, backgroundColor: colors.gold },
  categoryLabel: { flex: 1, color: colors.textDim, fontSize: 15 },
  categoryLabelSelected: { color: colors.text, fontWeight: '600' },
  myBadge: {
    backgroundColor: colors.surfaceElevated, borderRadius: radius.full,
    paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: colors.border,
  },
  myBadgeText: { color: colors.textMuted, fontSize: 9, letterSpacing: 0.5 },

  durationTitle: {
    color: colors.textDim, fontSize: 11, letterSpacing: 2,
    textTransform: 'uppercase', marginBottom: spacing.xs,
  },
  durationRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.lg },
  durationBtn: {
    flex: 1, paddingVertical: 10, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface, alignItems: 'center',
  },
  durationBtnActive: { borderColor: colors.gold, backgroundColor: colors.surfaceElevated },
  durationLabel: { color: colors.textDim, fontSize: 13, textAlign: 'center' },
  durationLabelActive: { color: colors.gold, fontWeight: '600' },

  confirmBtn: {
    backgroundColor: colors.gold, borderRadius: radius.full,
    paddingVertical: 18, alignItems: 'center',
  },
  confirmBtnDisabled: { backgroundColor: colors.goldDim, opacity: 0.5 },
  confirmBtnText: { color: colors.bg, fontSize: 16, fontWeight: '600', letterSpacing: 0.5 },

  clearBtn: { alignItems: 'center', paddingVertical: 14 },
  clearBtnText: { color: colors.error, fontSize: 13 },
});
