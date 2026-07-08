import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { colors, typography, spacing, radius } from '../theme';

interface DateInputProps {
  label?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  value?: string; // ISO date string, e.g. "2000-01-31"
  onChange: (value: string) => void;
  maximumDate?: Date;
  minimumDate?: Date;
}

const toDate = (value?: string) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? undefined : parsed;
};

const formatDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const DateInput: React.FC<DateInputProps> = ({
  label,
  hint,
  error,
  placeholder = 'Select date',
  value,
  onChange,
  maximumDate,
  minimumDate,
}) => {
  const [show, setShow] = useState(false);
  const selectedDate = toDate(value);

  const handleChange = (event: DateTimePickerEvent, date?: Date) => {
    setShow(false);
    if (event.type === 'set' && date) {
      onChange(formatDate(date));
    }
  };

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.container, error ? styles.containerError : null]}
        onPress={() => setShow(true)}
        activeOpacity={0.7}
      >
        <Text style={value ? styles.value : styles.placeholder}>
          {value ?? placeholder}
        </Text>
      </TouchableOpacity>
      {(hint || error) && (
        <Text style={[styles.hint, error ? styles.errorText : null]}>{error ?? hint}</Text>
      )}
      {show && (
        <DateTimePicker
          value={selectedDate ?? new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.base,
  },
  label: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.md,
    color: colors.text.dark,
    marginBottom: spacing.xs,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.base,
    height: 48,
  },
  containerError: {
    borderColor: colors.danger,
  },
  value: {
    flex: 1,
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.md,
    color: colors.text.dark,
  },
  placeholder: {
    flex: 1,
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.md,
    color: colors.text.muted,
  },
  hint: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  errorText: {
    color: colors.danger,
  },
});
