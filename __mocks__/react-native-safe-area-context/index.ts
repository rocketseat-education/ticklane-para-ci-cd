import React from 'react';
import { View, type ViewProps } from 'react-native';

export const SafeAreaProvider = ({ children }: { children?: React.ReactNode }) => children;

export function SafeAreaView({ children, style, ...rest }: ViewProps & { edges?: string[] }) {
  return React.createElement(View, { style, ...rest }, children);
}

export const useSafeAreaInsets = () => ({
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
});

export const initialWindowMetrics = {
  insets: { top: 0, bottom: 0, left: 0, right: 0 },
  frame: { x: 0, y: 0, width: 0, height: 0 },
};
