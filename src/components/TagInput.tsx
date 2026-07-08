import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme';

interface TagInputProps {
  label?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  value: string[];
  onChange: (value: string[]) => void;
}

export const TagInput: React.FC<TagInputProps> = ({
  label,
  hint,
  error,
  placeholder = 'Type and use comma to add',
  value,
  onChange,
}) => {
  const [text, setText] = useState('');

  const commitText = (raw: string) => {
    const parts = raw
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const merged = [...value];
    for (const part of parts) {
      if (!merged.includes(part)) merged.push(part);
    }
    onChange(merged);
  };

  const handleChangeText = (raw: string) => {
    if (raw.includes(',')) {
      const segments = raw.split(',');
      const remainder = segments.pop() ?? '';
      commitText(segments.join(','));
      setText(remainder);
    } else {
      setText(raw);
    }
  };

  const handleSubmit = () => {
    if (text.trim()) {
      commitText(text);
      setText('');
    }
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.container, error ? styles.containerError : null]}>
        {value.map((tag, index) => (
          <View key={`${tag}-${index}`} style={styles.chip}>
            <Text style={styles.chipText}>{tag}</Text>
            <TouchableOpacity onPress={() => handleRemove(index)} hitSlop={8}>
              <MaterialIcons name="close" size={14} color={colors.text.white} />
            </TouchableOpacity>
          </View>
        ))}
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.text.muted}
          placeholder={value.length ? '' : placeholder}
          value={text}
          onChangeText={handleChangeText}
          onSubmitEditing={handleSubmit}
          onBlur={handleSubmit}
          blurOnSubmit={false}
        />
      </View>
      {(hint || error) && (
        <Text style={[styles.hint, error ? styles.errorText : null]}>{error ?? hint}</Text>
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
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    minHeight: 48,
  },
  containerError: {
    borderColor: colors.danger,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.primary[950],
  },
  chipText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.white,
  },
  input: {
    flex: 1,
    minWidth: 80,
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.md,
    color: colors.text.dark,
    paddingVertical: spacing.xs,
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
