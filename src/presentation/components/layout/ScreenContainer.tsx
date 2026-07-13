import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/shared/constants/colors';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  safeAreaTop?: boolean;
  safeAreaBottom?: boolean;
}

export function ScreenContainer({
  children,
  style,
  safeAreaTop = true,
  safeAreaBottom = true,
}: ScreenContainerProps) {
  const edges: ('top' | 'bottom' | 'left' | 'right')[] = [];
  if (safeAreaTop) edges.push('top');
  if (safeAreaBottom) edges.push('bottom');
  edges.push('left', 'right');

  return (
    <SafeAreaView edges={edges} style={[styles.container, style]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
