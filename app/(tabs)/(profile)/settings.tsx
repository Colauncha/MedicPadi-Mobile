import { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import DropDown from '@/components/ui/DropDown';
import { Dropdown as DD2, DropdownOption } from '@/components/ui/DropDown2';
import { IconSymbol } from '@/components/ui/icon-symbol';
import ToggleButton from '@/components/ui/ToggleButton';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyle';
import { useTheme } from '@/theme/ThemeProvider';

const TAB_BAR_HEIGHT = 80;

const themeOptions: DropdownOption[] = [
  {
    value: 'system',
    label: 'System',
  },
  {
    value: 'light',
    label: 'Light',
  },
  {
    value: 'dark',
    label: 'Dark',
  },
];

export default function Settings() {
  const { logout } = useAuth();
  const { mode, setMode } = useTheme();

  const [enable2Fa, setEnable2Fa] = useState(false);
  const [enablePushNotification, setEnablePushNotification] = useState(false);
  const [enableDesktopNotification, setEnableDesktopNotification] =
    useState(false);
  const [enableEmailNotification, setEnableEmailNotification] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<'theme' | 'language' | null>(
    null
  );

  const handleModeChange = (value: string) => {
    setMode(value as typeof mode);
  };

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: theme.colors.background,
      },

      scroll: {
        flexGrow: 1,
        paddingHorizontal: theme.spacing.base,
        paddingTop: theme.spacing.xl,

        // Important:
        // The tab bar is absolute, so the scroll content needs
        // enough bottom padding to scroll above it.
        paddingBottom: TAB_BAR_HEIGHT + theme.spacing.xxl,
      },

      optionsContainer: {
        width: '100%',
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.md,
        overflow: 'hidden',
        marginBottom: theme.spacing.xxl,
        boxShadow: theme.shadows.mild,
      },

      options: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: theme.spacing.md,

        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.lg,

        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      },

      optionsLast: {
        borderBottomWidth: 0,
      },

      optionsContent: {
        flex: 1,
        minWidth: 0,
      },

      optionsMainText: {
        color: theme.colors.text,
        fontSize: theme.typography.sizes.md,
      },

      optionsSubText: {
        color: theme.colors.textMuted,
        marginTop: theme.spacing.xs,
      },

      optionsToggleButtonBg: {
        backgroundColor: theme.colors.purple.base,
        width: 52,
        height: 30,
        borderRadius: theme.radius.full,
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
      optionsToggleButtonSwitch: {
        // backgroundColor: theme.colors.textMuted,
        // height: 18,
      },

      newsSection: {
        width: '100%',
        borderWidth: 1,
        borderRadius: theme.radius.md,
        borderColor: theme.colors.border,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        backgroundColor: theme.colors.background,
        boxShadow: theme.shadows.base,
      },

      title: {
        fontFamily: theme.typography.fonts?.rounded,
        fontSize: theme.typography.sizes.xl,
        fontWeight: 'bold',
        marginBottom: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderColor: theme.colors.border,
      },

      subtitle: {
        fontFamily: theme.typography.fonts?.mono,
        fontSize: theme.typography.sizes.sm,
        paddingVertical: theme.spacing.md,
        color: theme.colors.textMuted,
        textAlign: 'center',
      },

      newsSubSection: {
        borderRadius: theme.radius.md,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.lg,
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceCard,
      },

      newsSubSectionIcon: {
        color: theme.colors.primary.deep,
        backgroundColor: theme.colors.background,
        padding: theme.spacing.lg,
        borderRadius: theme.radius.full,
      },

      logout: {
        marginTop: theme.spacing.xl,

        // Gives the button a decent touch target.
        paddingVertical: theme.spacing.md,
        alignItems: 'center',
      },

      logoutText: {
        color: theme.colors.danger,
        fontSize: theme.typography.sizes.base,
      },
    })
  );

  const isWindows = Platform.OS === 'windows';

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* <TouchableOpacity>

        </TouchableOpacity> */}

        {/* Settings */}
        <ThemedView style={styles.optionsContainer}>
          {/* Language */}
          <View style={styles.options}>
            <View style={styles.optionsContent}>
              <Text style={styles.optionsMainText}>Language</Text>

              <Text style={styles.optionsSubText}>
                Select your language (coming soon)
              </Text>
            </View>

            <DropDown
              data={[{ id: 'eng', label: 'English' }]}
              placeholder="English"
              disabled
            />
          </View>

          {/* Theme */}
          <View style={styles.options}>
            <DD2
              label="Theme"
              value={mode}
              placeholder="Select theme"
              description="Select your prefered theme"
              mainTextStyle={styles.optionsMainText}
              descriptionTextStyle={styles.optionsSubText}
              options={themeOptions}
              isOpen={openDropdown === 'theme'}
              onOpenChange={(open) => setOpenDropdown(open ? 'theme' : null)}
              onChange={(value) => {
                handleModeChange(value);
                setOpenDropdown(null);
              }}
              inLine
              // style={{
              //   // flexDirection: 'row',
              //   alignItems: 'center',
              //   justifyContent: 'space-between',
              // }}
            />
          </View>

          {/* 2FA */}
          <View style={styles.options}>
            <View style={styles.optionsContent}>
              <Text style={styles.optionsMainText}>
                Two-factor Authentication
              </Text>

              <Text style={styles.optionsSubText}>
                Keep your account secure with 2FA
              </Text>
            </View>

            <ToggleButton
              setFunc={setEnable2Fa}
              bgStyle={styles.optionsToggleButtonBg}
              switchStyle={styles.optionsToggleButtonSwitch}
              currentState={enable2Fa}
            />
          </View>

          {/* Notifications */}
          <View style={styles.options}>
            <View style={styles.optionsContent}>
              <Text style={styles.optionsMainText}>
                {isWindows ? 'Desktop Notification' : 'Push Notification'}
              </Text>

              <Text style={styles.optionsSubText}>
                {isWindows
                  ? 'Receive push notifications on desktop'
                  : 'Receive push notifications'}
              </Text>
            </View>

            {isWindows ? (
              <ToggleButton
                setFunc={setEnableDesktopNotification}
                currentState={enableDesktopNotification}
                bgStyle={styles.optionsToggleButtonBg}
                switchStyle={styles.optionsToggleButtonSwitch}
              />
            ) : (
              <ToggleButton
                setFunc={setEnablePushNotification}
                currentState={enablePushNotification}
                bgStyle={styles.optionsToggleButtonBg}
                switchStyle={styles.optionsToggleButtonSwitch}
              />
            )}
          </View>

          {/* Email */}
          <View style={[styles.options, styles.optionsLast]}>
            <View style={styles.optionsContent}>
              <Text style={styles.optionsMainText}>Email Notification</Text>

              <Text style={styles.optionsSubText}>
                Receive email notifications
              </Text>
            </View>

            <ToggleButton
              setFunc={setEnableEmailNotification}
              currentState={enableEmailNotification}
              bgStyle={styles.optionsToggleButtonBg}
              switchStyle={styles.optionsToggleButtonSwitch}
            />
          </View>
        </ThemedView>

        {/* Notice & Updates */}
        <ThemedView style={styles.newsSection}>
          <ThemedText type="title" style={styles.title}>
            Notice & Updates
          </ThemedText>

          <View style={styles.newsSubSection}>
            <IconSymbol
              name="arrow.down.to.line"
              style={styles.newsSubSectionIcon}
              size={30}
            />

            <ThemedText type="subtitle" style={styles.subtitle}>
              You will get news and updates from us here
            </ThemedText>
          </View>
        </ThemedView>

        {/* Logout */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={logout}
          accessibilityRole="button"
          accessibilityLabel="Log out"
        >
          <View style={styles.logout}>
            <ThemedText type="subtitle" style={styles.logoutText}>
              Log Out
            </ThemedText>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
