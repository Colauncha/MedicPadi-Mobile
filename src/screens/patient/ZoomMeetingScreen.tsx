import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/core';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ZoomSDKProvider,
  useZoom,
  addZoomEventListener,
} from '@zoom/meetingsdk-react-native';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { apiGetZoomSignature } from '../../services/api';
import { PatientStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<PatientStackParamList>;
type Route = RouteProp<PatientStackParamList, 'ZoomMeeting'>;

const MEETING_ENDED_STATES = ['MobileRTCMeetingState_Ended', 'Ended'];
const AUTH_SUCCESS_CODES = ['MobileRTCAuthError_Success', 'ZOOM_ERROR_SUCCESS'];
const JOIN_SUCCESS_CODES = [
  'MobileRTCMeetError_Success',
  'MEETING_ERROR_SUCCESS',
];

const ZoomMeetingContent = ({
  meetingNumber,
  meetingPassword,
  userName,
}: {
  meetingNumber: string;
  meetingPassword?: string;
  userName: string;
}) => {
  const navigation = useNavigation<Nav>();
  const zoom = useZoom();
  const [error, setError] = useState<string | null>(null);
  const hasJoinedRef = useRef(false);

  useEffect(() => {
    const authSub = addZoomEventListener(
      'onAuthReturn',
      async ({ error: authError }) => {
        if (!AUTH_SUCCESS_CODES.includes(authError)) {
          setError(
            'Failed to authorize the meeting session. Please try again.'
          );
          return;
        }
        if (hasJoinedRef.current) return;
        hasJoinedRef.current = true;
        try {
          const result = await zoom.joinMeeting({
            userName,
            meetingNumber,
            password: meetingPassword,
          });
          if (!JOIN_SUCCESS_CODES.includes(result)) {
            setError('Unable to join the meeting. Please try again.');
          }
        } catch {
          setError('Unable to join the meeting. Please try again.');
        }
      }
    );

    const stateSub = addZoomEventListener(
      'onMeetingStateChange',
      ({ state }) => {
        if (MEETING_ENDED_STATES.includes(state)) {
          navigation.goBack();
        }
      }
    );

    const errorSub = addZoomEventListener(
      'onMeetingError',
      ({ error: meetingError }) => {
        setError(`Meeting error: ${meetingError}`);
      }
    );

    return () => {
      authSub.remove();
      stateSub.remove();
      errorSub.remove();
      zoom.cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Button label="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary[950]} />
      <Text style={styles.loadingText}>Joining your appointment…</Text>
    </View>
  );
};

export const ZoomMeetingScreen = () => {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { token, user, profile } = useAuth();
  const {
    appointmentId,
    meetingNumber,
    meetingPassword,
    joinLink,
    meetingLink,
  } = route.params;

  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    apiGetZoomSignature(appointmentId, token)
      .then((res) => setSignature(res.signature))
      .catch((e) => setError(e.message ?? 'Failed to prepare the meeting'));
  }, [appointmentId, token]);

  const userName =
    [profile?.profile?.firstName, profile?.profile?.lastName]
      .filter(Boolean)
      .join(' ') ||
    user?.fullName ||
    'Patient';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />
      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Button label="Go Back" onPress={() => navigation.goBack()} />
        </View>
      ) : !signature ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary[950]} />
        </View>
      ) : (
        <ZoomSDKProvider
          config={{
            jwtToken: signature,
            domain: 'zoom.us',
            enableLog: true,
            logSize: 5,
          }}
        >
          <ZoomMeetingContent
            meetingNumber={meetingNumber}
            meetingPassword={meetingPassword}
            userName={userName}
          />
        </ZoomSDKProvider>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.base,
    gap: spacing.md,
  },
  loadingText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.light,
  },
  errorText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.base,
    color: colors.text.dark,
    textAlign: 'center',
  },
});
