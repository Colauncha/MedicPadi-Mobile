import { router } from 'expo-router';
import { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol, IconSymbolName } from '@/components/ui/icon-symbol';
import { useThemedStyles } from '@/hooks/useThemedStyle';
import { useTheme } from '@/theme/ThemeProvider';

const SIDE_WIDTH = 72;

type HeaderActionProps = {
  label: string;
  onPress: () => void;
  icon?: IconSymbolName;
  /* Which side of the label the icon sits on. */
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  accessibilityLabel?: string;
};

/*
 * Text + chevron button used in the header's side slots.
 */
export function HeaderAction({
  label,
  onPress,
  icon,
  iconPosition = 'right',
  disabled = false,
  accessibilityLabel,
}: HeaderActionProps) {
  const { theme: appTheme } = useTheme();

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      action: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
      },

      actionText: {
        fontSize: theme.typography.sizes.base,
        fontFamily: theme.typography.fonts?.mono,
        color: theme.colors.textMuted,
      },

      disabled: {
        opacity: 0.5,
      },
    })
  );

  const iconEl = icon ? (
    <IconSymbol name={icon} color={appTheme.colors.textMuted} size={16} />
  ) : null;

  return (
    <Pressable
      style={[styles.action, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      {iconPosition === 'left' && iconEl}
      <ThemedText style={styles.actionText}>{label}</ThemedText>
      {iconPosition === 'right' && iconEl}
    </Pressable>
  );
}

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  /* Show the Back button. Defaults to true. */
  back?: boolean;
  /* Defaults to router.back(). */
  onBack?: () => void;
  /* Disables the Back button, e.g. while saving. */
  disabled?: boolean;
  /* Content for the right slot, e.g. a <HeaderAction />. */
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/*
 * In-screen header for stack sub-screens (their navigator sets
 * headerShown: false). Title stays centred between two fixed-width slots.
 */
export function AppHeader({
  title,
  subtitle,
  back = true,
  onBack,
  disabled = false,
  right,
  style,
}: AppHeaderProps) {
  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      header: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
        marginBottom: theme.spacing.base,
      },

      side: {
        width: SIDE_WIDTH,
      },

      right: {
        alignItems: 'flex-end',
      },

      center: {
        flex: 1,
        alignItems: 'center',
      },

      title: {
        fontFamily: theme.typography.fonts?.rounded,
        fontWeight: '600',
        color: theme.colors.text,
        textAlign: 'center',
      },

      subtitle: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.xs,
        color: theme.colors.textMuted,
        textAlign: 'center',
      },
    })
  );

  return (
    <View style={[styles.header, style]}>
      <View style={styles.side}>
        {back && (
          <HeaderAction
            label="Back"
            icon="chevron.left"
            iconPosition="left"
            onPress={onBack ?? (() => router.back())}
            disabled={disabled}
            accessibilityLabel="Go back"
          />
        )}
      </View>

      <View style={styles.center}>
        <ThemedText style={styles.title} numberOfLines={1}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
        ) : null}
      </View>

      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}
