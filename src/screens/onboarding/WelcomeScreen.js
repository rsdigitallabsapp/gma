import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity,
  Image, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, spacing } from '../../theme';

const logo = require('../../../assets/logo.png');
const { width: SCREEN_W } = Dimensions.get('window');

const SLIDES = [
  {
    headline: 'The first thing you say to yourself each morning shapes the rest of your day.',
    body: 'Before the world tells you who to be, choose what you believe about yourself.',
  },
  {
    headline: 'Most people start with notifications.\nARISE helps you start with intention.',
    body: 'One affirmation. Spoken aloud. Three times. In under ten seconds. Small habit. Big impact.',
  },
];

export function WelcomeScreen({ navigation }) {
  const [slide, setSlide] = useState(0);
  const fade = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(1)).current;
  const logoSlide = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(logoSlide, { toValue: 0, duration: 900, useNativeDriver: true }),
    ]).start();
  }, []);

  function handleContinue() {
    if (slide === 0) {
      // Animate out → switch content → animate in
      Animated.timing(contentFade, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
        setSlide(1);
        Animated.timing(contentFade, { toValue: 1, duration: 280, useNativeDriver: true }).start();
      });
    } else {
      navigation.navigate('Categories');
    }
  }

  const current = SLIDES[slide];

  return (
    <SafeAreaView style={styles.safe}>
      <Animated.View style={[styles.container, { opacity: fade }]}>

        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === slide ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>

        {/* Logo */}
        <Animated.View style={[styles.logoWrap, { transform: [{ translateY: logoSlide }] }]}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
        </Animated.View>

        {/* Slide content */}
        <Animated.View style={[styles.content, { opacity: contentFade }]}>
          <Text style={styles.headline}>{current.headline}</Text>
          <Text style={styles.body}>{current.body}</Text>
        </Animated.View>

        {/* CTA */}
        <View style={styles.bottom}>
          <TouchableOpacity style={styles.btn} activeOpacity={0.85} onPress={handleContinue}>
            <Text style={styles.btnText}>{slide === 0 ? 'Continue' : 'Get started'}</Text>
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
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingTop: spacing.sm,
    paddingBottom: 4,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.gold,
  },
  dotInactive: {
    width: 6,
    backgroundColor: colors.ringEmpty,
  },
  logoWrap: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  logo: {
    width: 180,
    height: 180,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  headline: {
    fontFamily: fonts.display,
    fontSize: 32,
    color: colors.text,
    lineHeight: 42,
    marginBottom: spacing.md,
  },
  body: {
    color: '#C4B9A8',
    fontSize: 16,
    lineHeight: 26,
  },
  bottom: {
    paddingBottom: spacing.lg,
  },
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
