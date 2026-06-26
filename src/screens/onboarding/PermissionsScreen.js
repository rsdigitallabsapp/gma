import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { colors, fonts, spacing, radius } from '../../theme';
import { Storage } from '../../storage';
import { requestNotificationPermission, scheduleDailyAffirmationNotification } from '../../hooks/useNotifications';

const PERMS = [
  {
    id: 'mic',
    title: 'Microphone & Speech',
    description: 'So you can say your affirmation aloud and we can confirm all three repetitions.',
  },
  {
    id: 'notifications',
    title: 'Morning Reminder',
    description: 'A single notification at your wake-up time. Nothing else, ever.',
  },
];

export function PermissionsScreen({ navigation, route }) {
  const { categories, wakeHour, wakeMinute } = route.params;
  const [granted, setGranted] = useState({ mic: false, notifications: false });
  const [loading, setLoading] = useState(false);

  const requestAll = async () => {
    setLoading(true);

    const micResult = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    const notifGranted = await requestNotificationPermission();

    setGranted({
      mic: micResult.granted,
      notifications: notifGranted,
    });

    // Save settings regardless — user can grant later from Settings
    Storage.setCategories(categories);
    Storage.setWakeTime(wakeHour, wakeMinute);
    if (notifGranted) {
      await scheduleDailyAffirmationNotification(wakeHour, wakeMinute);
    }
    Storage.setOnboarded();
    setLoading(false);

    navigation.replace('Affirmation');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.eyebrow}>Step 3 of 3</Text>
          <Text style={styles.headline}>Two quick{'\n'}permissions.</Text>
          <Text style={styles.sub}>
            We need these to make the experience work. That's all we ask for.
          </Text>
        </View>

        <View style={styles.cards}>
          {PERMS.map(p => (
            <View key={p.id} style={styles.permCard}>
              <View style={styles.permDot} />
              <View style={styles.permText}>
                <Text style={styles.permTitle}>{p.title}</Text>
                <Text style={styles.permDesc}>{p.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.privacy}>
          We do not record, store, or transmit your voice. Speech recognition runs entirely on your device.
        </Text>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.6 }]}
            activeOpacity={0.85}
            onPress={requestAll}
            disabled={loading}
          >
            <Text style={styles.btnText}>
              {loading ? 'One moment...' : 'Allow and continue'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => {
              Storage.setCategories(categories);
              Storage.setWakeTime(wakeHour, wakeMinute);
              Storage.setOnboarded();
              navigation.replace('Affirmation');
            }}
          >
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, paddingHorizontal: spacing.md },

  header: { marginTop: spacing.lg, marginBottom: spacing.lg },
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

  cards: { gap: 12, marginBottom: spacing.md },
  permCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  permDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold,
    marginTop: 6,
  },
  permText: { flex: 1 },
  permTitle: { color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 4 },
  permDesc: { color: colors.textDim, fontSize: 14, lineHeight: 20 },

  privacy: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.md,
  },

  footer: { marginTop: 'auto', paddingBottom: spacing.lg, gap: 12 },
  btn: {
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: 'center',
  },
  btnText: { color: colors.bg, fontSize: 16, fontWeight: '600', letterSpacing: 0.5 },
  skipBtn: { alignItems: 'center', paddingVertical: 10 },
  skipText: { color: colors.textMuted, fontSize: 13 },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  backArrow: { color: colors.textDim, fontSize: 18 },
  backText: { color: colors.textDim, fontSize: 15 },
});
