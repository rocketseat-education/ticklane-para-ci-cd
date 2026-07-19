import { StyleSheet, type ViewStyle } from 'react-native';

import type { Theme } from '@/theme';

export const createStyles = (theme: Theme) => {
  const root: ViewStyle = {
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  };

  const actions: ViewStyle = {
    gap: theme.spacing.sm,
  };

  const bulletList: ViewStyle = {
    gap: theme.spacing.xs,
    paddingLeft: theme.spacing.sm,
  };

  return StyleSheet.create({ root, actions, bulletList });
};
