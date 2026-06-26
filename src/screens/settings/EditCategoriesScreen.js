import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, spacing, radius } from '../../theme';
import { CATEGORIES } from '../../data/categories';
import { Storage } from '../../storage';

const ROWS = [];
for (let i = 0; i < CATEGORIES.length; i += 2) {
  ROWS.push(CATEGORIES.slice(i, i + 2));
}

export function EditCategoriesScreen({ navigation }) {
  const [selected, setSelected] = useState(Storage.getCategories());

  const toggle = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const save = () => {
    Storage.setCategories(selected);
    // Clear today's affirmation so it re-picks from new categories tomorrow
    Storage.setTodayAffirmation(null);
    navigation.goBack();
  };

  const canSave = selected.length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} bounces>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.eyebrow}>Settings</Text>
        <Text style={styles.headline}>Your{'\n'}categories</Text>
        <Text style={styles.sub}>
          Affirmations are picked from these categories each morning.
        </Text>

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
          style={[styles.btn, !canSave && styles.btnDisabled]}
          disabled={!canSave}
          onPress={save}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>
            {canSave ? `Save  (${selected.length} selected)` : 'Select at least one'}
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.lg,
  },
  backArrow: { color: colors.textDim, fontSize: 18 },
  backText: { color: colors.textDim, fontSize: 15 },

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
  sub: { color: colors.textDim, fontSize: 15, lineHeight: 22 },

  grid: { marginTop: spacing.md, gap: 10 },
  row: { flexDirection: 'row', gap: 10 },

  chip: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chipSelected: {
    borderColor: colors.gold,
    backgroundColor: colors.surfaceElevated,
  },
  chipLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.ringEmpty,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLetterSelected: { backgroundColor: colors.gold },
  chipLetterText: { color: colors.textDim, fontSize: 11, fontWeight: '700' },
  chipLetterTextSelected: { color: colors.bg },
  chipLabel: { color: colors.textDim, fontSize: 13, flex: 1, lineHeight: 16 },
  chipLabelSelected: { color: colors.text },

  btn: {
    marginTop: spacing.lg,
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: 'center',
  },
  btnDisabled: { backgroundColor: colors.goldDim, opacity: 0.5 },
  btnText: { color: colors.bg, fontSize: 15, fontWeight: '600', letterSpacing: 0.3 },
});
