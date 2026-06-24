import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

type Status = 'confirmed' | 'pending' | 'canceled' | 'completed';

interface StatusBadgeProps {
  status: Status;
}

const statusConfig: Record<Status, { label: string; color: string; bg: string }> = {
  confirmed: { label: 'Confirmed', color: colors.green[700], bg: colors.primary[50] },
  pending: { label: 'Pending', color: colors.warning, bg: colors.primary[50] },
  canceled: { label: 'Canceled', color: colors.danger, bg: colors.primary[50] },
  completed: { label: 'Completed', color: colors.green[600], bg: colors.primary[50] },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  label: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
  },
});
