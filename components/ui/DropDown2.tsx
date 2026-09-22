import { useRef } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemedStyles } from '@/hooks/useThemedStyle';

export type DropdownOption = {
  label: string;
  value: string;
};

type DropdownProps = {
  value: string;
  placeholder?: string;
  description?: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  style?: StyleProp<ViewStyle>;
  mainTextStyle?: StyleProp<TextStyle>;
  descriptionTextStyle?: StyleProp<TextStyle>;
  label?: string;
  inLine?: boolean;
};

export function Dropdown({
  value,
  placeholder = 'Select an option',
  description,
  options,
  onChange,
  isOpen,
  onOpenChange,
  style,
  mainTextStyle,
  descriptionTextStyle,
  label,
  inLine = false,
}: DropdownProps) {
  const containerRef = useRef<View>(null);

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: {
        width: '100%',
      },

      inLineContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
      },

      labelContainer: {
        flexDirection: 'column',
      },

      label: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
      },

      trigger: {
        width: inLine ? '40%' : '100%',
        minHeight: 48,
        borderWidth: 1,
        borderColor: isOpen ? theme.colors.primary.deep : theme.colors.border,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.background,
        paddingHorizontal: theme.spacing.md,
        justifyContent: 'center',
      },

      triggerText: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.md,
        color: theme.colors.text,
        textTransform: 'capitalize',
      },

      placeholder: {
        color: theme.colors.textMuted,
      },

      menu: {
        marginTop: theme.spacing.xs,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surfaceCard,
        overflow: 'hidden',
        zIndex: 99,
      },

      inLineMenu: {
        position: 'absolute',
        right: 0,
        top: 50,
        zIndex: 99,
      },

      option: {
        minHeight: 48,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        justifyContent: 'center',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      },

      lastOption: {
        borderBottomWidth: 0,
      },

      optionText: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.md,
        color: theme.colors.text,
        textTransform: 'capitalize',
      },

      selectedOption: {
        backgroundColor: theme.colors.background,
      },

      selectedOptionText: {
        color: theme.colors.primary.deep,
        fontWeight: '600',
      },
    })
  );

  const selectedOption = options.find((option) => option.value === value);

  const handleSelect = (option: DropdownOption) => {
    onChange(option.value);
    onOpenChange(false);
  };

  return (
    <View
      ref={containerRef}
      style={[
        styles.container,
        ...[inLine ? styles.inLineContainer : {}],
        style,
      ]}
    >
      <View style={styles.labelContainer}>
        {label && (
          <ThemedText style={[styles.label, mainTextStyle]}>{label}</ThemedText>
        )}
        {description && (
          <ThemedText style={[styles.label, descriptionTextStyle]}>
            {description}
          </ThemedText>
        )}
      </View>

      <Pressable style={styles.trigger} onPress={() => onOpenChange(!isOpen)}>
        <ThemedText
          style={[styles.triggerText, !selectedOption && styles.placeholder]}
        >
          {selectedOption?.label ?? placeholder}
        </ThemedText>
      </Pressable>

      {isOpen && (
        <View style={[styles.menu, ...[inLine ? styles.inLineMenu : {}]]}>
          {options.map((option, index) => {
            const selected = option.value === value;

            return (
              <Pressable
                key={option.value}
                style={[
                  styles.option,
                  index === options.length - 1 && styles.lastOption,
                  selected && styles.selectedOption,
                ]}
                onPress={() => handleSelect(option)}
              >
                <ThemedText
                  style={[
                    styles.optionText,
                    selected && styles.selectedOptionText,
                  ]}
                >
                  {option.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
