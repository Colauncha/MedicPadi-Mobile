import AvatarFromString from '@/components/avatar';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyle';
import {
  apiGetAppointments,
  apiGetProfileById,
  AppointmentData,
  ProfileFields,
} from '@/services/api';
import { useTheme } from '@/theme/ThemeProvider';
import { Theme } from '@/theme/types';
import { formatDateWeekday, formatTime, getAge } from '@/utils/formatter';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  LayoutChangeEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Tab = 'detail' | 'report';

type DetailsTabProps = {
  patient: ProfileFields;
  patientId: string;
  providerId: string;
  token: string;
  theme: Theme;
};

const DetailsTab = ({
  patient,
  patientId,
  providerId,
  token,
  theme,
}: DetailsTabProps) => {
  const [pastAppointments, setPastAppointments] = useState<AppointmentData[]>(
    []
  );

  useEffect(() => {
    if (!token || !patientId || !providerId) {
      return;
    }

    let isMounted = true;

    const loadAppointments = async () => {
      try {
        const response = await apiGetAppointments(
          {
            ids: [patientId, providerId],
          },
          token
        );

        if (isMounted) {
          setPastAppointments(response?.data ?? []);
        }
      } catch (error) {
        if (isMounted) {
          setPastAppointments([]);
        }

        console.error('Failed to load appointments:', error);
      }
    };

    loadAppointments();

    return () => {
      isMounted = false;
    };
  }, [patientId, providerId, token]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          marginBottom: theme.spacing.base,
        },
        sectionHeader: {
          marginTop: theme.spacing.lg,
          color: theme.colors.textSecondary,
          fontSize: theme.typography.sizes.base,
          fontWeight: '800',
        },

        sectionRow: {
          flexDirection: 'row',
          width: '100%',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginVertical: theme.spacing.sm,
        },

        sectionSubText: {
          color: theme.colors.textSecondary,
          fontSize: theme.typography.sizes.md,
          textTransform: 'capitalize',
          maxWidth: '60%',
          textAlign: 'right',
        },

        pastAppHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },

        viewAll: {
          marginTop: theme.spacing.lg,
          color: theme.colors.primary.extraDeep,
          fontSize: theme.typography.sizes.sm,
          textDecorationLine: 'underline',
        },

        avatar: {
          width: 40,
          height: 40,
          borderRadius: theme.radius.full,
          overflow: 'hidden',
          backgroundColor: theme.colors.surface,
        },

        avatarImg: {
          width: 40,
          height: 40,
          borderRadius: theme.radius.full,
        },

        listCard: {
          backgroundColor: theme.colors.surfaceCardLight,
          padding: theme.spacing.md,
          marginTop: theme.spacing.md,
          borderRadius: theme.radius.xl,
        },

        listHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderColor: theme.colors.border,
          // paddingBottom: theme.spacing.sm,
          position: 'relative',
        },

        listHeaderText: {
          marginLeft: theme.spacing.md,
          color: theme.colors.textSecondary,
          fontSize: theme.typography.sizes.base,
          fontWeight: '800',
        },

        listHeaderSubText: {
          marginLeft: theme.spacing.md,
          marginTop: 2,
          color: theme.colors.textMuted,
          fontSize: theme.typography.sizes.sm,
        },

        statusBox: {
          borderRadius: theme.radius.lg,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.xs / 2,
          position: 'absolute',
          right: 0,
          justifyContent: 'center',
          alignItems: 'center',
        },

        statusText: {
          fontWeight: '800',
          fontFamily: theme.typography.fonts?.mono,
          fontSize: theme.typography.sizes.sm,
          textTransform: 'capitalize',
        },

        listContent: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          paddingVertical: theme.spacing.sm,
        },

        listContentIcon: {
          padding: theme.spacing.md,
          borderRadius: theme.radius.full,
          backgroundColor: theme.colors.surfaceCard,
        },

        listSubContent: {
          flexDirection: 'row',
          width: '45%',
          alignItems: 'center',
          gap: theme.spacing.sm,
        },

        listButtons: {
          flexDirection: 'row',
          width: '100%',
          justifyContent: 'center',
          alignItems: 'center',
        },

        listContentText: {
          flexGrow: 1,
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
        },

        listContentSubText: {
          marginTop: 1,
          color: theme.colors.textMuted,
          fontSize: theme.typography.sizes.sm,
        },

        listButton: {
          width: '100%',
          height: theme.spacing.xxl,
        },
      }),
    [theme]
  );

  const patientName =
    [patient?.firstName, patient?.lastName].filter(Boolean).join(' ') ||
    'Unnamed Patient';

  const renderAppointment = useCallback(
    (item: AppointmentData, index: number) => {
      const appointmentType =
        item.description?.split(' – ')[0]?.trim() || 'Consultation';

      return (
        <View
          key={item.id ? String(item.id) : `appointment-${index}`}
          style={styles.listCard}
        >
          <View style={styles.listHeader}>
            <View style={styles.avatar}>
              {patient.profilePicture?.url ? (
                <Image
                  source={{ uri: patient.profilePicture.url }}
                  style={styles.avatarImg}
                  contentFit="cover"
                />
              ) : (
                <AvatarFromString input={patientName} size={40} />
              )}
            </View>

            <View>
              <ThemedText style={styles.listHeaderText}>
                {patientName}
              </ThemedText>

              <ThemedText style={styles.listHeaderSubText}>
                {appointmentType}
              </ThemedText>
            </View>

            <View
              style={[
                styles.statusBox,
                ...[
                  item.status === 'confirmed'
                    ? {
                        backgroundColor: theme.colors.blue.base,
                      }
                    : item.status === 'completed'
                      ? {
                          backgroundColor: theme.colors.successBg,
                        }
                      : item.status === 'pending'
                        ? {
                            backgroundColor: theme.colors.warningBg,
                          }
                        : {
                            backgroundColor: theme.colors.dangerBg,
                          },
                ],
              ]}
            >
              <ThemedText
                style={[
                  styles.statusText,
                  ...[
                    item.status === 'confirmed'
                      ? {
                          color: theme.colors.blue.extraDeep,
                        }
                      : item.status === 'completed'
                        ? {
                            color: theme.colors.success,
                          }
                        : item.status === 'pending'
                          ? {
                              color: theme.colors.warning,
                            }
                          : {
                              color: theme.colors.danger,
                            },
                  ],
                ]}
              >
                {item.status}
              </ThemedText>
            </View>
          </View>
          <View style={styles.listContent}>
            <View style={styles.listSubContent}>
              <IconSymbol
                name={'calendar.badge'}
                size={25}
                style={styles.listContentIcon}
                color={theme.colors.primary.extraDeep}
              />
              <View style={styles.listContentText}>
                <ThemedText>Date</ThemedText>
                <ThemedText style={styles.listContentSubText}>
                  {formatDateWeekday(item.appointment_time, true, true)}
                </ThemedText>
              </View>
            </View>
            <View style={styles.listSubContent}>
              <IconSymbol
                name={'clock.badge.fill'}
                size={25}
                style={styles.listContentIcon}
                color={theme.colors.primary.extraDeep}
              />
              <View style={styles.listContentText}>
                <ThemedText>Time</ThemedText>
                <ThemedText style={styles.listContentSubText}>
                  {formatTime(item.appointment_time)}
                </ThemedText>
              </View>
            </View>
          </View>
          <View style={styles.listButtons}>
            <Button
              label="View Details"
              variant="outline"
              onPress={() =>
                router.push({
                  pathname: '/appointments/[id]',
                  params: { id: item.id },
                })
              }
              style={styles.listButton}
            />
            {/* <Button
              label="View Profile"
              variant="primary"
              onPress={() =>
                router.push({
                  pathname: '/patients/[id]',
                  params: { id: item.patient_id },
                })
              }
              style={styles.listButton}
            /> */}
          </View>
        </View>
      );
    },
    [patient, patientName, styles, theme]
  );

  return (
    <View>
      {/* Personal Information */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionHeader}>
          Personal Information
        </ThemedText>

        <View style={styles.sectionRow}>
          <ThemedText>Name</ThemedText>
          <ThemedText style={styles.sectionSubText}>{patientName}</ThemedText>
        </View>

        <View style={styles.sectionRow}>
          <ThemedText>Age</ThemedText>
          <ThemedText style={styles.sectionSubText}>
            {patient.dateOfBirth ? getAge(patient.dateOfBirth, 'yrs') : '-'}
          </ThemedText>
        </View>

        <View style={styles.sectionRow}>
          <ThemedText>Gender</ThemedText>
          <ThemedText style={styles.sectionSubText}>
            {patient.gender || '-'}
          </ThemedText>
        </View>

        <View style={styles.sectionRow}>
          <ThemedText>Blood Group</ThemedText>
          <ThemedText style={styles.sectionSubText}>
            {patient.bloodGroup || '-'}
          </ThemedText>
        </View>

        <View style={styles.sectionRow}>
          <ThemedText>Genotype</ThemedText>
          <ThemedText style={styles.sectionSubText}>
            {patient.genotype || '-'}
          </ThemedText>
        </View>
      </View>

      {/* Emergency Information */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionHeader}>Emergency Details</ThemedText>

        <View style={styles.sectionRow}>
          <ThemedText>Name</ThemedText>
          <ThemedText style={styles.sectionSubText}>
            {patient.nextOfKin?.name || '-'}
          </ThemedText>
        </View>

        <View style={styles.sectionRow}>
          <ThemedText>Email</ThemedText>
          <ThemedText
            style={[styles.sectionSubText, { textTransform: 'none' }]}
          >
            {patient.nextOfKin?.email || '-'}
          </ThemedText>
        </View>

        <View style={styles.sectionRow}>
          <ThemedText>Phone</ThemedText>
          <ThemedText style={styles.sectionSubText}>
            {patient.nextOfKin?.phone || '-'}
          </ThemedText>
        </View>

        <View style={styles.sectionRow}>
          <ThemedText>Relationship</ThemedText>
          <ThemedText style={styles.sectionSubText}>
            {patient.nextOfKin?.relationship || '-'}
          </ThemedText>
        </View>
      </View>

      {/* Past Appointments */}
      <View style={styles.section}>
        <View style={styles.pastAppHeader}>
          <ThemedText style={styles.sectionHeader}>Past Appointment</ThemedText>

          <TouchableOpacity activeOpacity={0.8}>
            <ThemedText style={styles.viewAll}>View All</ThemedText>
          </TouchableOpacity>
        </View>

        {pastAppointments.length > 0 ? (
          pastAppointments.map(renderAppointment)
        ) : (
          <ThemedText
            style={{
              marginTop: theme.spacing.md,
              color: theme.colors.textMuted,
              fontSize: theme.typography.sizes.sm,
            }}
          >
            No past appointments
          </ThemedText>
        )}
      </View>
    </View>
  );
};

