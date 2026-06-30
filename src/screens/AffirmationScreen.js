import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Modal,
  Animated as RNAnimated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, fonts, spacing } from '../theme';
import { RingProgress } from '../components/RingProgress';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { Storage } from '../storage';
import { getDailyAffirmation } from '../data/affirmations';

const TOTAL_REPS = 3;

const KEEP_DURATIONS = [
  { label: 'Just today',        value: 'today' },
  { label: 'One week',          value: 'week' },
  { label: 'One month',         value: 'month' },
  { label: 'Until I change it', value: 'forever' },
];

function expiresDateFor(value) {
  const d = new Date();
  if (value === 'today')  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  if (value === 'week')   { d.setDate(d.getDate()+7); }
  else if (value === 'month') { d.setDate(d.getDate()+30); }
  else return 'forever';
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export function AffirmationScreen({ navigation }) {
  const [affirmation] = useState(() => {
    // Honour the lock first
    const locked = Storage.getLockedAffirmation();
    if (locked) return locked;
    // Otherwise pick daily
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
  const [showKeepPicker, setShowKeepPicker] = useState(false);
  const [keepDuration, setKeepDuration] = useState('week');
  const navTimerRef = useRef(null);

  // Screen entrance
  const fadeAnim = useRef(new RNAnimated.Value(0)).current;
  const textSlide = useRef(new RNAnimated.Value(20)).current;

  // Listening dot pulse
  const pulseAnim = useRef(new RNAnimated.Value(1)).current;

  // Per-ring scale animations (pulse on fill)
  const ringScales = useRef([
    new RNAnimated.Value(1),
    new RNAnimated.Value(1),
    new RNAnimated.Value(1),
  ]).current;

  // Completion: rings spread outward
  const ringTranslates = useRef([
    new RNAnimated.Value(0),
    new RNAnimated.Value(0),
    new RNAnimated.Value(0),
  ]).current;

  // Completion: ripple burst behind rings
  const rippleScale = useRef(new RNAnimated.Value(0.4)).current;
  const rippleOpacity = useRef(new RNAnimated.Value(0)).current;

  // Completion: "Done" label springs in
  const doneLabelScale = useRef(new RNAnimated.Value(0.6)).current;
  const doneLabelOpacity = useRef(new RNAnimated.Value(0)).current;

  // Screen entrance
  useEffect(() => {
    RNAnimated.parallel([
      RNAnimated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      RNAnimated.timing(textSlide, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  // Listening dot pulse loop
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

  // Pulse the newly filled ring on each rep
  useEffect(() => {
    if (completedReps === 0 || completedReps > TOTAL_REPS) return;
    const idx = completedReps - 1;
    RNAnimated.sequence([
      RNAnimated.timing(ringScales[idx], { toValue: 1.35, duration: 160, useNativeDriver: true }),
      RNAnimated.spring(ringScales[idx], { toValue: 1, friction: 5, tension: 140, useNativeDriver: true }),
    ]).start();
  }, [completedReps]);

  // Completion burst
  useEffect(() => {
    if (!isComplete) return;

    // Ripple burst
    rippleScale.setValue(0.4);
    rippleOpacity.setValue(0.6);
    RNAnimated.parallel([
      RNAnimated.timing(rippleScale, { toValue: 3.5, duration: 750, useNativeDriver: true }),
      RNAnimated.timing(rippleOpacity, { toValue: 0, duration: 750, useNativeDriver: true }),
    ]).start();

    // Rings spread outward (left and right, center stays)
    RNAnimated.stagger(40, [
      RNAnimated.spring(ringTranslates[0], { toValue: -22, friction: 6, tension: 100, useNativeDriver: true }),
      RNAnimated.spring(ringTranslates[2], { toValue: 22, friction: 6, tension: 100, useNativeDriver: true }),
    ]).start();

    // "Done" label springs in
    RNAnimated.parallel([
      RNAnimated.spring(doneLabelScale, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
      RNAnimated.timing(doneLabelOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    // Navigate out after delay (user can interrupt with "Keep this")
    navTimerRef.current = setTimeout(() => {
      RNAnimated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => {
        navigation.replace('Home');
      });
    }, 1800);
  }, [isComplete]);

  const handleRep = (n) => {
    setCompletedReps(n);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleComplete = () => {
    setIsComplete(true);
    voice.stop();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Storage.markDoneToday();
    Storage.addSeenId(affirmation.id);
    Storage.addToHistory(affirmation);
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

  const handleKeepThis = () => {
    // Cancel auto-navigate so user has time to pick
    if (navTimerRef.current) clearTimeout(navTimerRef.current);
    setShowKeepPicker(true);
  };

  const handleKeepConfirm = () => {
    Storage.setAffirmationLock(affirmation, expiresDateFor(keepDuration));
    setShowKeepPicker(false);
    RNAnimated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
      navigation.replace('Home');
    });
  };

  const handleSkip = () => {
    if (!showSkipConfirm) { setShowSkipConfirm(true); return; }
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

        {/* Rings + ripple */}
        <View style={styles.ringsWrap}>
          {/* Ripple burst (behind rings) */}
          <RNAnimated.View
            style={[
              styles.ripple,
              { transform: [{ scale: rippleScale }], opacity: rippleOpacity },
            ]}
          />

          {/* 3 Rings */}
          <View style={styles.rings}>
            {Array.from({ length: TOTAL_REPS }).map((_, i) => (
              <RNAnimated.View
                key={i}
                style={{
                  transform: [
                    { scale: ringScales[i] },
                    { translateX: ringTranslates[i] },
                  ],
                }}
              >
                <RingProgress
                  filled={i < completedReps}
                  active={i === completedReps && voice.isListening}
                />
              </RNAnimated.View>
            ))}
          </View>
        </View>

        {/* Count / Done label */}
        {isComplete ? (
          <RNAnimated.View style={{
            transform: [{ scale: doneLabelScale }],
            opacity: doneLabelOpacity,
          }}>
            <Text style={styles.doneLabel}>Done</Text>
          </RNAnimated.View>
        ) : (
          <Text style={styles.countLabel}>{completedReps} / {TOTAL_REPS}</Text>
        )}

        {/* Keep this affirmation */}
        {isComplete && (
          <TouchableOpacity style={styles.keepBtn} onPress={handleKeepThis} activeOpacity={0.7}>
            <Text style={styles.keepBtnText}>Keep this affirmation →</Text>
          </TouchableOpacity>
        )}

        {/* Duration picker modal */}
        <Modal visible={showKeepPicker} transparent animationType="slide" onRequestClose={() => setShowKeepPicker(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowKeepPicker(false)}>
            <Pressable style={styles.sheet} onPress={() => {}}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetAffirmation} numberOfLines={2}>"{affirmation.text}"</Text>
              <Text style={styles.sheetQuestion}>How long do you want to work with this?</Text>
              {KEEP_DURATIONS.map(d => (
                <TouchableOpacity
                  key={d.value}
                  style={styles.durationRow}
                  onPress={() => setKeepDuration(d.value)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.radioBtn, keepDuration === d.value && styles.radioBtnSelected]} />
                  <Text style={[styles.durationLabel, keepDuration === d.value && styles.durationLabelSelected]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.confirmBtn} onPress={handleKeepConfirm} activeOpacity={0.85}>
                <Text style={styles.confirmBtnText}>Set affirmation</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => {
                setShowKeepPicker(false);
                navTimerRef.current = setTimeout(() => {
                  RNAnimated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => navigation.replace('Home'));
                }, 600);
              }} activeOpacity={0.7}>
                <Text style={styles.cancelBtnText}>No thanks</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

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
  safe: { flex: 1, backgroundColor: colors.bg },
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
  ringsWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  ripple: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.gold,
  },
  rings: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
  },
  countLabel: {
    color: colors.textDim,
    fontSize: 13,
    marginTop: 14,
    letterSpacing: 0.5,
  },
  doneLabel: {
    color: colors.gold,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 14,
    letterSpacing: 2,
    textTransform: 'uppercase',
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

  keepBtn: { marginTop: spacing.sm, paddingVertical: 10, paddingHorizontal: spacing.sm },
  keepBtnText: { color: colors.gold, fontSize: 14, letterSpacing: 0.3 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
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
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md,
  },
  sheetAffirmation: {
    fontFamily: fonts.display, fontSize: 20,
    color: colors.text, lineHeight: 28, marginBottom: spacing.sm,
  },
  sheetQuestion: { color: colors.textDim, fontSize: 14, marginBottom: spacing.md },
  durationRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  radioBtn: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: colors.border,
  },
  radioBtnSelected: { borderColor: colors.gold, backgroundColor: colors.gold },
  durationLabel: { color: colors.textDim, fontSize: 16 },
  durationLabelSelected: { color: colors.text, fontWeight: '500' },
  confirmBtn: {
    backgroundColor: colors.gold, borderRadius: 999,
    paddingVertical: 16, alignItems: 'center', marginTop: spacing.md,
  },
  confirmBtnText: { color: colors.bg, fontSize: 15, fontWeight: '600', letterSpacing: 0.5 },
  cancelBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelBtnText: { color: colors.textMuted, fontSize: 14 },
});
