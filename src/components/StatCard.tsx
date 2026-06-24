import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

interface StatCardProps {
  value: string;
  label: string;
}

export const StatCard: React.FC<StatCardProps> = ({ value, label }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary[900],
    borderRadius: radius.lg,
    padding: spacing.base,
    width: '48%',
    justifyContent: 'flex-end',
    minHeight: 100,
  },
  value: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.lg,
    color: colors.text.white,
    marginBottom: spacing.xs,
  },
  label: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: '#e7e7e7',
  },
});
