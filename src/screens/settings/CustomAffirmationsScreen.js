import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, fonts, spacing, radius } from '../../theme';
import { Storage } from '../../storage';

export function CustomAffirmationsScreen({ navigation }) {
  const [affirmations, setAffirmations] = useState([]);

  useFocusEffect(
    useCallback(() => {
      setAffirmations(Storage.getCustomAffirmations());
    }, [])
  );

  const handleDelete = (id, text) => {
    Alert.alert(
      'Delete affirmation?',
      `"${text}"`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Storage.deleteCustomAffirmation(id);
            setAffirmations(Storage.getCustomAffirmations());
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} bounces>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.eyebrow}>Premium</Text>
        <Text style={styles.headline}>Custom{'\n'}affirmations</Text>
        <Text style={styles.sub}>
          Your affirmations play every morning before the built-in ones.
        </Text>

        {affirmations.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No custom affirmations yet</Text>
            <Text style={styles.emptyDesc}>
              Tap "Add new" below to write your first one.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {affirmations.map((a) => (
              <View key={a.id} style={styles.row}>
                <Text style={styles.rowText}>{a.text}</Text>
                <TouchableOpacity
                  onPress={() => handleDelete(a.id, a.text)}
                  style={styles.deleteBtn}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.deleteIcon}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddAffirmation')}
          activeOpacity={0.85}
        >
          <Text style={styles.addBtnText}>+ Add new affirmation</Text>
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
  sub: {
    color: colors.textDim,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },

  empty: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  emptyDesc: {
    color: colors.textDim,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  list: { gap: 10, marginBottom: spacing.md },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  rowText: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 17,
    color: colors.text,
    lineHeight: 24,
  },
  deleteBtn: { paddingTop: 2 },
  deleteIcon: { color: colors.textMuted, fontSize: 14 },

  addBtn: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gold,
    marginTop: spacing.sm,
  },
  addBtnText: {
    color: colors.gold,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
