import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../components/Header';
import { colors, typography, spacing, radius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import {
  EHRRecord,
  apiGetEHRRecords,
  apiGetTestRequisitions,
} from '../../services/api';

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

export const MedicalHistoryScreen: React.FC = () => {
  const { token } = useAuth();
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
        setTestReqs(Array.isArray(testRes.value.data) ? testRes.value.data : []);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Medical History" />
      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.primary[950]} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
        >
          {/* Consultation History */}
          <Text style={styles.sectionTitle}>Consultation History</Text>
          {records.length === 0 ? (
            <Text style={styles.emptyText}>No consultation records found</Text>
          ) : (
            records.map((record) => (
              <View key={record.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.docAvatar} />
                  <View style={styles.docInfo}>
                    <Text style={styles.docName}>{doctorName(record)}</Text>
                    <Text style={styles.docSpecialty}>{doctorSpecialty(record)}</Text>
                    <Text style={styles.docDate}>{formatDate(record.createdAt)}</Text>
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
              <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Lab Test Requests</Text>
              {testReqs.map((item: any) => {
                const status: string = item.status ?? 'pending';
                const isNormal = status === 'completed' || status === 'accepted';
                return (
                  <View key={item.id} style={styles.labCard}>
                    <View>
                      <Text style={styles.labTest}>
                        {item.items?.map((i: any) => i.test?.name ?? i.name).join(', ') ?? 'Lab test'}
                      </Text>
                      <Text style={styles.labDate}>{formatDate(item.createdAt)}</Text>
                    </View>
                    <View style={[styles.labStatus, isNormal ? styles.statusNormal : styles.statusWarning]}>
                      <Text style={[styles.labStatusText, isNormal ? styles.statusNormalText : styles.statusWarningText]}>
                        {status}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.base, paddingBottom: 40 },
  sectionTitle: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.base,
    color: colors.text.dark,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.md,
    color: colors.text.light,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  docAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.text.dark,
  },
  docInfo: { flex: 1 },
  docName: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.md,
    color: colors.text.dark,
  },
  docSpecialty: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.light,
  },
  docDate: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
  },
  divider: { height: 1, backgroundColor: colors.border, marginBottom: spacing.md },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  label: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.md,
    color: colors.text.light,
    flex: 1,
  },
  value: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.md,
    color: colors.text.dark,
    flex: 2,
    textAlign: 'right',
  },
  labCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.sm,
  },
  labTest: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.md,
    color: colors.text.dark,
    marginBottom: 2,
  },
  labDate: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.light,
  },
  labStatus: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  statusNormal: { backgroundColor: colors.primary[50] },
  statusWarning: { backgroundColor: '#fff3e0' },
  labStatusText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
  },
  statusNormalText: { color: colors.green[700] },
  statusWarningText: { color: colors.warning },
});
