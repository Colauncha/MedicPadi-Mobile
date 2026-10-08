import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  ComponentProps,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { Keyframe } from 'react-native-reanimated';

import { BlurBackground } from '@/components/ui/BlurBackground';
import { useThemedStyles } from '@/hooks/useThemedStyle';
import { useTheme } from '@/theme/ThemeProvider';
import { Theme } from '@/theme/types';

import { AlertButton, alertStore, AlertVariant } from './alertStore';

const enter = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.92 }] },
  100: { opacity: 1, transform: [{ scale: 1 }] },
}).duration(180);

const VARIANT_ICON: Record<
  AlertVariant,
  ComponentProps<typeof Ionicons>['name']
> = {
  info: 'information-circle',
  success: 'checkmark-circle',
  error: 'close-circle',
  warning: 'warning',
};

const VARIANT_HAPTIC: Partial<
  Record<AlertVariant, Haptics.NotificationFeedbackType>
> = {
  success: Haptics.NotificationFeedbackType.Success,
  error: Haptics.NotificationFeedbackType.Error,
  warning: Haptics.NotificationFeedbackType.Warning,
};

const variantColor = (variant: AlertVariant, t: Theme) =>
  ({
    info: t.colors.primary.extraDeep,
    success: t.colors.success,
    error: t.colors.danger,
    warning: t.colors.warning,
  })[variant];

/** Renders alerts queued via `AppAlert.alert`. Mount once near the app root. */
export const AlertHost = () => {
  const { theme } = useTheme();
  const current = useSyncExternalStore(
    alertStore.subscribe,
    alertStore.getCurrent,
    alertStore.getCurrent
  );
  // The alert stays in the store while its Modal animates out, so we track
  // which one is closing separately.
  const [closingId, setClosingId] = useState<number | null>(null);
  // Button action to run once the alert has fully closed. iOS can't present
  // another Modal while one is still dismissing, so we wait for onDismiss.
  const pendingAction = useRef<(() => void) | null>(null);

  const visible = !!current && current.id !== closingId;

  const styles = useThemedStyles((t) =>
    StyleSheet.create({
      backdrop: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: t.spacing.xl,
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
      },
      card: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: t.colors.surfaceCard,
        borderRadius: t.radius.xl,
        padding: t.spacing.xl,
        alignItems: 'center',
        boxShadow: t.shadows.heavy,
      },
      iconWrap: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: t.spacing.md,
      },
      title: {
        fontFamily: t.typography.fonts?.sans,
        fontSize: t.typography.sizes.lg,
        fontWeight: '600',
        color: t.colors.text,
        textAlign: 'center',
      },
      message: {
        fontFamily: t.typography.fonts?.sans,
        fontSize: t.typography.sizes.md,
        lineHeight: 20,
        color: t.colors.textSecondary,
        textAlign: 'center',
        marginTop: t.spacing.sm,
      },
      buttons: {
        alignSelf: 'stretch',
        gap: t.spacing.sm,
        marginTop: t.spacing.xl,
      },
      row: { flexDirection: 'row' },
      button: {
        minHeight: 44,
        paddingHorizontal: t.spacing.base,
        borderRadius: t.radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: t.colors.primary.extraDeep,
      },
      rowButton: { flex: 1 },
      cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: t.colors.border,
      },
      destructiveButton: { backgroundColor: t.colors.danger },
      pressed: { opacity: 0.8 },
      buttonText: {
        fontFamily: t.typography.fonts?.sans,
        fontSize: t.typography.sizes.base,
        fontWeight: '500',
        color: t.colors.buttonText,
      },
      cancelText: { color: t.colors.textSecondary },
    })
  );

  useEffect(() => {
    const haptic = current?.variant && VARIANT_HAPTIC[current.variant];
    if (haptic && Platform.OS !== 'web') Haptics.notificationAsync(haptic);
  }, [current?.id, current?.variant]);

  const finish = (id: number) => {
    const action = pendingAction.current;
    pendingAction.current = null;
    setClosingId(null);
    alertStore.dismiss(id);
    action?.();
  };

  const close = (action?: () => void) => {
    if (!current || closingId !== null) return;
    pendingAction.current = action ?? null;
    setClosingId(current.id);
    if (Platform.OS !== 'ios') finish(current.id);
  };

  const handleDismiss = () => {
    if (closingId !== null) finish(closingId);
  };

  const requestClose = () => {
    if (!current?.cancelable) return;
    close(current.buttons.find((b) => b.style === 'cancel')?.onPress);
  };

  if (!current) return null;

  const inRow = current.buttons.length <= 2;
  // Cancel goes left in a row, and last when stacked (iOS convention).
  const buttons = [...current.buttons].sort((a, b) => {
    const rank = (btn: AlertButton) => (btn.style === 'cancel' ? 0 : 1);
    return inRow ? rank(a) - rank(b) : rank(b) - rank(a);
  });
  const accent = current.variant && variantColor(current.variant, theme);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={requestClose}
      onDismiss={handleDismiss}
    >
      <Pressable style={styles.backdrop} onPress={requestClose}>
        <BlurBackground />
        {/* Swallow presses on the card so they don't close it */}
        <Pressable onPress={() => {}} style={styles.card}>
          <Animated.View
            key={current.id}
            entering={enter}
            style={{ alignSelf: 'stretch', alignItems: 'center' }}
            accessibilityRole="alert"
            accessibilityViewIsModal
          >
            {current.variant && accent ? (
              <View
                style={[styles.iconWrap, { backgroundColor: `${accent}22` }]}
              >
                <Ionicons
                  name={VARIANT_ICON[current.variant]}
                  size={32}
                  color={accent}
                />
              </View>
            ) : null}
            <Text style={styles.title}>{current.title}</Text>
            {current.message ? (
              <Text style={styles.message}>{current.message}</Text>
            ) : null}
            <View style={[styles.buttons, inRow && styles.row]}>
              {buttons.map((button, index) => (
                <Pressable
                  key={`${button.text}-${index}`}
                  accessibilityRole="button"
                  onPress={() => close(button.onPress)}
                  style={({ pressed }) => [
                    styles.button,
                    inRow && styles.rowButton,
                    button.style === 'cancel' && styles.cancelButton,
                    button.style === 'destructive' && styles.destructiveButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      button.style === 'cancel' && styles.cancelText,
                    ]}
                  >
                    {button.text}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
