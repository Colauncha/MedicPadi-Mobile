// import DoctorIcon from '@/assets/svg/doctor_usertype.svg';
// import LabIcon from '@/assets/svg/laboratory_usertype.svg';
// import PharmacyIcon from '@/assets/svg/pharmacy_usertype.svg';
// import {DoctorIcon} from '../../assets/svg/doctor_usertype.svg';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { IconSymbol, IconSymbolName } from '@/components/ui/icon-symbol';
import { useThemedStyles } from '@/hooks/useThemedStyle';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type UserTypes = 'consultant' | 'pharmacy' | 'laboratory';

const options: { type: UserTypes; Icon: IconSymbolName; title: string; description: string }[] = [
  {
    type: 'consultant',
    Icon: 'stethoscope',
    title: 'Doctor',
    description: 'Manage patients, appointments, and consultations',
  },
  {
    type: 'pharmacy',
    Icon: 'pill.fill',
    title: 'Pharmacy',
    description: 'Manage prescriptions, drug inventory, and patient records',
  },
  {
    type: 'laboratory',
    Icon: 'flask.fill',
    title: 'Laboratory',
    description: 'Manage test results, appointments, and consultations',
  },
];

export const UserType = () => {
  const [selected, setSelected] = useState<UserTypes | null>(null);

  const handleContinue = () => {
    if (!selected) return;
    router.push(`/register?usertype=${selected}`);
  };

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.base,
      },
      scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center',},
      card: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        borderColor: theme.colors.surfaceCard,
        borderWidth: 1,
        padding: theme.spacing.xl,
        width: '100%',
        maxWidth: 360,
      },
      header: {
        marginBottom: theme.spacing.xl,
      },
      title: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.xl,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
      },
      subtitle: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.sm,
        color: '#454545',
      },
      options: {
        gap: theme.spacing.base,
        marginBottom: theme.spacing.xl,
      },
      option: {
        padding: theme.spacing.base,
        borderRadius: theme.radius.lg,
        borderWidth: 2,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceCard,
        alignItems: 'center',
      },
      optionSelected: {
        borderColor: theme.colors.primary.extraDeep,
        backgroundColor: theme.colors.primary.shallow,
      },
      optionTitle: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.base,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
        marginTop: theme.spacing.sm,
      },
      optionTitleSelected: {
        color: theme.colors.primary.extraDeep,
      },
      optionDesc: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textSecondary,
        textAlign: 'center',
      },
      btn: {
        width: '100%',
      },
      iconStyle: {
        color: theme.colors.textSecondary
      }
    })
  )

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <ThemedView style={styles.card}>
        <View style={styles.header}>
          <ThemedText style={styles.title} type='title'>User Type</ThemedText>
          <ThemedText style={styles.subtitle} type='subtitle'>Select user type that you want</ThemedText>
        </View>

        <View style={styles.options}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.type}
              style={[styles.option, selected === opt.type && styles.optionSelected]}
              onPress={() => setSelected(opt.type)}
              activeOpacity={0.85}
            >
              <IconSymbol name={opt.Icon} size={48} style={styles.iconStyle} />
              <ThemedText style={[styles.optionTitle, selected === opt.type && styles.optionTitleSelected]}>
                {opt.title}
              </ThemedText>
              <ThemedText style={styles.optionDesc}>{opt.description}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          label="Continue"
          onPress={handleContinue}
          disabled={!selected}
          style={styles.btn}
        />
      </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UserType;