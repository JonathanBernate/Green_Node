import React from 'react';
import { View, StyleSheet } from 'react-native';
import { spacing } from '@/shared/constants/spacing';

interface SpacerProps {
  size?: keyof typeof spacing | number;
}

export function Spacer({ size = 'md' }: SpacerProps) {
  const value = typeof size === 'number' ? size : spacing[size];
  return <View style={{ height: value }} />;
}
