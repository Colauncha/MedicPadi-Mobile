import { AppointmentData, ProfileFields } from '@/services/api';
import { Theme } from '@/theme/types';
import { formatDate, formatTime, truncate } from '@/utils';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import {
  StyleProp,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { ThemedText } from '../themed-text';
import { Button } from '../ui/Button';
import { IconSymbol } from '../ui/icon-symbol';

type AppointmentStatus =
  | 'confirmed'
  | 'pending'
  | 'cancelled'
  | 'canceled'
  | string;

export const getStatusStyle = (theme: Theme, status: AppointmentStatus) => {
  const normalized = status?.toLowerCase();
  switch (normalized) {
    case 'confirmed':
      return {
        backgroundColor: theme.colors.successBg ?? '#E6F7EC',
        color: theme.colors.success ?? '#1E8E3E',
        label: 'Confirmed',
      };
    case 'pending':
      return {
        backgroundColor: theme.colors.warningBg ?? '#FFF3E0',
        color: theme.colors.warning ?? '#E08A00',
        label: 'Pending',
      };
    case 'cancelled':
    case 'canceled':
      return {
        backgroundColor: theme.colors.dangerBg ?? '#FCE8EC',
        color: theme.colors.danger ?? '#D6336C',
        label: 'Canceled',
      };
    default:
      return {
        backgroundColor: theme.colors.mono.light,
        color: theme.colors.mono.darkGray,
        label: status ?? '',
      };
  }
};

export const AppointmentCard = ({
  appointment,
  patient,
  theme,
  showImage,
  showButton,
  buttonText,
  extraStyle,
}: {
  appointment: AppointmentData;
  patient?: ProfileFields;
  theme: Theme;
  showImage?: boolean;
  showButton?: boolean;
  buttonText?: string;
  extraStyle?: StyleProp<ViewStyle>;
}) => {
  const badge = getStatusStyle(theme, appointment.status);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={{
        // flexDirection: 'row',
        ...{ ...extraStyle },
      }}
      onPress={() => router.push(`/appointments/${appointment.id}` as any)}
    >
      {/* Optional Image */}
      <View
        style={
          {
            // position: 'relative',
            // left: 5,
          }
        }
      >
        {showImage && patient?.profilePicture?.url ? (
          <Image
            source={{ uri: patient.profilePicture.url }}
            style={{
              width: 40,
              height: 40,
              borderRadius: theme.radius.full,
              marginRight: theme.spacing.sm,
            }}
            contentFit="cover"
          />
        ) : showImage && !patient?.profilePicture?.url ? (
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: theme.radius.full,
              backgroundColor: theme.colors.mono.light,
              marginRight: theme.spacing.sm,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconSymbol
              name="person.fill"
              size={18}
              color={theme.colors.mono.darkGray}
            />
          </View>
        ) : (
          <></>
        )}
      </View>
      {/* <View
        style={{
          flexDirection: 'column',
        }}
      > */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing.sm,
        }}
      >
        <Text
          style={{
            fontSize: theme.typography.sizes.sm,
            color: theme.colors.text,
          }}
        >
          {formatTime(appointment.appointment_time)}
        </Text>
        <View
          style={{
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: 2,
            borderRadius: theme.radius.full,
            backgroundColor: badge.backgroundColor,
          }}
        >
          <Text
            style={{
              fontSize: theme.typography.sizes.xs,
              color: badge.color,
            }}
          >
            {badge.label}
          </Text>
        </View>
      </View>
      <ThemedText
        style={{
          fontSize: theme.typography.sizes.md,
          color: theme.colors.text,
        }}
        type="defaultSemiBold"
      >
        {truncate(appointment.description ?? '', 30)}
      </ThemedText>
      <Text
        style={{
          fontSize: theme.typography.sizes.sm,
          color: theme.colors.textMuted,
          marginTop: 2,
        }}
      >
        {patient?.firstName ?? 'Unknown patient'}
      </Text>
      {showButton && (
        <View
          style={{
            position: 'absolute',
            bottom: 10,
            right: 15,
          }}
        >
          <Button
            label={buttonText ?? ''}
            onPress={() => {}}
            style={{
              height: 35,
            }}
          />
        </View>
      )}
      {/* </View> */}
    </TouchableOpacity>
  );
};

// ---------- Appointment request row ----------

export const AppointmentRequestRow = ({
  appointment,
  patient,
  theme,
  extraStyle,
  onAccept,
  onDecline,
}: {
  appointment: AppointmentData;
  patient?: ProfileFields;
  theme: Theme;
  extraStyle?: StyleProp<ViewStyle>;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}) => {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: theme.spacing.md,
          // borderBottomWidth: 0.5,
          borderColor: theme.colors.mono.light,
        },
        extraStyle,
      ]}
    >
      {patient?.profilePicture?.url ? (
        <Image
          source={{ uri: patient.profilePicture.url }}
          style={{
            width: 40,
            height: 40,
            borderRadius: theme.radius.full,
            marginRight: theme.spacing.sm,
          }}
          contentFit="cover"
        />
      ) : (
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.mono.light,
            marginRight: theme.spacing.sm,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconSymbol
            name="person.fill"
            size={18}
            color={theme.colors.mono.darkGray}
          />
        </View>
      )}

      <View style={{ flex: 1 }}>
        <ThemedText
          style={{
            fontSize: theme.typography.sizes.md,
            color: theme.colors.text,
          }}
          type="defaultSemiBold"
        >
          {patient?.firstName ?? 'Unknown patient'}
        </ThemedText>
        <Text
          style={{
            fontSize: theme.typography.sizes.sm,
            color: theme.colors.textMuted,
          }}
        >
          {truncate(appointment.description ?? '', 30)}
        </Text>
        <Text
          style={{
            fontSize: theme.typography.sizes.sm,
            color: theme.colors.textMuted,
            marginTop: 2,
          }}
        >
          {formatDate(appointment.appointment_time)},{' '}
          {formatTime(appointment.appointment_time)}
        </Text>
        <TouchableOpacity
          onPress={() => router.push(`/appointments/${appointment.id}` as any)}
        >
          <Text
            style={{
              fontSize: theme.typography.sizes.sm,
              color: theme.colors.purple.extraDeep,
              marginTop: 4,
              textDecorationLine: 'underline',
            }}
          >
            View details
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity
          onPress={() => onAccept(appointment.id)}
          style={{
            width: 28,
            height: 28,
            borderRadius: theme.radius.full,
            borderWidth: 1,
            borderColor: theme.colors.primary.extraDeep,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconSymbol
            name="checkmark"
            size={14}
            color={theme.colors.primary.extraDeep}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onDecline(appointment.id)}
          style={{
            width: 28,
            height: 28,
            borderRadius: theme.radius.full,
            borderWidth: 1,
            borderColor: theme.colors.danger ?? '#D6336C',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconSymbol
            name="xmark"
            size={14}
            color={theme.colors.danger ?? '#D6336C'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};
