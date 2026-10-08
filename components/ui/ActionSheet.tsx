import { Ionicons } from '@expo/vector-icons';
import { ComponentProps, useRef } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BlurBackground } from '@/components/ui/BlurBackground';
import { useThemedStyles } from '@/hooks/useThemedStyle';
import { useTheme } from '@/theme/ThemeProvider';

export interface ActionSheetOption {
  label: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
  destructive?: boolean;
  onPress: () => void;
}

interface ActionSheetProps {
  visible: boolean;
  title?: string;
  options: ActionSheetOption[];
  onClose: () => void;
  blurTarget?: React.RefObject<View | null>;
}

export const ActionSheet = ({
  visible,
  title,
  options,
  onClose,
  blurTarget,
}: ActionSheetProps) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  // Action to run once the sheet has fully closed. iOS can't present an Alert
  // while a Modal is still dismissing, so we wait for onDismiss there.
  const pendingAction = useRef<(() => void) | null>(null);

  const styles = useThemedStyles((t) =>
    StyleSheet.create({
      backdrop: { flex: 1, justifyContent: 'flex-end' },
      sheet: {
        backgroundColor: t.colors.surfaceCard,
        borderTopLeftRadius: t.radius.xl,
        borderTopRightRadius: t.radius.xl,
        paddingHorizontal: t.spacing.base,
        paddingTop: t.spacing.md,
      },
      handle: {
        alignSelf: 'center',
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: t.colors.border,
        marginBottom: t.spacing.md,
      },
      title: {
        fontSize: t.typography.sizes.sm,
        color: t.colors.textMuted,
        textAlign: 'center',
        marginBottom: t.spacing.sm,
      },
      option: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.spacing.md,
        paddingVertical: t.spacing.md,
      },
      optionText: {
        fontSize: t.typography.sizes.md,
        color: t.colors.text,
      },
      destructiveText: { color: t.colors.danger },
      divider: { height: 1, backgroundColor: t.colors.border },
      cancel: {
        alignItems: 'center',
        paddingVertical: t.spacing.md,
        marginTop: t.spacing.sm,
      },
      cancelText: {
        fontSize: t.typography.sizes.md,
        fontWeight: '500',
        color: t.colors.textSecondary,
      },
    })
  );

  const handlePress = (option: ActionSheetOption) => {
    if (Platform.OS === 'ios') {
      pendingAction.current = option.onPress;
      onClose();
    } else {
      onClose();
      option.onPress();
    }
  };

  const handleDismiss = () => {
    const action = pendingAction.current;
    pendingAction.current = null;
    action?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      onDismiss={handleDismiss}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <BlurBackground target={blurTarget} />
        {/* Swallow presses on the sheet itself so they don't close it */}
        <Pressable
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + theme.spacing.base },
          ]}
          onPress={() => {}}
        >
          <View style={styles.handle} />
          {title ? (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          ) : null}
          {options.map((option, index) => (
            <View key={option.label}>
              {index > 0 && <View style={styles.divider} />}
              <Pressable
                style={styles.option}
                onPress={() => handlePress(option)}
              >
                {option.icon ? (
                  <Ionicons
                    name={option.icon}
                    size={20}
                    color={
                      option.destructive
                        ? theme.colors.danger
                        : theme.colors.text
                    }
                  />
                ) : null}
                <Text
                  style={[
                    styles.optionText,
                    option.destructive && styles.destructiveText,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            </View>
          ))}
          <Pressable style={styles.cancel} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