const ReportsTab = () => {
  return (
    <View
      style={{
        paddingVertical: 20,
      }}
    >
      {/* Reports content goes here */}
    </View>
  );
};

const PatientDetails = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, user } = useAuth();
  const { theme: appTheme } = useTheme();

  const [patient, setPatient] = useState<ProfileFields | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTab, setCurrentTab] = useState<Tab>('detail');

  const [tabAnimation] = useState(() => new Animated.Value(0));

  const [tabWidth, setTabWidth] = useState(0);

  const tabIndex = currentTab === 'detail' ? 0 : 1;

  useEffect(() => {
    if (!token || !id) {
      return;
    }

    let isMounted = true;

    const loadPatient = async () => {
      try {
        const response = await apiGetProfileById(id, 'patient', token);

        if (isMounted && response?.profile) {
          setPatient(response.profile);
        }
      } catch (error) {
        console.error('Failed to load patient:', error);
      }
    };

    loadPatient();

    return () => {
      isMounted = false;
    };
  }, [id, token]);

  useEffect(() => {
    Animated.spring(tabAnimation, {
      toValue: tabIndex,
      useNativeDriver: true,
      tension: 90,
      friction: 12,
    }).start();
  }, [tabAnimation, tabIndex]);

  const handleTabPress = useCallback(
    (tab: Tab) => {
      if (tab === currentTab) {
        return;
      }

      setCurrentTab(tab);
    },
    [currentTab]
  );

  const handleTabLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const width = event.nativeEvent.layout.width;

      if (width !== tabWidth) {
        setTabWidth(width);
      }
    },
    [tabWidth]
  );

  const handleRefresh = useCallback(async () => {
    if (!token || !id) {
      return;
    }

    setRefreshing(true);

    try {
      const response = await apiGetProfileById(id, 'patient', token);

      if (response?.profile) {
        setPatient(response.profile);
      }
    } catch (error) {
      console.error('Failed to refresh patient:', error);
    } finally {
      setRefreshing(false);
    }
  }, [id, token]);

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: {
        flex: 1,
        paddingHorizontal: theme.spacing.base,
        backgroundColor: theme.colors.background,
        paddingTop: theme.spacing.xxl,
      },

      scroll: {
        flexGrow: 1,
        alignItems: 'center',
        paddingHorizontal: theme.spacing.base,
        paddingBottom: theme.spacing.xxl + 60,
      },

      avatar: {
        width: 140,
        height: 140,
        borderRadius: theme.radius.full,
        borderWidth: 10,
        borderColor: theme.colors.background,
        position: 'absolute',
        top: -80,
      },

      upperRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.base,
        paddingVertical: theme.spacing.sm,
      },

      upperRowItem: {
        position: 'absolute',
        top: 7,
        left: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
      },

      upperRowText: {
        fontFamily: theme.typography.fonts?.rounded,
        color: theme.colors.text,
      },

      upperRowItemText: {
        fontSize: theme.typography.sizes.base,
        fontFamily: theme.typography.fonts?.mono,
        color: theme.colors.textMuted,
      },

      header: {
        borderRadius: theme.radius.lg,
        width: '100%',
        height: theme.spacing.xxl * 5,
        backgroundColor: theme.colors.surfaceCardLight,
        marginTop: theme.spacing.xxl * 3,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      },

      details: {
        marginTop: theme.spacing.xxl + 5,
        alignItems: 'center',
        justifyContent: 'center',
      },

      headerText: {
        fontSize: theme.typography.sizes.xl,
        color: theme.colors.textSecondary,
      },

      headerSubText: {
        marginTop: theme.spacing.md,
        fontSize: theme.typography.sizes.md,
        color: theme.colors.textMuted,
      },

      tabGroup: {
        width: '100%',
        marginTop: theme.spacing.xl * 2,
        // overflow: 'hidden',
      },

      tabHeaders: {
        width: '100%',
        height: 48,
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.textMuted,
      },

      tab: {
        width: '50%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
      },

      tabText: {
        color: theme.colors.textMuted,
        fontSize: theme.typography.sizes.base,
      },

      tabTextActive: {
        color: theme.colors.primary.extraDeep,
        fontWeight: '600',
      },

      tabIndicator: {
        position: 'absolute',
        bottom: -1,
        left: 0,
        width: '50%',
        height: 3,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.primary.extraDeep,
      },

      tabBody: {
        width: '100%',
        overflow: 'hidden',
        marginTop: theme.spacing.sm,
      },

      tabContent: {
        width: '100%',
        // paddingLeft: -40,
        // borderWidth: 1,
      },
    })
  );

  const patientUrl = patient?.profilePicture?.url;

  const patientName =
    [patient?.firstName, patient?.lastName].filter(Boolean).join(' ') ||
    'Patient';

  const indicatorTranslateX = tabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, tabWidth / 2],
  });

  const bodyTranslateX = tabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -0],
  });

  const bodyOpacity = tabAnimation.interpolate({
    inputRange: [0, 0.35, 0.65, 1],
    outputRange: [1, 0.7, 0.7, 1],
  });

  const handleGoBack = () => {
    // if (router.canGoBack()) {
    //   router.back();
    //   return;
    // }
    router.replace('/patients');
  };

  if (!patient) {
    return (
      <View
        style={[
          styles.container,
          {
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <ActivityIndicator color={appTheme.colors.primary.extraDeep} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Header */}
      <View style={styles.upperRow}>
        <Pressable style={styles.upperRowItem} onPress={handleGoBack}>
          <IconSymbol
            name="chevron.left"
            color={appTheme.colors.textMuted}
            size={16}
          />

          <ThemedText style={styles.upperRowItemText}>Back</ThemedText>
        </Pressable>

        <ThemedText style={styles.upperRowText}>Patient</ThemedText>
      </View>
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
        {/* Patient Header */}
        <View style={styles.header}>
          {patientUrl ? (
            <Image
              source={{ uri: patientUrl }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={styles.avatar}>
              <AvatarFromString input={patientName} size={140} />
            </View>
          )}

          <View style={styles.details}>
            <ThemedText type="title" style={styles.headerText}>
              {patientName}
            </ThemedText>

            <ThemedText type="subtitle" style={styles.headerSubText}>
              {patient.dateOfBirth
                ? getAge(patient.dateOfBirth, ' yrs')
                : 'Unknown Age'}
              {'  •  '}
              {patient.weight ? `${patient.weight} Kg` : 'Unknown Weight'}
              {'  •  '}
              {patient.height ? `${patient.height} cm` : 'Unknown Height'}
            </ThemedText>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabGroup}>
          <View style={styles.tabHeaders} onLayout={handleTabLayout}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleTabPress('detail')}
              style={styles.tab}
              accessibilityRole="tab"
              accessibilityState={{
                selected: currentTab === 'detail',
              }}
            >
              <ThemedText
                style={[
                  styles.tabText,
                  currentTab === 'detail' && styles.tabTextActive,
                ]}
              >
                Patient Details
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleTabPress('report')}
              style={styles.tab}
              accessibilityRole="tab"
              accessibilityState={{
                selected: currentTab === 'report',
              }}
            >
              <ThemedText
                style={[
                  styles.tabText,
                  currentTab === 'report' && styles.tabTextActive,
                ]}
              >
                Reports
              </ThemedText>
            </TouchableOpacity>

            {/* Sliding underline */}
            {tabWidth > 0 && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.tabIndicator,
                  {
                    transform: [
                      {
                        translateX: indicatorTranslateX,
                      },
                    ],
                  },
                ]}
              />
            )}
          </View>

          {/* Sliding tab body */}
          <View style={styles.tabBody}>
            <Animated.View
              style={[
                styles.tabContent,
                {
                  opacity: bodyOpacity,
                  transform: [
                    {
                      translateX: bodyTranslateX,
                    },
                  ],
                },
              ]}
            >
              {currentTab === 'detail' ? (
                <DetailsTab
                  patient={patient}
                  patientId={id}
                  providerId={user?.id ?? ''}
                  token={token ?? ''}
                  theme={appTheme}
                />
              ) : (
                <ReportsTab />
              )}
            </Animated.View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PatientDetails;
