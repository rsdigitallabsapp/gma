import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, fonts, spacing, radius } from '../theme';
import { Storage } from '../storage';
import { CATEGORIES } from '../data/categories';

function formatWakeTime({ hour, minute }) {
  const period = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minute === 0 ? '00' : '30'} ${period}`;
}

function loadState() {
  const isPremium = Storage.isPremium();
  const categories = Storage.getCategories();
  return {
    streak: Storage.getStreak(),
    categories,
    todayAffirmation: Storage.getTodayAffirmation() || { text: '' },
    wakeTime: Storage.getWakeTime(),
    isPremium,
    customCount: isPremium ? Storage.getCustomAffirmations().length : 0,
    isDone: Storage.isDoneToday(),
    selectedCategories: CATEGORIES.filter(c => categories.includes(c.id)),
  };
}

export function HomeScreen({ navigation }) {
  const [state, setState] = useState(loadState);

  useFocusEffect(useCallback(() => {
    setState(loadState());
  }, []));

  const { streak, todayAffirmation, wakeTime, isPremium, customCount, isDone, selectedCategories } = state;
  const wakeLabel = formatWakeTime(wakeTime);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>GMA</Text>
          <Text style={styles.appSub}>Good Morning Affirmations</Text>
        </View>

        {/* Streak card */}
        <View style={styles.streakCard}>
          <Text style={styles.streakNumber}>{streak}</Text>
          <Text style={styles.streakLabel}>{streak === 1 ? 'day' : 'days'} in a row</Text>
          {streak === 0 && (
            <Text style={styles.streakHint}>Complete your first affirmation to begin your streak.</Text>
          )}
        </View>

        {/* Today's affirmation */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Today's affirmation</Text>
          <View style={styles.affirmationCard}>
            <Text style={styles.affirmationText}>{todayAffirmation.text}</Text>
            {isDone ? (
              <Text style={styles.doneBadge}>Said it</Text>
            ) : (
              <TouchableOpacity
                style={styles.sayItBtn}
                onPress={() => navigation.replace('Affirmation')}
              >
                <Text style={styles.sayItBtnText}>Say it now</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Settings</Text>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation.navigate('EditWakeTime')}
            activeOpacity={0.7}
          >
            <Text style={styles.settingKey}>Wake-up reminder</Text>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>{wakeLabel}</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation.navigate('EditCategories')}
            activeOpacity={0.7}
          >
            <Text style={styles.settingKey}>Categories</Text>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue} numberOfLines={1}>
                {selectedCategories.length > 0
                  ? selectedCategories.map(c => c.label).join(', ')
                  : 'All'}
              </Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingRow, { borderBottomWidth: 0 }]}
            onPress={() => navigation.navigate(isPremium ? 'CustomAffirmations' : 'Paywall')}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.settingKey}>Custom affirmations</Text>
              {!isPremium && <View style={styles.premiumBadge}><Text style={styles.premiumBadgeText}>PREMIUM</Text></View>}
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>
                {isPremium ? (customCount === 0 ? 'None yet' : `${customCount} saved`) : 'Unlock'}
              </Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },

  header: { marginTop: spacing.lg, marginBottom: spacing.lg },
  appName: {
    color: colors.gold,
    fontSize: 13,
    letterSpacing: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  appSub: {
    color: colors.text,
    fontSize: 22,
    fontFamily: fonts.display,
    marginTop: 4,
  },

  streakCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  streakNumber: {
    fontFamily: fonts.display,
    fontSize: 72,
    color: colors.gold,
    lineHeight: 80,
  },
  streakLabel: {
    color: colors.textDim,
    fontSize: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  streakHint: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: spacing.xs,
    maxWidth: 240,
    lineHeight: 18,
  },

  section: { marginBottom: spacing.md },
  sectionLabel: {
    color: colors.textDim,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
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
  doneBadge: {
    color: colors.gold,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sayItBtn: {
    backgroundColor: colors.gold,
    borderRadius: radius.full,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    alignSelf: 'flex-start',
  },
  sayItBtnText: {
    color: colors.bg,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

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
  settingKey: { color: colors.text, fontSize: 15 },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: 180 },
  settingValue: { color: colors.textDim, fontSize: 14, textAlign: 'right', flexShrink: 1 },
  chevron: { color: colors.textMuted, fontSize: 20, lineHeight: 22 },

  premiumBadge: {
    backgroundColor: colors.goldDim,
    borderRadius: radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  premiumBadgeText: {
    color: colors.gold,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
