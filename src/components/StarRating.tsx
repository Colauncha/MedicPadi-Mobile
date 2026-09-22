import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
// If using React Native CLI, import from 'react-native-vector-icons/FontAwesome' instead
import { FontAwesome } from '@expo/vector-icons';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  onRatingChange?: (rating: number) => void;
  disabled?: boolean;
  size?: number;
  color?: string;
}

export function StarRating({
  rating,
  maxStars = 5,
  onRatingChange,
  disabled = false,
  size = 32,
  color = '#FFD700', // Gold color
}: StarRatingProps) {
  const stars = [];

  for (let i = 1; i <= maxStars; i++) {
    // Determine which star icon to show
    let name: 'star' | 'star-half-full' | 'star-o' = 'star-o';
    if (rating >= i) {
      name = 'star';
    } else if (rating >= i - 0.5) {
      name = 'star-half-full';
    }

    stars.push(
      <TouchableOpacity
        key={i}
        disabled={disabled}
        activeOpacity={0.7}
        onPress={() => onRatingChange && onRatingChange(i)}
      >
        <FontAwesome
          name={name}
          size={size}
          color={color}
          style={styles.star}
        />
      </TouchableOpacity>
    );
  }

  return <View style={styles.container}>{stars}</View>;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginHorizontal: 4,
  },
});
