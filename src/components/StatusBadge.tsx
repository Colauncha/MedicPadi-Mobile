import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

type Status = 'confirmed' | 'pending' | 'canceled' | 'completed';

interface StatusBadgeProps {
  status: Status;
}

const statusConfig: Record<Status, { label: string; color: string; bg: string }> = {
  confirmed: { label: 'Confirmed', color: colors.green[700], bg: colors.white },
  pending: { label: 'Pending', color: colors.warning, bg: colors.white },
  canceled: { label: 'Canceled', color: colors.danger, bg: colors.white },
  completed: { label: 'Completed', color: colors.green[600], bg: colors.white },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg, borderColor: config.color, borderWidth: 1 }]}>
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  label: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
  },
});
