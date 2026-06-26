import React, { useEffect } from 'react';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withSequence,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RADIUS = 28;
const STROKE = 3;
const SIZE = (RADIUS + STROKE) * 2 + 4;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CENTER = SIZE / 2;

export function RingProgress({ filled, active }) {
  const progress = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (filled) {
      progress.value = withTiming(1, {
        duration: 1100,
        easing: Easing.out(Easing.cubic),
      });
      scale.value = withSequence(
        withTiming(1.12, { duration: 180 }),
        withSpring(1, { damping: 12 }),
      );
    } else {
      progress.value = withTiming(0, { duration: 300 });
      scale.value = withTiming(1, { duration: 200 });
    }
  }, [filled]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  const strokeColor = filled ? colors.gold : active ? colors.goldDim : colors.ringEmpty;
  const bgStroke = filled ? colors.ringEmpty : colors.ringEmpty;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Svg width={SIZE} height={SIZE}>
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          stroke={bgStroke}
          strokeWidth={STROKE}
          fill="none"
        />
        <AnimatedCircle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          stroke={filled ? colors.gold : colors.goldDim}
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90, ${CENTER}, ${CENTER})`}
        />
      </Svg>
    </Animated.View>
  );
}
