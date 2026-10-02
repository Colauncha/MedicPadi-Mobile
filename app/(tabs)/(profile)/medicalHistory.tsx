import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
} from 'react-native';

import AvatarFromString from '@/components/avatar';
import { ActionSheet, ActionSheetOption } from '@/components/ui/ActionSheet';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyle';
import {
  apiAcceptConsent,
  apiDeclineConsent,
  apiGetConsentList,
  apiGetEHRRecords,
  apiGetProfileById,
  apiRevokeConsent,
  apiUpdateConsent,
  ConsentAccessLevel,
  ConsentStatus,
  EHRConsent,
  EHRRecord,
  EHRSourceType,
  ProfileFields,
} from '@/services/api';
import { useTheme } from '@/theme/ThemeProvider';

const formatDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
};

const doctorName = (profile: ProfileFields): string =>
  profile.firstName
    ? `Dr. ${profile.firstName} ${profile.lastName ?? ''}`.trim()
    : 'Doctor';

const doctorSpecialty = (profile: ProfileFields): string =>
  profile.speciality ?? 'General Practitioner';

const SOURCE_SECTIONS: { type: EHRSourceType; title: string }[] = [
  { type: 'appointment', title: 'Consultations' },
  { type: 'prescription', title: 'Prescriptions' },
  { type: 'lab_test', title: 'Lab Reports' },
  { type: 'other', title: 'Other Records' },
];

const ACCESS_LABELS: Record<string, string> = {
  view_only: 'View only',
  full_access: 'Full access',
};

type ProfileRole = Parameters<typeof apiGetProfileById>[1];

const isDoctorRole = (role?: string) =>
  role === 'doctor' || role === 'consultant';

// Maps a consent's grantee_role to the role param GET /profile/:id expects
const profileRoleFor = (role?: string): ProfileRole => {
  if (isDoctorRole(role)) return 'consultant';
  if (role === 'lab' || role === 'laboratory') return 'lab';
  if (role === 'pharmacy') return 'pharmacy';
  return 'patient';
};

const requesterName = (
  consent: EHRConsent,
  profile?: ProfileFields
): string => {
  const p = profile;
  if (p?.firstName) {
    const name = `${p.firstName} ${p.lastName ?? ''}`.trim();
    return isDoctorRole(consent.grantee_role) ? `Dr. ${name}` : name;
  }
  if (p?.name) return p.name;
  return consent.grantee_role
    ? consent.grantee_role.charAt(0).toUpperCase() +
        consent.grantee_role.slice(1)
    : 'Healthcare provider';
};

const comingSoon = (feature: string) =>
  Alert.alert('Coming soon', `${feature} will be available soon.`);

const openReportLink = async (url: string) => {
  try {
    await WebBrowser.openBrowserAsync(url);
  } catch {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Unable to open this report.');
    }
  }
};

