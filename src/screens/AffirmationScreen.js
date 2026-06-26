import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Animated as RNAnimated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, fonts, spacing } from '../theme';
import { RingProgress } from '../components/RingProgress';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { Storage } from '../storage';
import { getDailyAffirmation } from '../data/affirmations';

const TOTAL_REPS = 3;

export function AffirmationScreen({ navigation }) {
  const [affirmation] = useState(() => {
    const stored = Storage.getTodayAffirmation();
    const seenIds = Storage.getSeenIds();
    if (stored && !seenIds.includes(stored.id)) return stored;
    const categories = Storage.getCategories();
    const custom = Storage.isPremium() ? Storage.getCustomAffirmations() : [];
    const picked = getDailyAffirmation(categories, seenIds, custom);
    Storage.setTodayAffirmation(picked);
    return picked;
  });

  const streak = Storage.getStreak();
  const [completedReps, setCompletedReps] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  const fadeAnim = useRef(new RNAnimated.Value(0)).current;
  const textSlide = useRef(new RNAnimated.Value(20)).current;
  const completeFade = useRef(new RNAnimated.Value(0)).current;
  const pulseAnim = useRef(new RNAnimated.Value(1)).current;

  useEffect(() => {
    RNAnimated.parallel([
      RNAnimated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      RNAnimated.timing(textSlide, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!isComplete) return;
    RNAnimated.timing(completeFade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [isComplete]);

  // Pulsing dot while listening
  useEffect(() => {
    const loop = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulseAnim, { toValue: 1.4, duration: 700, useNativeDriver: true }),
        RNAnimated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const handleRep = (n) => {
    setCompletedReps(n);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleComplete = () => {
    setIsComplete(true);
    voice.stop();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newStreak = Storage.markDoneToday();
    Storage.addSeenId(affirmation.id);

    setTimeout(() => {
      RNAnimated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => {
        navigation.replace('Home');
      });
    }, 1800);
  };

  const voice = useVoiceRecognition({
    targetPhrase: affirmation.text,
    totalReps: TOTAL_REPS,
    onRep: handleRep,
    onComplete: handleComplete,
  });

  useEffect(() => {
    const timer = setTimeout(() => voice.start(), 600);
    return () => {
      clearTimeout(timer);
      voice.stop();
    };
  }, []);

  const handleSkip = () => {
    if (!showSkipConfirm) {
      setShowSkipConfirm(true);
      return;
    }
    voice.stop();
    RNAnimated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
      navigation.replace('Home');
    });
  };

  const handleTapRep = () => {
    if (completedReps >= TOTAL_REPS) return;
    handleRep(completedReps + 1);
    if (completedReps + 1 >= TOTAL_REPS) handleComplete();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <RNAnimated.View style={[styles.container, { opacity: fadeAnim }]}>

        {/* Streak eyebrow */}
        <View style={styles.eyebrow}>
          {streak > 0 && (
            <Text style={styles.streakText}>Day {streak} in a row</Text>
          )}
        </View>

        {/* Affirmation text */}
        <RNAnimated.View style={{ transform: [{ translateY: textSlide }] }}>
          <Text style={styles.label}>Your affirmation</Text>
          <Text style={styles.affirmation}>{affirmation.text}</Text>
        </RNAnimated.View>

        {/* Instruction */}
        <Text style={styles.instruction}>Say it aloud 3 times</Text>

        {/* Pulsing mic dot */}
        <View style={styles.micRow}>
          {voice.isListening && !isComplete && (
            <RNAnimated.View
              style={[styles.micDot, { transform: [{ scale: pulseAnim }] }]}
            />
          )}
        </View>

        {/* 3 Rings */}
        <View style={styles.rings}>
          {Array.from({ length: TOTAL_REPS }).map((_, i) => (
            <RingProgress
              key={i}
              filled={i < completedReps}
              active={i === completedReps && voice.isListening}
            />
          ))}
        </View>

        {/* Count label */}
        <Text style={styles.countLabel}>
          {isComplete ? 'Done' : `${completedReps} / ${TOTAL_REPS}`}
        </Text>

        {/* Permission error */}
        {voice.error === 'permissions-denied' && (
          <Text style={styles.errorText}>
            Microphone access is required. Enable it in Settings.
          </Text>
        )}

        {/* Tap fallback */}
        {!isComplete && (
          <Pressable onPress={handleTapRep} style={styles.tapFallback}>
            <Text style={styles.tapFallbackText}>
              {completedReps === 0 ? 'Tap if mic is unavailable' : 'Tap again'}
            </Text>
          </Pressable>
        )}

        {/* Skip */}
        {!isComplete && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
            <Text style={styles.skipText}>
              {showSkipConfirm ? 'Confirm skip' : 'Skip today'}
            </Text>
          </TouchableOpacity>
        )}
      </RNAnimated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  eyebrow: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    height: 20,
  },
  streakText: {
    color: colors.gold,
    fontSize: 13,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  label: {
    color: colors.textDim,
    fontSize: 12,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 20,
  },
  affirmation: {
    fontFamily: fonts.display,
    fontSize: 34,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 46,
    maxWidth: 320,
  },
  instruction: {
    color: colors.textDim,
    fontSize: 14,
    marginTop: spacing.lg,
    letterSpacing: 0.5,
  },
  micRow: {
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  micDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold,
    opacity: 0.85,
  },
  rings: {
    flexDirection: 'row',
    gap: 20,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  countLabel: {
    color: colors.textDim,
    fontSize: 13,
    marginTop: 14,
    letterSpacing: 0.5,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 260,
  },
  tapFallback: {
    marginTop: spacing.lg,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
  },
  tapFallbackText: {
    color: colors.textMuted,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  skipBtn: {
    position: 'absolute',
    bottom: spacing.lg,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
  },
  skipText: {
    color: colors.textMuted,
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
