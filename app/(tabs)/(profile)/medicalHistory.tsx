import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import AvatarFromString from '@/components/avatar';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyle';
import {
  apiGetEHRRecords,
  apiGetTestRequisitions,
  EHRRecord,
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

const doctorName = (record: EHRRecord): string => {
  if (record.provider?.firstName)
    return `Dr. ${record.provider.firstName} ${record.provider.lastName ?? ''}`.trim();
  return 'Doctor';
};

const doctorSpecialty = (record: EHRRecord): string =>
  record.provider?.speciality ?? 'General Practitioner';

export default function MedicalHistoryScreen() {
  const { token } = useAuth();
  const { theme: appTheme } = useTheme();
  const [records, setRecords] = useState<EHRRecord[]>([]);
  const [testReqs, setTestReqs] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const [ehrRes, testRes] = await Promise.allSettled([
        apiGetEHRRecords({ limit: 20 }, token),
        apiGetTestRequisitions({ limit: 20 }, token),
      ]);
      if (ehrRes.status === 'fulfilled') {
        setRecords(Array.isArray(ehrRes.value.data) ? ehrRes.value.data : []);
      }
      if (testRes.status === 'fulfilled') {
        setTestReqs(
          Array.isArray(testRes.value.data) ? testRes.value.data : []
        );
      }
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
      labCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.surfaceCard,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.base,
        marginBottom: theme.spacing.sm,
      },
      labInfo: { flex: 1, marginRight: theme.spacing.sm },
      labTest: {
        fontSize: theme.typography.sizes.md,
        fontWeight: '500',
        color: theme.colors.text,
        marginBottom: 2,
      },
      labDate: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textSecondary,
      },
      labStatus: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.radius.full,
      },
      statusNormal: { backgroundColor: theme.colors.successBg },
      statusWarning: { backgroundColor: theme.colors.warningBg },
      labStatusText: {
        fontSize: theme.typography.sizes.sm,
        textTransform: 'capitalize',
      },
      statusNormalText: { color: theme.colors.success },
      statusWarningText: { color: theme.colors.warning },
    })
  );

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

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.sectionTitle}>Consultation History</Text>
        {records.length === 0 ? (
          <Text style={styles.emptyText}>No consultation records found</Text>
        ) : (
          records.map((record) => (
            <View key={record.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <AvatarFromString
                  input={record.provider?.firstName || 'Doctor'}
                  size={48}
                />
                <View style={styles.docInfo}>
                  <Text style={styles.docName}>{doctorName(record)}</Text>
                  <Text style={styles.docSpecialty}>
                    {doctorSpecialty(record)}
                  </Text>
                  <Text style={styles.docDate}>
                    {formatDate(record.createdAt)}
                  </Text>
                </View>
              </View>
              <View style={styles.divider} />
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
            </View>
          ))
        )}

        {testReqs.length > 0 && (
          <>
            <Text
              style={[
                styles.sectionTitle,
                { marginTop: appTheme.spacing.xl },
              ]}
            >
              Lab Test Requests
            </Text>
            {testReqs.map((item: any) => {
              const status: string = item.status ?? 'pending';
              const isNormal = status === 'completed' || status === 'accepted';
              return (
                <View key={item.id} style={styles.labCard}>
                  <View style={styles.labInfo}>
                    <Text style={styles.labTest}>
                      {item.items
                        ?.map((i: any) => i.test?.name ?? i.name)
                        .join(', ') ?? 'Lab test'}
                    </Text>
                    <Text style={styles.labDate}>
                      {formatDate(item.createdAt)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.labStatus,
                      isNormal ? styles.statusNormal : styles.statusWarning,
                    ]}
                  >
                    <Text
                      style={[
                        styles.labStatusText,
                        isNormal
                          ? styles.statusNormalText
                          : styles.statusWarningText,
                      ]}
                    >
                      {status}
                    </Text>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}
