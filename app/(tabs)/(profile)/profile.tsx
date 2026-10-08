import { ThemedText } from '@/components/themed-text';
import { IconSymbol, IconSymbolName } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyle';
import { apiSendVerificationEmail } from '@/services/api';
import { useTheme } from '@/theme/ThemeProvider';
import { getAge } from '@/utils/formatter';
import { Href, router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppAlert } from '@/components/ui/alert';
import { SafeAreaView } from 'react-native-safe-area-context';

const ProfilePage = () => {
  const { user, token, profile, logout, refreshProfile } = useAuth();
  const { theme: appTheme } = useTheme();

  const [refreshing, setRefreshing] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: theme.colors.background,
      },

      scroll: {
        flexGrow: 1,
        alignItems: 'center',
        paddingHorizontal: theme.spacing.base,
        paddingBottom: theme.spacing.xxl + 60,
      },

      header: {
        marginTop: theme.spacing.lg,
        borderRadius: theme.radius.xl,
        width: '100%',
        maxWidth: 500,
        flexDirection: 'row',
        paddingVertical: theme.spacing.xxl,
        paddingHorizontal: theme.spacing.base,
        backgroundColor: theme.colors.surfaceCardLight,
        alignItems: 'center',
        gap: theme.spacing.base,
        position: 'relative',
        flexWrap: 'wrap',
      },

      headerTitle: {
        fontSize: theme.typography.sizes.xl,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
      },

      headerSubTitle: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textMuted,
        textTransform: 'capitalize',
        marginBottom: theme.spacing.xs,
      },

      headerEmail: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textMuted,
      },

      headerIconsView: {
        position: 'absolute',
        bottom: -50,
        right: 0,
        flexDirection: 'row',
        gap: theme.spacing.base,
      },

      headerIcons: {
        padding: theme.spacing.sm,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.surfaceCardLight,
      },

      avatar: {
        width: 100,
        height: 100,
        borderRadius: theme.radius.full,
        borderWidth: 3,
        borderColor: theme.colors.border,
      },

      avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceCardLight,
      },

      verifyBanner: {
        width: '100%',
        maxWidth: 500,
        marginTop: theme.spacing.xxl + 10,
        marginBottom: -theme.spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        backgroundColor: theme.colors.warningBg,
        borderWidth: 1,
        borderColor: theme.colors.warning,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
      },

      verifyBannerText: { flex: 1 },

      verifyBannerTitle: {
        fontSize: theme.typography.sizes.base,
        fontWeight: '600',
        color: theme.colors.warning,
      },

      verifyBannerSub: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textSecondary,
      },

      section: {
        width: '100%',
        maxWidth: 500,
        paddingVertical: theme.spacing.md,
        marginTop: theme.spacing.xxl + 10,
        alignItems: 'flex-start',
      },

      sectionTight: {
        marginTop: -5,
      },

      sectionTitleRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: theme.spacing.md,
        marginTop: 5,
      },

      sectionTitle: {
        fontSize: theme.typography.sizes.lg,
        flex: 1,
      },

      editButton: {
        flexDirection: 'row',
        gap: theme.spacing.md,
        alignItems: 'center',
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surfaceCardLight,
      },

      editText: {
        color: theme.colors.textSecondary,
        fontSize: theme.typography.sizes.sm,
      },

      emptyText: {
        color: theme.colors.textMuted,
        fontSize: theme.typography.sizes.sm,
        paddingTop: theme.spacing.md,
      },

      infoSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      },

      infoSectionItem: {
        width: '30%',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surfaceCardLight,
        borderRadius: theme.radius.lg,
        alignItems: 'center',
      },

      infoSectionTitle: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textMuted,
        fontWeight: '800',
      },

      infoSectionValue: {
        fontSize: theme.typography.sizes.md,
        color: theme.colors.textSecondary,
      },

      listContainer: {
        width: '100%',
        marginTop: theme.spacing.md,
        borderRadius: theme.radius.lg,
        overflow: 'hidden',
        backgroundColor: theme.colors.surfaceCard,
      },

      listRow: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 0.5,
        borderBottomColor: theme.colors.border,
      },

      listRowLast: {
        borderBottomWidth: 0,
      },

      listLabel: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textSecondary,
        fontWeight: '600',
      },

      listValue: {
        flexShrink: 1,
        textAlign: 'right',
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textMuted,
        textTransform: 'capitalize',
      },

      listValuePlain: {
        textTransform: 'none',
      },

      chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.md,
      },

      chip: {
        paddingVertical: theme.spacing.xs,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.dangerBg,
      },

      chipText: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.danger,
      },

      linkLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
      },
    })
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
    } finally {
      setRefreshing(false);
    }
  }, [refreshProfile]);

  const handleLogout = () => {
    AppAlert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  // Prefer the freshly fetched profile over the stored login user, which
  // isn't updated after the email is verified.
  const account = profile?.rest ?? user;
  const needsVerification =
    (profile?.rest?.isEmailVerified ?? user?.isEmailVerified) === false;

  const handleSendVerification = async () => {
    if (!token) return;
    setSendingVerification(true);
    try {
      await apiSendVerificationEmail(token);
      router.push({ pathname: '/verifyEmail', params: { sent: '1' } });
    } catch (e: any) {
      AppAlert.alert(
        'Failed',
        e?.message ?? 'Could not send verification email. Try again.',
        undefined,
        { variant: 'error' }
      );
    } finally {
      setSendingVerification(false);
    }
  };

  if (!token || !account) {
    return null;
  }

  const p = profile?.profile;
  const profilePic = p?.profilePicture?.url ?? null;

  const displayName = p?.firstName
    ? `${p.firstName} ${p.lastName ?? ''}`.trim()
    : (account.fullName ?? account.email);

  const stats = [
    { label: 'Age', value: p?.dateOfBirth ? getAge(p.dateOfBirth, 'yrs') : '—' },
    { label: 'Weight', value: p?.weight ? `${p.weight}kg` : '—' },
    { label: 'Height', value: p?.height ? `${p.height}cm` : '—' },
  ];

  const personalInfo = [
    { label: 'Email Address', value: account.email ?? '—', plain: true },
    { label: 'Phone Number', value: p?.phoneNumber || '—' },
    { label: 'Gender', value: p?.gender || '—' },
    { label: 'Blood Group', value: p?.bloodGroup || '—', plain: true },
    { label: 'Genotype', value: p?.genotype || '—', plain: true },
    { label: 'Emergency Contact', value: p?.emergencyContact || '—' },
  ];

  const nok = p?.nextOfKin;
  const nokInfo = nok
    ? [
        { label: 'Name', value: nok.name || '—' },
        { label: 'Phone', value: nok.phone || '—' },
        { label: 'Email', value: nok.email || '—', plain: true },
        { label: 'Relationship', value: nok.relationship || '—' },
      ]
    : [];

  const allergies = p?.allergies ?? [];

  const links: { label: string; icon: IconSymbolName; to: Href }[] = [
    { label: 'Medical History', icon: 'doc.text.fill', to: '/medicalHistory' },
    { label: 'Notifications', icon: 'bell.fill', to: '/notifications' },
    { label: 'Settings', icon: 'gearshape.fill', to: '/settings' },
  ];

  const renderRows = (
    rows: { label: string; value: string; plain?: boolean }[]
  ) => (
    <View style={styles.listContainer}>
      {rows.map((row, i) => (
        <View
          key={row.label}
          style={[styles.listRow, i === rows.length - 1 && styles.listRowLast]}
        >
          <ThemedText style={styles.listLabel}>{row.label}</ThemedText>
          <ThemedText
            style={[styles.listValue, row.plain && styles.listValuePlain]}
            numberOfLines={1}
          >
            {row.value}
          </ThemedText>
        </View>
      ))}
    </View>
  );

  const editButton = (label: string) => (
    <TouchableOpacity
      onPress={() => router.push('/editProfile')}
      accessibilityRole="button"
      accessibilityLabel={`Edit ${label}`}
      style={styles.editButton}
    >
      <ThemedText style={styles.editText}>Edit</ThemedText>
      <IconSymbol
        name="pencil.line"
        size={12}
        color={appTheme.colors.textSecondary}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={appTheme.colors.textSecondary}
            colors={[appTheme.colors.textSecondary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          {profilePic ? (
            <Image source={{ uri: profilePic }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <IconSymbol
                name="person.fill"
                size={60}
                color={appTheme.colors.textMuted}
              />
            </View>
          )}

          <View style={{ flex: 1 }}>
            <ThemedText
              type="title"
              style={styles.headerTitle}
              numberOfLines={2}
            >
              {displayName}
            </ThemedText>

            <ThemedText
              type="subtitle"
              style={styles.headerSubTitle}
              numberOfLines={1}
            >
              {['Patient', p?.gender].filter(Boolean).join(' • ')}
            </ThemedText>

            <ThemedText style={styles.headerEmail} numberOfLines={1}>
              {account.email}
            </ThemedText>
          </View>

          <View style={styles.headerIconsView}>
            <TouchableOpacity
              onPress={() => router.push('/settings')}
              accessibilityRole="button"
              accessibilityLabel="Open settings"
            >
              <IconSymbol
                name="gearshape.fill"
                color={appTheme.colors.textSecondary}
                style={styles.headerIcons}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/editProfile')}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
            >
              <IconSymbol
                name="pencil.line"
                color={appTheme.colors.textSecondary}
                style={styles.headerIcons}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogout}
              accessibilityRole="button"
              accessibilityLabel="Logout"
            >
              <IconSymbol
                name="door.left.hand.open"
                color={appTheme.colors.danger}
                style={[
                  styles.headerIcons,
                  { backgroundColor: appTheme.colors.dangerBg },
                ]}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Email verification */}
        {needsVerification && (
          <TouchableOpacity
            style={styles.verifyBanner}
            onPress={handleSendVerification}
            disabled={sendingVerification}
            activeOpacity={0.8}
          >
            <IconSymbol
              name="mail.stack.fill"
              size={20}
              color={appTheme.colors.warning}
            />
            <View style={styles.verifyBannerText}>
              <ThemedText style={styles.verifyBannerTitle}>
                Email not verified
              </ThemedText>
              <ThemedText style={styles.verifyBannerSub}>
                Tap to send a verification code
              </ThemedText>
            </View>
            {sendingVerification ? (
              <ActivityIndicator size="small" color={appTheme.colors.warning} />
            ) : (
              <IconSymbol
                name="chevron.right"
                size={20}
                color={appTheme.colors.warning}
              />
            )}
          </TouchableOpacity>
        )}

        {/* Vitals */}
        <View style={[styles.section, styles.infoSection]}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.infoSectionItem}>
              <ThemedText style={styles.infoSectionTitle}>
                {stat.label}
              </ThemedText>
              <ThemedText style={styles.infoSectionValue}>
                {stat.value}
              </ThemedText>
            </View>
          ))}
        </View>

        {/* Personal information */}
        <View style={[styles.section, styles.sectionTight]}>
          <View style={styles.sectionTitleRow}>
            <ThemedText type="title" style={styles.sectionTitle}>
              Personal Information
            </ThemedText>
            {editButton('personal information')}
          </View>
          {renderRows(personalInfo)}
        </View>

        {/* Allergies */}
        <View style={[styles.section, styles.sectionTight]}>
          <View style={styles.sectionTitleRow}>
            <ThemedText type="title" style={styles.sectionTitle}>
              Allergies
            </ThemedText>
          </View>
          {allergies.length > 0 ? (
            <View style={styles.chipRow}>
              {allergies.map((allergy) => (
                <View key={allergy} style={styles.chip}>
                  <ThemedText style={styles.chipText}>{allergy}</ThemedText>
                </View>
              ))}
            </View>
          ) : (
            <ThemedText style={styles.emptyText}>
              No allergies have been added yet.
            </ThemedText>
          )}
        </View>

        {/* Next of kin */}
        <View style={[styles.section, styles.sectionTight]}>
          <View style={styles.sectionTitleRow}>
            <ThemedText type="title" style={styles.sectionTitle}>
              Next of Kin
            </ThemedText>
            {editButton('next of kin')}
          </View>
          {nokInfo.length > 0 ? (
            renderRows(nokInfo)
          ) : (
            <ThemedText style={styles.emptyText}>
              No next of kin has been added yet.
            </ThemedText>
          )}
        </View>

        {/* Links */}
        <View style={[styles.section, styles.sectionTight]}>
          <View style={styles.listContainer}>
            {links.map((link) => (
              <TouchableOpacity
                key={link.label}
                style={styles.listRow}
                onPress={() => router.push(link.to)}
              >
                <View style={styles.linkLeft}>
                  <IconSymbol
                    name={link.icon}
                    size={18}
                    color={appTheme.colors.textSecondary}
                  />
                  <ThemedText style={styles.listLabel}>{link.label}</ThemedText>
                </View>
                <IconSymbol
                  name="chevron.right"
                  size={18}
                  color={appTheme.colors.textMuted}
                />
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.listRow, styles.listRowLast]}
              onPress={handleLogout}
            >
              <View style={styles.linkLeft}>
                <IconSymbol
                  name="door.left.hand.open"
                  size={18}
                  color={appTheme.colors.danger}
                />
                <ThemedText
                  style={[styles.listLabel, { color: appTheme.colors.danger }]}
                >
                  Log Out
                </ThemedText>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfilePage;
