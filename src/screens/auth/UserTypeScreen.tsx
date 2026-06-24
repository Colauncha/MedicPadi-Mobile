import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { Button } from '../../components/Button';
import { colors, typography, spacing, radius } from '../../theme';
import PatientIcon from '../../../assets/svg/patient_usertype.svg';
import DoctorIcon from '../../../assets/svg/doctor_usertype.svg';
import PharmacyIcon from '../../../assets/svg/pharmacy_usertype.svg';
import LabIcon from '../../../assets/svg/laboratory_usertype.svg';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'UserType'>;
};

type UserType = 'patient' | 'consultant' | 'pharmacy' | 'laboratory';

const options: { type: UserType; Icon: React.FC<{ width?: number; height?: number }>; title: string; description: string }[] = [
  {
    type: 'patient',
    Icon: PatientIcon,
    title: 'Patient',
    description: 'Book appointments, view test results, and manage your health',
  },
  {
    type: 'consultant',
    Icon: DoctorIcon,
    title: 'Doctor',
    description: 'Manage patients, appointments, and consultations',
  },
  {
    type: 'pharmacy',
    Icon: PharmacyIcon,
    title: 'Pharmacy',
    description: 'Manage prescriptions, drug inventory, and patient records',
  },
  {
    type: 'laboratory',
    Icon: LabIcon,
    title: 'Laboratory',
    description: 'Manage test results, appointments, and consultations',
  },
];

export const UserTypeScreen: React.FC<Props> = ({ navigation }) => {
  const [selected, setSelected] = useState<UserType | null>(null);

  const handleContinue = () => {
    if (!selected) return;
    navigation.navigate('SignUp', { userType: selected });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>User Type</Text>
          <Text style={styles.subtitle}>Select user type that you want</Text>
        </View>

        <View style={styles.options}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.type}
              style={[styles.option, selected === opt.type && styles.optionSelected]}
              onPress={() => setSelected(opt.type)}
              activeOpacity={0.85}
            >
              <opt.Icon width={48} height={48} />
              <Text style={[styles.optionTitle, selected === opt.type && styles.optionTitleSelected]}>
                {opt.title}
              </Text>
              <Text style={styles.optionDesc}>{opt.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          label="Continue"
          onPress={handleContinue}
          disabled={!selected}
          style={styles.btn}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.purple[200],
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.base,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 360,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.xl,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: '#454545',
  },
  options: {
    gap: spacing.base,
    marginBottom: spacing.xl,
  },
  option: {
    padding: spacing.base,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  optionSelected: {
    borderColor: colors.primary[950],
    backgroundColor: colors.primary[50],
  },
  optionTitle: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.base,
    color: colors.text.dark,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  optionTitleSelected: {
    color: colors.primary[950],
  },
  optionDesc: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.light,
    textAlign: 'center',
  },
  btn: {
    width: '100%',
  },
});
