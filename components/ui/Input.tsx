import { useThemedStyles } from '@/hooks/useThemedStyle';
import { useTheme } from '@/theme/ThemeProvider';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
// import { colors, theme.typography, theme.spacing, radius } from '../theme';

interface InputProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  rightIcon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
  disabled?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  hint,
  error,
  rightIcon,
  leftIcon,
  showPasswordToggle = false,
  secureTextEntry,
  disabled,
  style,
  ...props
}) => {
  const [isSecure, setIsSecure] = useState(secureTextEntry ?? false);

  const {theme: appTheme} = useTheme()

  const styles = useThemedStyles((theme) => 
    StyleSheet.create({
      wrapper: {
        marginBottom: theme.spacing.base,
      },
      label: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.md,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
      },
      container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.background,
        paddingHorizontal: theme.spacing.base,
        height: 48,
      },
      containerError: {
        borderColor: theme.colors.danger,
      },
      input: {
        flex: 1,
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.md,
        color: theme.colors.text,
      },
      icon: {
        marginLeft: theme.spacing.sm,
      },
      hint: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textMuted,
        marginTop: theme.spacing.xs,
      },
      errorText: {
        color: theme.colors.danger,
      },
      toggleText: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.text,
      },
    })
  )

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.container, error ? styles.containerError : null]}>
        {leftIcon && <View style={styles.icon}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={appTheme.colors.textMuted}
          secureTextEntry={isSecure}
          {...props}
          editable={!disabled}
          selectTextOnFocus={!disabled}
        />
        {showPasswordToggle && (
          <TouchableOpacity onPress={() => setIsSecure(!isSecure)} style={styles.icon}>
            <Text style={styles.toggleText}>{isSecure ? 'Show' : 'Hide'}</Text>
          </TouchableOpacity>
        )}
        {rightIcon && <View style={styles.icon}>{rightIcon}</View>}
      </View>
      {(hint || error) && (
        <Text style={[styles.hint, error ? styles.errorText : null]}>
          {error ?? hint}
        </Text>
      )}
    </View>
  );
};
