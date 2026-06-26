import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, spacing, radius } from '../../theme';
import { Storage } from '../../storage';

const MAX = 120;

export function AddAffirmationScreen({ navigation }) {
  const [text, setText] = useState('');
  const inputRef = useRef(null);
  const canSave = text.trim().length > 3;

  const save = () => {
    if (!canSave) return;
    Storage.addCustomAffirmation(text.trim());
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backArrow}>←</Text>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.eyebrow}>Premium</Text>
          <Text style={styles.headline}>Write your{'\n'}affirmation</Text>
          <Text style={styles.sub}>
            Write it in the present tense as if it's already true. Keep it personal and powerful.
          </Text>

          <View style={styles.examples}>
            <Text style={styles.examplesLabel}>Examples</Text>
            <Text style={styles.exampleText}>"I am exactly where I need to be."</Text>
            <Text style={styles.exampleText}>"My family is healthy and thriving."</Text>
            <Text style={styles.exampleText}>"I earn $10,000 every month with ease."</Text>
          </View>

          <TouchableOpacity
            style={styles.inputWrapper}
            activeOpacity={1}
            onPress={() => inputRef.current?.focus()}
          >
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={text}
              onChangeText={t => t.length <= MAX && setText(t)}
              placeholder="I am..."
              placeholderTextColor={colors.textMuted}
              multiline
              autoFocus
              returnKeyType="done"
              blurOnSubmit
              onSubmitEditing={save}
            />
            <Text style={styles.count}>{text.length} / {MAX}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, !canSave && styles.btnDisabled]}
            disabled={!canSave}
            onPress={save}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>Save affirmation</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
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

  examples: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: 6,
  },
  examplesLabel: {
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  exampleText: {
    color: colors.textDim,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },

  inputWrapper: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.gold,
    padding: spacing.md,
    marginBottom: spacing.md,
    minHeight: 120,
  },
  input: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.text,
    lineHeight: 32,
    minHeight: 80,
  },
  count: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'right',
    marginTop: spacing.xs,
  },

  btn: {
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: 'center',
  },
  btnDisabled: { backgroundColor: colors.goldDim, opacity: 0.5 },
  btnText: { color: colors.bg, fontSize: 16, fontWeight: '600', letterSpacing: 0.5 },
});
