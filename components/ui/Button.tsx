import { useThemedStyles } from '@/hooks/useThemedStyle';
import { useTheme } from '@/theme/ThemeProvider';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  // const {colors} = useColorSchemeMode()
  const { theme: appTheme } = useTheme();

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.md,
      },
      primary: {
        backgroundColor: theme.colors.primary.extraDeep,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.primary.extraDeep,
      },
      ghost: {
        backgroundColor: 'transparent',
      },
      disabled: {
        opacity: 0.5,
      },
      size_sm: {
        height: 32,
        paddingHorizontal: theme.spacing.md,
      },
      size_md: {
        height: 40,
        paddingHorizontal: theme.spacing.base,
      },
      size_lg: {
        height: 48,
        paddingHorizontal: theme.spacing.xl,
      },
      text: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.base,
      },
      text_primary: {
        color: theme.colors.buttonText,
      },
      text_outline: {
        color: theme.colors.primary.extraDeep,
      },
      text_ghost: {
        color: theme.colors.primary.extraDeep,
      },
      textSize_sm: {
        fontSize: theme.typography.sizes.sm,
      },
      textSize_md: {
        fontSize: theme.typography.sizes.base,
      },
      textSize_lg: {
        fontSize: theme.typography.sizes.lg,
      },
    })
  );

  const containerStyle = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    disabled && styles.disabled,
    style,
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'primary'
              ? appTheme.colors.primary.shallow
              : appTheme.colors.primary.extraDeep
          }
        />
      ) : (
        <Text
          style={[
            styles.text,
            styles[`text_${variant}`],
            styles[`textSize_${size}`],
            textStyle,
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};
