import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, spacing, radius } from '../../theme';

function to12h(hour24) {
  const period = hour24 < 12 ? 'AM' : 'PM';
  const h = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  return { h, period };
}

function to24h(h, period) {
  if (period === 'AM') return h === 12 ? 0 : h;
  return h === 12 ? 12 : h + 12;
}

const DEFAULT_HOUR_24 = 8;
const DEFAULT_MINUTE = 0;

export function WakeTimeScreen({ navigation, route }) {
  const { categories } = route.params;
  const init = to12h(DEFAULT_HOUR_24);
  const [hour, setHour] = useState(init.h);
  const [minute, setMinute] = useState(DEFAULT_MINUTE);
  const [period, setPeriod] = useState(init.period);

  const incrementHour = () => setHour(h => h === 12 ? 1 : h + 1);
  const decrementHour = () => setHour(h => h === 1 ? 12 : h - 1);
  const toggleMinute = () => setMinute(m => m === 0 ? 30 : 0);

  const handleContinue = () => {
    const hour24 = to24h(hour, period);
    navigation.navigate('Permissions', {
      categories,
      wakeHour: hour24,
      wakeMinute: minute,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.eyebrow}>Step 2 of 3</Text>
        <Text style={styles.headline}>When do you{'\n'}wake up?</Text>
        <Text style={styles.sub}>
          We'll send a gentle reminder at this time. You decide when — we just show up.
        </Text>

        <View style={styles.pickerCard}>

          <View style={styles.column}>
            <TouchableOpacity onPress={incrementHour} style={styles.arrowBtn} activeOpacity={0.6}>
              <Text style={styles.arrow}>▲</Text>
            </TouchableOpacity>
            <Text style={styles.timeValue}>{String(hour).padStart(2, '0')}</Text>
            <TouchableOpacity onPress={decrementHour} style={styles.arrowBtn} activeOpacity={0.6}>
              <Text style={styles.arrow}>▼</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.colon}>:</Text>

          <View style={styles.column}>
            <TouchableOpacity onPress={toggleMinute} style={styles.arrowBtn} activeOpacity={0.6}>
              <Text style={styles.arrow}>▲</Text>
            </TouchableOpacity>
            <Text style={styles.timeValue}>{minute === 0 ? '00' : '30'}</Text>
            <TouchableOpacity onPress={toggleMinute} style={styles.arrowBtn} activeOpacity={0.6}>
              <Text style={styles.arrow}>▼</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.periodColumn}>
            <TouchableOpacity
              style={[styles.periodBtn, period === 'AM' && styles.periodBtnActive]}
              onPress={() => setPeriod('AM')}
              activeOpacity={0.8}
            >
              <Text style={[styles.periodText, period === 'AM' && styles.periodTextActive]}>AM</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.periodBtn, period === 'PM' && styles.periodBtnActive]}
              onPress={() => setPeriod('PM')}
              activeOpacity={0.8}
            >
              <Text style={[styles.periodText, period === 'PM' && styles.periodTextActive]}>PM</Text>
            </TouchableOpacity>
          </View>

        </View>

        <TouchableOpacity style={[styles.btn, styles.btnMargin]} onPress={handleContinue} activeOpacity={0.85}>
          <Text style={styles.btnText}>Continue</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  container: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
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

  pickerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    gap: 8,
  },

  column: { alignItems: 'center', gap: 8 },
  arrowBtn: { padding: 8 },
  arrow: { color: colors.gold, fontSize: 16 },
  timeValue: {
    fontFamily: fonts.display,
    fontSize: 40,
    color: colors.text,
    lineHeight: 48,
    minWidth: 56,
    textAlign: 'center',
  },
  colon: {
    fontFamily: fonts.display,
    fontSize: 34,
    color: colors.textDim,
    marginBottom: 6,
    paddingHorizontal: 4,
  },

  periodColumn: { gap: 10, marginLeft: 8 },
  periodBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: radius.full,
    backgroundColor: colors.ringEmpty,
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodBtnActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  periodText: { color: colors.textDim, fontSize: 14, fontWeight: '600' },
  periodTextActive: { color: colors.bg },

  btn: {
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: 'center',
  },
  btnMargin: { marginTop: spacing.lg },
  btnText: { color: colors.bg, fontSize: 16, fontWeight: '600', letterSpacing: 0.5 },
});
