import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

interface DoctorCardProps {
  name: string;
  specialty: string;
  rating: string;
  onPress?: () => void;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({ name, specialty, rating, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.avatar} />
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.specialty}>{specialty}</Text>
      <Text style={styles.rating}>⭐ {rating}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBlue,
    borderRadius: radius.lg,
    padding: spacing.md,
    width: 140,
    marginRight: spacing.md,
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.text.dark,
    marginBottom: spacing.sm,
  },
  name: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.md,
    color: colors.text.dark,
    textAlign: 'center',
    marginBottom: 2,
  },
  specialty: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.light,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  rating: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.medium,
  },
});
