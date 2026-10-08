import { useRef } from 'react';
import {
  KeyboardAvoidingView,
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

interface MenuSheetProps {
  visible: boolean;
  title?: string;
  renderView: () => React.ReactNode;
  onClose: () => void;
  blurTarget?: React.RefObject<View | null>;
}

export const MenuModal = ({
  visible,
  title,
  renderView,
  onClose,
  blurTarget,
}: MenuSheetProps) => {
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

  const handleDismiss = () => {
    const action = pendingAction.current;
    pendingAction.current = null;
    action?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onDismiss={handleDismiss}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <BlurBackground target={blurTarget} />
        {/* Modal renders outside the screen tree, so it needs its own keyboard handling */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
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
            {renderView()}
            <Pressable style={styles.cancel} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
};

export default MenuModal;
