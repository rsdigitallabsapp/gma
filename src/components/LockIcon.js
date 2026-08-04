import React from 'react';
import Svg, { Rect, Path } from 'react-native-svg';

export function LockIcon({ size = 14, color = '#6B7294' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="11" width="16" height="10" rx="2" stroke={color} strokeWidth={2} />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