export default function MedicalHistoryScreen() {
  const { token } = useAuth();
  const { theme: appTheme } = useTheme();
  const [records, setRecords] = useState<EHRRecord[]>([]);
  const [consents, setConsents] = useState<EHRConsent[]>([]);
  const [granteeProfiles, setGranteeProfiles] = useState<
    Map<string, ProfileFields>
  >(new Map());
  const [providerProfiles, setProviderProfiles] = useState<
    Map<string, ProfileFields>
  >(new Map());
  const [actingId, setActingId] = useState<string | null>(null);
  // Menu content is kept after closing so the sheet doesn't empty mid-animation
  const [menu, setMenu] = useState<{
    title?: string;
    options: ActionSheetOption[];
  }>({ options: [] });
  const [menuVisible, setMenuVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const [ehrRes, consentRes] = await Promise.allSettled([
        apiGetEHRRecords({ limit: 20 }, token),
        apiGetConsentList({ limit: 20 }, token),
      ]);
      const profileTasks: Promise<void>[] = [];

      if (ehrRes.status === 'fulfilled') {
        const list = Array.isArray(ehrRes.value.data) ? ehrRes.value.data : [];
        setRecords(list);

        // Only consultation reports show the doctor, so only fetch those
        const providerIds = Array.from(
          new Set(
            list
              .filter((r) => r.source_type === 'appointment' && r.provider_id)
              .map((r) => r.provider_id)
          )
        );
        profileTasks.push(
          Promise.allSettled(
            providerIds.map((id) => apiGetProfileById(id, 'consultant', token))
          ).then((results) => {
            const map = new Map<string, ProfileFields>();
            results.forEach((res, i) => {
              if (res.status === 'fulfilled' && res.value?.profile)
                map.set(providerIds[i], res.value.profile);
            });
            setProviderProfiles(map);
          })
        );
      }
      if (consentRes.status === 'fulfilled') {
        const list = Array.isArray(consentRes.value.data)
          ? consentRes.value.data
          : [];
        setConsents(list);

        // Fetch the profile behind each grantee so cards can show a name
        const grantees = Array.from(
          new Map(
            list
              .filter((c) => !!c.granted_to_user_id)
              .map((c) => [c.granted_to_user_id, c.grantee_role])
          )
        );
        profileTasks.push(
          Promise.allSettled(
            grantees.map(([id, role]) =>
              apiGetProfileById(id, profileRoleFor(role), token)
            )
          ).then((results) => {
            const map = new Map<string, ProfileFields>();
            results.forEach((res, i) => {
              if (res.status === 'fulfilled' && res.value?.profile)
                map.set(grantees[i][0], res.value.profile);
            });
            setGranteeProfiles(map);
          })
        );
      }

      await Promise.all(profileTasks);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    const timeoutId = setTimeout(() => {
      void loadData();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [token, loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const groupedRecords = useMemo(() => {
    const groups: Record<EHRSourceType, EHRRecord[]> = {
      appointment: [],
      prescription: [],
      lab_test: [],
      other: [],
    };
    for (const record of records) {
      const type = record.source_type ?? 'other';
      (groups[type] ?? groups.other).push(record);
    }
    return groups;
  }, [records]);

  const sortedConsents = useMemo(
    () =>
      [...consents].sort(
        (a, b) =>
          Number(b.status === 'pending') - Number(a.status === 'pending')
      ),
    [consents]
  );

  // Runs a consent request and patches the consent in local state. Uses the
  // server's copy when it returns one, otherwise falls back to `fallback`.
  const runConsentAction = async (
    consent: EHRConsent,
    action: (token: string) => Promise<unknown>,
    fallback: Partial<EHRConsent>
  ) => {
    if (!token) return;
    setActingId(consent.id);
    try {
      const updated = (await action(token)) as EHRConsent | null | undefined;
      setConsents((prev) =>
        prev.map((c) =>
          c.id === consent.id
            ? updated?.id
              ? { ...c, ...updated }
              : { ...c, ...fallback }
            : c
        )
      );
    } catch (e) {
      Alert.alert(
        'Error',
        e instanceof Error ? e.message : 'Something went wrong'
      );
    } finally {
      setActingId(null);
    }
  };

  const respondToConsent = (
    consent: EHRConsent,
    action: 'accept' | 'decline'
  ) =>
    runConsentAction(
      consent,
      (t) =>
        action === 'accept'
          ? apiAcceptConsent(consent.id, t)
          : apiDeclineConsent(consent.id, t),
      { status: (action === 'accept' ? 'active' : 'declined') as ConsentStatus }
    );

  const changeAccessLevel = (
    consent: EHRConsent,
    accessLevel: ConsentAccessLevel
  ) =>
    runConsentAction(
      consent,
      (t) => apiUpdateConsent(consent.id, { access_level: accessLevel }, t),
      { access_level: accessLevel }
    );

  const confirmRevoke = (consent: EHRConsent) => {
    Alert.alert(
      'Revoke access',
      `${requesterName(consent, granteeProfiles.get(consent.granted_to_user_id))} will no longer be able to access your medical records.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: () =>
            runConsentAction(
              consent,
              (t) => apiRevokeConsent(consent.id, t),
              { status: 'revoked' }
            ),
        },
      ]
    );
  };

  const confirmDecline = (consent: EHRConsent) => {
    Alert.alert(
      'Decline request',
      `Decline ${requesterName(consent, granteeProfiles.get(consent.granted_to_user_id))}'s request to access your medical records?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => respondToConsent(consent, 'decline'),
        },
      ]
    );
  };

  const consentMenuOptions = (consent: EHRConsent): ActionSheetOption[] => {
    if (consent.status !== 'active' && consent.status !== 'pending') return [];
    const otherLevel: ConsentAccessLevel =
      consent.access_level === 'full_access' ? 'view_only' : 'full_access';
    const changeAccess: ActionSheetOption = {
      label: `Change access to ${ACCESS_LABELS[otherLevel]}`,
      icon: 'swap-horizontal-outline',
      onPress: () => changeAccessLevel(consent, otherLevel),
    };

    if (consent.status === 'pending') {
      return [
        {
          label: 'Accept',
          icon: 'checkmark-circle-outline',
          onPress: () => respondToConsent(consent, 'accept'),
        },
        changeAccess,
        {
          label: 'Decline',
          icon: 'close-circle-outline',
          destructive: true,
          onPress: () => confirmDecline(consent),
        },
      ];
    }
    return [
      changeAccess,
      {
        label: 'Revoke access',
        icon: 'ban-outline',
        destructive: true,
        onPress: () => confirmRevoke(consent),
      },
    ];
  };

  const recordMenuOptions = (record: EHRRecord): ActionSheetOption[] => [
    ...(record.document_url
      ? [
          {
            label: 'Open report',
            icon: 'open-outline',
            onPress: () => openReportLink(record.document_url!),
          } as ActionSheetOption,
        ]
      : []),
    {
      label: 'Share report',
      icon: 'share-outline',
      onPress: () => comingSoon('Sharing reports'),
    },
    {
      label: 'Request correction',
      icon: 'create-outline',
      onPress: () => comingSoon('Correction requests'),
    },
    {
      label: 'Report misconduct',
      icon: 'flag-outline',
      destructive: true,
      onPress: () => comingSoon('Misconduct reports'),
    },
  ];

  const openMenu = (
    options: ActionSheetOption[],
    title?: string,
    fromLongPress = false
  ) => {
    if (options.length === 0) return;
    if (fromLongPress) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMenu({ title, options });
    setMenuVisible(true);
  };

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: { flex: 1, backgroundColor: theme.colors.background },
      scroll: { padding: theme.spacing.base, paddingBottom: 100 },
      sectionTitle: {
        fontSize: theme.typography.sizes.base,
        fontWeight: '500',
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
      },
      sectionSpacing: { marginTop: theme.spacing.xl },
      emptyText: {
        fontSize: theme.typography.sizes.md,
        color: theme.colors.textMuted,
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
      },
      card: {
        backgroundColor: theme.colors.surfaceCard,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.base,
        marginBottom: theme.spacing.md,
      },
      cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.md,
      },
      profilePicture: {
        width: 48,
        height: 48,
        borderRadius: 24,
      },
      docInfo: { flex: 1 },
      docName: {
        fontSize: theme.typography.sizes.md,
        fontWeight: '500',
        color: theme.colors.text,
      },
      docSpecialty: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textSecondary,
        textTransform: 'capitalize',
      },
      docDate: {
        fontSize: theme.typography.sizes.xs,
        color: theme.colors.textMuted,
      },
      divider: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginBottom: theme.spacing.md,
      },
      row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.sm,
        gap: theme.spacing.md,
      },
      label: {
        fontSize: theme.typography.sizes.md,
        color: theme.colors.textSecondary,
        flex: 1,
      },
      value: {
        fontSize: theme.typography.sizes.md,
        fontWeight: '500',
        color: theme.colors.text,
        flex: 2,
        textAlign: 'right',
      },
      reportLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        marginTop: theme.spacing.sm,
        alignSelf: 'flex-start',
      },
      reportLinkText: {
        fontSize: theme.typography.sizes.md,
        fontWeight: '500',
        color: theme.colors.primary.deep,
      },
      consentMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.xs,
      },
      accessChip: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.surfaceCardLight,
      },
      accessChipText: {
        fontSize: theme.typography.sizes.xs,
        color: theme.colors.textSecondary,
      },
      consentMessage: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.md,
      },
      consentActions: {
        flexDirection: 'row',
        gap: theme.spacing.md,
      },
      actionBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.radius.full,
        minHeight: 40,
      },
      declineBtn: {
        borderWidth: 1,
        borderColor: theme.colors.danger,
      },
      declineText: {
        fontSize: theme.typography.sizes.md,
        fontWeight: '500',
        color: theme.colors.danger,
      },
      acceptBtn: { backgroundColor: theme.colors.primary.deep },
      acceptText: {
        fontSize: theme.typography.sizes.md,
        fontWeight: '500',
        color: theme.colors.buttonText,
      },
      disabled: { opacity: 0.6 },
      cardPressed: { opacity: 0.85 },
      recordTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.md,
      },
      labStatus: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.radius.full,
      },
      statusNormal: { backgroundColor: theme.colors.successBg },
      statusWarning: { backgroundColor: theme.colors.warningBg },
      statusDanger: { backgroundColor: theme.colors.dangerBg },
      labStatusText: {
        fontSize: theme.typography.sizes.sm,
        textTransform: 'capitalize',
      },
      statusNormalText: { color: theme.colors.success },
      statusWarningText: { color: theme.colors.warning },
      statusDangerText: { color: theme.colors.danger },
    })
  );

  const consentBadgeStyles = (status: ConsentStatus) => {
    switch (status) {
      case 'active':
        return [styles.statusNormal, styles.statusNormalText] as const;
      case 'declined':
      case 'revoked':
        return [styles.statusDanger, styles.statusDangerText] as const;
      default:
        return [styles.statusWarning, styles.statusWarningText] as const;
    }
  };

  const renderMenuButton = (onPress: () => void) => (
    <Pressable hitSlop={10} onPress={onPress}>
      <Ionicons
        name="ellipsis-vertical"
        size={18}
        color={appTheme.colors.textSecondary}
      />
    </Pressable>
  );

  const renderConsent = (consent: EHRConsent) => {
    const isPending = consent.status === 'pending';
    const isActing = actingId === consent.id;
    const [badgeBg, badgeText] = consentBadgeStyles(consent.status);
    const profile = granteeProfiles.get(consent.granted_to_user_id);
    const name = requesterName(consent, profile);
    const options = consentMenuOptions(consent);

    return (
      <Pressable
        key={consent.id}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        delayLongPress={300}
        disabled={isActing}
        onLongPress={() => openMenu(options, name, true)}
      >
        <View style={styles.cardHeader}>
          {profile?.profilePicture?.url ? (
            <Image
              source={{ uri: profile.profilePicture.url }}
              style={styles.profilePicture}
            />
          ) : (
            <AvatarFromString input={profile?.firstName || name} size={48} />
          )}
          <View style={styles.docInfo}>
            <Text style={styles.docName}>{name}</Text>
            <View style={styles.consentMeta}>
              <View style={styles.accessChip}>
                <Text style={styles.accessChipText}>
                  {ACCESS_LABELS[consent.access_level] ?? consent.access_level}
                </Text>
              </View>
              {consent.expires_at ? (
                <Text style={styles.docDate}>
                  Expires {formatDate(consent.expires_at)}
                </Text>
              ) : null}
            </View>
          </View>
          {!isPending && (
            <View style={[styles.labStatus, badgeBg]}>
              <Text style={[styles.labStatusText, badgeText]}>
                {consent.status}
              </Text>
            </View>
          )}
          {!isPending && isActing ? (
            <ActivityIndicator color={appTheme.colors.primary.deep} />
          ) : options.length > 0 ? (
            renderMenuButton(() => openMenu(options, name))
          ) : null}
        </View>
        {consent.message ? (
          <Text style={styles.consentMessage}>{consent.message}</Text>
        ) : null}
        {isPending && (
          <View style={styles.consentActions}>
            <Pressable
              style={[
                styles.actionBtn,
                styles.declineBtn,
                isActing && styles.disabled,
              ]}
              disabled={isActing}
              onPress={() => confirmDecline(consent)}
            >
              <Text style={styles.declineText}>Decline</Text>
            </Pressable>
            <Pressable
              style={[
                styles.actionBtn,
                styles.acceptBtn,
                isActing && styles.disabled,
              ]}
              disabled={isActing}
              onPress={() => respondToConsent(consent, 'accept')}
            >
              {isActing ? (
                <ActivityIndicator color={appTheme.colors.buttonText} />
              ) : (
                <Text style={styles.acceptText}>Accept</Text>
              )}
            </Pressable>
          </View>
        )}
      </Pressable>
    );
  };

  const renderRecord = (record: EHRRecord) => {
    const doctor =
      record.source_type === 'appointment'
        ? providerProfiles.get(record.provider_id)
        : undefined;
    const options = recordMenuOptions(record);
    const menuTitle = `Report · ${formatDate(record.createdAt)}`;

    return (
      <Pressable
        key={record.id}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        delayLongPress={300}
        onLongPress={() => openMenu(options, menuTitle, true)}
      >
        {doctor ? (
          <>
            <View style={styles.cardHeader}>
              {doctor.profilePicture?.url ? (
                <Image
                  source={{ uri: doctor.profilePicture.url }}
                  style={styles.profilePicture}
                />
              ) : (
                <AvatarFromString
                  input={doctor.firstName || 'Doctor'}
                  size={48}
                />
              )}
              <View style={styles.docInfo}>
                <Text style={styles.docName}>{doctorName(doctor)}</Text>
                <Text style={styles.docSpecialty}>
                  {doctorSpecialty(doctor)}
                </Text>
                <Text style={styles.docDate}>
                  {formatDate(record.createdAt)}
                </Text>
              </View>
              {renderMenuButton(() => openMenu(options, menuTitle))}
            </View>
            <View style={styles.divider} />
          </>
        ) : (
          <View style={styles.recordTopRow}>
            <Text style={styles.docDate}>{formatDate(record.createdAt)}</Text>
            {renderMenuButton(() => openMenu(options, menuTitle))}
          </View>
        )}
        {record.diagnosis ? (
          <View style={styles.row}>
            <Text style={styles.label}>Diagnosis</Text>
            <Text style={styles.value}>{record.diagnosis}</Text>
          </View>
        ) : null}
        {record.prescription ? (
          <View style={styles.row}>
            <Text style={styles.label}>Prescription</Text>
            <Text style={styles.value}>{record.prescription}</Text>
          </View>
        ) : null}
        {record.notes ? (
          <View style={styles.row}>
            <Text style={styles.label}>Notes</Text>
            <Text style={styles.value}>{record.notes}</Text>
          </View>
        ) : null}
        {record.document_url ? (
          <Pressable
            style={styles.reportLink}
            hitSlop={8}
            onPress={() => openReportLink(record.document_url!)}
          >
            <Ionicons
              name="open-outline"
              size={16}
              color={appTheme.colors.primary.deep}
            />
            <Text style={styles.reportLinkText}>Open report</Text>
          </Pressable>
        ) : null}
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator
          style={{ flex: 1 }}
          color={appTheme.colors.primary.deep}
        />
      </View>
    );
  }

  const visibleSections = SOURCE_SECTIONS.filter(
    ({ type }) => groupedRecords[type].length > 0
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {sortedConsents.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Consent Requests</Text>
            {sortedConsents.map(renderConsent)}
          </>
        )}

        {visibleSections.length === 0 ? (
          <>
            <Text
              style={[
                styles.sectionTitle,
                sortedConsents.length > 0 && styles.sectionSpacing,
              ]}
            >
              Medical Records
            </Text>
            <Text style={styles.emptyText}>No medical records found</Text>
          </>
        ) : (
          visibleSections.map(({ type, title }, index) => (
            <View key={type}>
              <Text
                style={[
                  styles.sectionTitle,
                  (index > 0 || sortedConsents.length > 0) &&
                    styles.sectionSpacing,
                ]}
              >
                {title}
              </Text>
              {groupedRecords[type].map(renderRecord)}
            </View>
          ))
        )}

      </ScrollView>

      <ActionSheet
        visible={menuVisible}
        title={menu.title}
        options={menu.options}
        onClose={() => setMenuVisible(false)}
      />
    </View>
  );
}
