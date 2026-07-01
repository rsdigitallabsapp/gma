import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, spacing, radius } from '../../theme';
import { CATEGORIES } from '../../data/categories';
import { FREE_CATEGORY_LIMIT } from '../../storage';

const ROWS = [];
for (let i = 0; i < CATEGORIES.length; i += 2) {
  ROWS.push(CATEGORIES.slice(i, i + 2));
}

export function CategoryScreen({ navigation }) {
  const [selected, setSelected] = useState([]);
  const canContinue = selected.length > 0;
  const atLimit = selected.length >= FREE_CATEGORY_LIMIT;

  const toggle = (id) => {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= FREE_CATEGORY_LIMIT) return prev;
      return [...prev, id];
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.eyebrow}>Step 1 of 3</Text>
        <Text style={styles.headline}>What matters{'\n'}most to you?</Text>
        <Text style={styles.sub}>
          Choose the areas of life you want to affirm each morning.
        </Text>
        {atLimit && (
          <View style={styles.limitBanner}>
            <Text style={styles.limitText}>
              Free plan: up to {FREE_CATEGORY_LIMIT} categories. Upgrade to Premium for all.
            </Text>
          </View>
        )}

        <View style={styles.grid}>
          {ROWS.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map(item => {
                const isSelected = selected.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => toggle(item.id)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.chipLetter, isSelected && styles.chipLetterSelected]}>
                      <Text style={[styles.chipLetterText, isSelected && styles.chipLetterTextSelected]}>
                        {item.letter}
                      </Text>
                    </View>
                    <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {row.length === 1 && <View style={{ flex: 1 }} />}
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.btn, !canContinue && styles.btnDisabled]}
          disabled={!canContinue}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('WakeTime', { categories: selected })}
        >
          <Text style={styles.btnText}>
            {canContinue ? `Continue  (${selected.length} selected)` : 'Select at least one'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },

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
    marginBottom: spacing.sm,
  },
  sub: {
    color: colors.textDim,
    fontSize: 15,
    lineHeight: 22,
  },

  grid: { marginTop: spacing.md, gap: 10 },
  row: { flexDirection: 'row', gap: 10 },

  chip: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  chipSelected: {
    borderColor: colors.gold,
    backgroundColor: colors.surfaceElevated,
  },
  chipLetter: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.ringEmpty,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  chipLetterSelected: { backgroundColor: colors.gold },
  chipLetterText: { color: colors.textDim, fontSize: 10, fontWeight: '700' },
  chipLetterTextSelected: { color: colors.bg },
  chipLabel: { color: colors.textDim, fontSize: 12, flex: 1, lineHeight: 16 },
  chipLabelSelected: { color: colors.text },

  btn: {
    marginTop: spacing.lg,
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: 'center',
  },
  btnDisabled: {
    backgroundColor: colors.goldDim,
    opacity: 0.5,
  },
  btnText: {
    color: colors.bg,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.lg,
  },
  backArrow: { color: colors.textDim, fontSize: 18 },
  backText: { color: colors.textDim, fontSize: 15 },

  limitBanner: {
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.goldDim,
  },
  limitText: {
    color: colors.gold,
    fontSize: 13,
    lineHeight: 18,
  },
});
