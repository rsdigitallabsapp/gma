import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, spacing, radius } from '../theme';
import { Storage } from '../storage';
import { CATEGORIES } from '../data/categories';

export function StatsScreen({ navigation }) {
  const streak = Storage.getStreak();
  const longest = Storage.getLongestStreak();
  const totalDays = Storage.getTotalDays();
  const shieldCount = Storage.getShieldCount();
  const categories = Storage.getCategories();
  const activeCategories = CATEGORIES.filter(c => categories.includes(c.id));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backArrow}>←</Text>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.eyebrow}>Premium</Text>
          <Text style={styles.headline}>Your Stats</Text>
          <Text style={styles.sub}>Every morning adds up.</Text>
        </View>

        {/* Main stats grid */}
        <View style={styles.grid}>
          <View style={[styles.statCard, styles.statCardLarge]}>
            <Text style={styles.statNumLarge}>{streak}</Text>
            <Text style={styles.statLabel}>Current streak</Text>
            <Text style={styles.statSub}>{streak === 1 ? 'day' : 'days'} in a row</Text>
          </View>

          <View style={[styles.statCard, styles.statCardLarge]}>
            <Text style={styles.statNumLarge}>{longest}</Text>
            <Text style={styles.statLabel}>Best streak</Text>
            <Text style={styles.statSub}>all time</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{totalDays}</Text>
            <Text style={styles.statLabel}>Total mornings</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNum}>{shieldCount}</Text>
            <Text style={styles.statLabel}>Shields left</Text>
            <Text style={styles.statSub}>this month</Text>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Active categories</Text>
          <View style={styles.catList}>
            {activeCategories.map(cat => (
              <View key={cat.id} style={styles.catChip}>
                <Text style={styles.catChipText}>{cat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Motivation line */}
        {totalDays > 0 && (
          <View style={styles.motivationCard}>
            <Text style={styles.motivationText}>
              {totalDays === 1
                ? 'Day one is the hardest. You did it.'
                : totalDays < 7
                ? `${totalDays} mornings in. The habit is forming.`
                : totalDays < 30
                ? `${totalDays} mornings spoken. Keep going.`
                : `${totalDays} mornings. This is who you are now.`}
            </Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },

  navRow: { paddingTop: spacing.sm },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backArrow: { color: colors.textDim, fontSize: 18 },
  backText: { color: colors.textDim, fontSize: 15 },

  titleRow: { paddingTop: spacing.md, paddingBottom: spacing.md },
  eyebrow: {
    color: colors.gold,
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  headline: {
    fontFamily: fonts.display,
    fontSize: 34,
    color: colors.text,
    lineHeight: 42,
    marginBottom: 4,
  },
  sub: { color: colors.textDim, fontSize: 14 },

  grid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'flex-start',
  },
  statCardLarge: {},
  statNum: {
    fontFamily: fonts.display,
    fontSize: 48,
    color: colors.gold,
    lineHeight: 56,
  },
  statNumLarge: {
    fontFamily: fonts.display,
    fontSize: 64,
    color: colors.gold,
    lineHeight: 72,
  },
  statLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  statSub: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },

  section: { marginTop: spacing.sm },
  sectionLabel: {
    color: colors.textDim,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  catList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  catChip: {
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catChipText: {
    color: colors.textDim,
    fontSize: 13,
  },

  motivationCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  motivationText: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.text,
    lineHeight: 26,
    textAlign: 'center',
  },
});
