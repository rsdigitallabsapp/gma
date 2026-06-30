import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, Modal, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, spacing, radius } from '../theme';
import { Storage } from '../storage';
import { AFFIRMATIONS } from '../data/affirmations';
import { CATEGORIES } from '../data/categories';

const DURATIONS = [
  { label: 'Just today',       value: 'today' },
  { label: 'One week',         value: 'week' },
  { label: 'One month',        value: 'month' },
  { label: 'Until I change it', value: 'forever' },
];

function addDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function expiresDateFor(value) {
  if (value === 'today')   return addDays(0);
  if (value === 'week')    return addDays(7);
  if (value === 'month')   return addDays(30);
  return 'forever';
}

export function ChangeAffirmationScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState(null);
  const [duration, setDuration] = useState('week');
  const [showPicker, setShowPicker] = useState(false);

  const selectedCategories = Storage.getCategories();
  const isPremium = Storage.isPremium();
  const currentLock = Storage.getLockedAffirmation();

  // All affirmations from user's categories + custom if premium
  const pool = useMemo(() => {
    const base = AFFIRMATIONS.filter(a => selectedCategories.includes(a.category));
    const custom = isPremium
      ? Storage.getCustomAffirmations().map(a => ({ ...a, category: 'custom' }))
      : [];
    return [...custom, ...base];
  }, []);

  // Filter by search query
  const filtered = useMemo(() => {
    if (!query.trim()) return pool;
    const q = query.toLowerCase();
    return pool.filter(a => a.text.toLowerCase().includes(q));
  }, [query, pool]);

  // Group by category for display
  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach(a => {
      if (!groups[a.category]) groups[a.category] = [];
      groups[a.category].push(a);
    });
    return Object.entries(groups).map(([cat, items]) => {
      const catObj = CATEGORIES.find(c => c.id === cat);
      return {
        category: cat,
        label: catObj ? catObj.label : 'Custom',
        items,
      };
    });
  }, [filtered]);

  // Flatten for FlatList
  const listData = useMemo(() => {
    const rows = [];
    grouped.forEach(group => {
      rows.push({ type: 'header', key: `h-${group.category}`, label: group.label });
      group.items.forEach(item => rows.push({ type: 'item', key: item.id, ...item }));
    });
    return rows;
  }, [grouped]);

  const handleTap = (affirmation) => {
    setPicked(affirmation);
    setShowPicker(true);
  };

  const handleConfirm = () => {
    if (!picked) return;
    Storage.setAffirmationLock(picked, expiresDateFor(duration));
    setShowPicker(false);
    navigation.goBack();
  };

  const handleClearLock = () => {
    Storage.clearAffirmationLock();
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Nav */}
      <View style={styles.navRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        {currentLock && (
          <TouchableOpacity onPress={handleClearLock} activeOpacity={0.7}>
            <Text style={styles.clearLock}>Clear lock</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.headline}>Choose an{'\n'}affirmation</Text>
        <Text style={styles.sub}>Tap one to set how long you want to work with it.</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="Search affirmations..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
        />
      </View>

      {/* List */}
      <FlatList
        data={listData}
        keyExtractor={item => item.key}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return <Text style={styles.catHeader}>{item.label}</Text>;
          }
          const isLocked = currentLock?.id === item.id;
          return (
            <TouchableOpacity
              style={[styles.affRow, isLocked && styles.affRowLocked]}
              onPress={() => handleTap(item)}
              activeOpacity={0.75}
            >
              <Text style={[styles.affText, isLocked && styles.affTextLocked]}>
                {item.text}
              </Text>
              {isLocked && <Text style={styles.lockedBadge}>Active</Text>}
            </TouchableOpacity>
          );
        }}
      />

      {/* Duration picker modal */}
      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowPicker(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetAffirmation} numberOfLines={2}>
              "{picked?.text}"
            </Text>
            <Text style={styles.sheetQuestion}>How long do you want to work with this?</Text>

            {DURATIONS.map(d => (
              <TouchableOpacity
                key={d.value}
                style={styles.durationRow}
                onPress={() => setDuration(d.value)}
                activeOpacity={0.7}
              >
                <View style={[styles.radio, duration === d.value && styles.radioSelected]} />
                <Text style={[styles.durationLabel, duration === d.value && styles.durationLabelSelected]}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} activeOpacity={0.85}>
              <Text style={styles.confirmBtnText}>Set affirmation</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowPicker(false)} activeOpacity={0.7}>
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

  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backArrow: { color: colors.textDim, fontSize: 18 },
  backText: { color: colors.textDim, fontSize: 15 },
  clearLock: { color: colors.error, fontSize: 14 },

  titleRow: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
  headline: {
    fontFamily: fonts.display,
    fontSize: 32,
    color: colors.text,
    lineHeight: 40,
    marginBottom: 6,
  },
  sub: { color: colors.textDim, fontSize: 14, lineHeight: 20 },

  searchWrap: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  search: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },

  list: { paddingHorizontal: spacing.md, paddingBottom: 40 },

  catHeader: {
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: spacing.md,
    marginBottom: 6,
  },
  affRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  affRowLocked: {
    borderColor: colors.gold,
    backgroundColor: colors.surfaceElevated,
  },
  affText: {
    color: colors.textDim,
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
    fontFamily: fonts.display,
  },
  affTextLocked: { color: colors.text },
  lockedBadge: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginLeft: 8,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.md,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  sheetAffirmation: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.text,
    lineHeight: 28,
    marginBottom: spacing.sm,
  },
  sheetQuestion: {
    color: colors.textDim,
    fontSize: 14,
    marginBottom: spacing.md,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  radioSelected: {
    borderColor: colors.gold,
    backgroundColor: colors.gold,
  },
  durationLabel: {
    color: colors.textDim,
    fontSize: 16,
  },
  durationLabelSelected: {
    color: colors.text,
    fontWeight: '500',
  },
  confirmBtn: {
    backgroundColor: colors.gold,
    borderRadius: radius.full,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  confirmBtnText: {
    color: colors.bg,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  cancelBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelBtnText: { color: colors.textMuted, fontSize: 14 },
});
