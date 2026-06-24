import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBadge } from './StatusBadge';
import { colors, typography, spacing, radius } from '../theme';

interface AppointmentCardProps {
  time: string;
  type: string;
  patientName: string;
  status: 'confirmed' | 'pending' | 'canceled' | 'completed';
  onPress?: () => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  time,
  type,
  patientName,
  status,
  onPress,
}) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.row}>
        <Text style={styles.time}>{time}</Text>
        <StatusBadge status={status} />
      </View>
      <Text style={styles.type}>{type}</Text>
      <Text style={styles.name}>{patientName}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    width: '48%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  time: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.md,
    color: colors.text.medium,
  },
  type: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.md,
    color: colors.text.medium,
    marginBottom: 2,
  },
  name: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.light,
  },
});
