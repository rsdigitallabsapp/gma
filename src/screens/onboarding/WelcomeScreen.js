import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, spacing } from '../../theme';

export function WelcomeScreen({ navigation }) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 1000, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <Animated.View style={[styles.container, { opacity: fade, transform: [{ translateY: slide }] }]}>

        <View style={styles.top}>
          <Text style={styles.eyebrow}>Good Morning Affirmations</Text>
          <Text style={styles.headline}>
            Change the first{'\n'}thing you do{'\n'}each morning.
          </Text>
          <Text style={styles.body}>
            Before anything else — no news, no notifications, no email — you speak one powerful affirmation aloud. Three times. In under ten seconds.
          </Text>
          <Text style={styles.body}>
            That's the whole app.
          </Text>
        </View>

        <View style={styles.bottom}>
          <TouchableOpacity
            style={styles.btn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Categories')}
          >
            <Text style={styles.btnText}>Get started</Text>
          </TouchableOpacity>
        </View>

      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    justifyContent: 'space-between',
  },
  top: { marginTop: spacing.xxl },
  eyebrow: {
    color: colors.gold,
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  headline: {
    fontFamily: fonts.display,
    fontSize: 42,
    color: colors.text,
    lineHeight: 52,
    marginBottom: spacing.lg,
  },
  body: {
    color: colors.textDim,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
  bottom: { paddingBottom: spacing.lg },
  btn: {
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: 'center',
  },
  btnText: {
    color: colors.bg,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
