import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ZoomSDKProvider,
  useZoom,
  useZoomEvents,
} from '@zoom/meetingsdk-react-native';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import {
  AppointmentData,
  apiGetOneAppointment,
  apiGetZoomSignature,
} from '@/services/api';
import { useTheme } from '@/theme/ThemeProvider';
import { useThemedStyles } from '@/hooks/useThemedStyle';

// The native bridge reports iOS (MobileRTC*) and Android (short/ZOOM_*) names.
const AUTH_SUCCESS_CODES = ['MobileRTCAuthError_Success', 'ZOOM_ERROR_SUCCESS'];
const JOIN_SUCCESS_CODES = [
  'MobileRTCMeetError_Success',
  'MEETING_ERROR_SUCCESS',
];
const CONNECTED_STATES = [
  'MobileRTCMeetingState_InMeeting',
  'InMeeting',
  'MobileRTCMeetingState_WaitingForHost',
  'WaitingForHost',
  'MobileRTCMeetingState_InWaitingRoom',
  'InWaitingRoom',
];
const RECONNECTING_STATES = [
  'MobileRTCMeetingState_Reconnecting',
  'Reconnecting',
];
const FAILED_STATES = ['MobileRTCMeetingState_Failed', 'Failed'];
const ENDED_STATES = [
  'MobileRTCMeetingState_Ended',
  'Ended',
  'MobileRTCMeetingState_Idle',
  'Idle',
];

const MEETING_ERROR_MESSAGES: Record<string, string> = {
  MobileRTCMeetError_PasswordError:
    'The meeting password is incorrect. Please contact support.',
  MobileRTCMeetError_MeetingOver: 'This consultation has already ended.',
  MEETING_ERROR_MEETING_OVER: 'This consultation has already ended.',
  MobileRTCMeetError_MeetingNotStart:
    'Your doctor has not started the consultation yet. Please try again shortly.',
  MobileRTCMeetError_MeetingNotExist: 'This meeting could not be found.',
  MEETING_ERROR_MEETING_NOT_EXIST: 'This meeting could not be found.',
  MEETING_ERROR_INCORRECT_MEETING_NUMBER: 'This meeting could not be found.',
  MobileRTCMeetError_MeetingUserFull: 'This meeting is full.',
  MEETING_ERROR_USER_FULL: 'This meeting is full.',
  MobileRTCMeetError_MeetingLocked: 'This meeting has been locked by the host.',
  MEETING_ERROR_LOCKED: 'This meeting has been locked by the host.',
  MobileRTCMeetError_RemovedByHost: 'You were removed from the meeting.',
  MEETING_ERROR_REMOVED_BY_HOST: 'You were removed from the meeting.',
  MobileRTCMeetError_ConnectionError:
    'Connection problem. Check your internet and try again.',
  MEETING_ERROR_CONNECTION_ERR:
    'Connection problem. Check your internet and try again.',
  MEETING_ERROR_NETWORK_UNAVAILABLE:
    'No internet connection. Check your network and try again.',
  MEETING_ERROR_TIMEOUT: 'The connection timed out. Please try again.',
};
const DEFAULT_JOIN_ERROR = 'Unable to join the meeting. Please try again.';

const meetingErrorMessage = (code?: string) =>
  (code && MEETING_ERROR_MESSAGES[code]) || DEFAULT_JOIN_ERROR;

type Phase =
  | 'authorizing'
  | 'joining'
  | 'inMeeting'
  | 'ended'
  | 'dropped'
  | 'error';

const leaveScreen = (appointmentId?: string) => {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(
    appointmentId ? `/appointments/${appointmentId}` : '/appointments'
  );
};

const ZoomMeetingContent = ({
  appointmentId,
  meetingNumber,
  meetingPassword,
  userName,
  onRefreshAuth,
}: {
  appointmentId: string;
  meetingNumber: string;
  meetingPassword?: string;
  userName: string;
  onRefreshAuth: () => void;
}) => {
  const { joinMeeting, cleanup } = useZoom();
  const { theme: appTheme } = useTheme();
  const styles = useScreenStyles();

  const [phase, setPhaseState] = useState<Phase>('authorizing');
  const [error, setError] = useState<string | null>(null);

  // Refs mirror state so back-to-back native events see the latest values.
  const phaseRef = useRef<Phase>('authorizing');
  const joiningRef = useRef(false);
  const sawReconnectRef = useRef(false);
  const authExpiredRef = useRef(false);

  const setPhase = (next: Phase) => {
    phaseRef.current = next;
    setPhaseState(next);
  };

  const fail = (message: string) => {
    setError(message);
    setPhase('error');
  };

  const join = async () => {
    if (joiningRef.current) return;
    if (authExpiredRef.current) {
      // Joining needs a fresh signature; the parent remounts the SDK.
      onRefreshAuth();
      return;
    }
    joiningRef.current = true;
    sawReconnectRef.current = false;
    setError(null);
    setPhase('joining');
    try {
      const result = await joinMeeting({
        userName,
        meetingNumber,
        password: meetingPassword,
        noInvite: true,
      });
      if (!JOIN_SUCCESS_CODES.includes(result))
        fail(meetingErrorMessage(result));
    } catch {
      fail(DEFAULT_JOIN_ERROR);
    } finally {
      joiningRef.current = false;
    }
  };

  useZoomEvents({
    onAuthReturn: ({ error: authError }) => {
      if (!AUTH_SUCCESS_CODES.includes(authError)) {
        fail('Failed to authorize the meeting session. Please try again.');
        return;
      }
      if (phaseRef.current === 'authorizing') join();
    },
    onMeetingStateChange: ({ state }) => {
      const current = phaseRef.current;
      if (CONNECTED_STATES.includes(state)) {
        sawReconnectRef.current = false;
        if (current === 'joining') setPhase('inMeeting');
        return;
      }
      if (RECONNECTING_STATES.includes(state)) {
        sawReconnectRef.current = true;
        return;
      }
      const failed = FAILED_STATES.includes(state);
      if (!failed && !ENDED_STATES.includes(state)) return;

      if (current === 'inMeeting') {
        // Only local UI changes here: completing the appointment is owned by
        // the doctor/backend, so a dropped call never ends the consultation.
        setPhase(failed || sawReconnectRef.current ? 'dropped' : 'ended');
      } else if (current === 'joining') {
        if (failed) fail(DEFAULT_JOIN_ERROR);
        else if (state !== 'Idle' && state !== 'MobileRTCMeetingState_Idle')
          setPhase('ended');
      }
    },
    onMeetingError: ({ error: meetingError }) => {
      // iOS reports a successful join through this event too.
      if (JOIN_SUCCESS_CODES.includes(meetingError)) return;
      if (phaseRef.current === 'joining' || phaseRef.current === 'error') {
        fail(meetingErrorMessage(meetingError));
      }
    },
    onAuthIdentityExpired: () => {
      authExpiredRef.current = true;
      // Remounting mid-call would tear down the meeting, so only refresh now
      // if the patient isn't in one; otherwise refresh on the next join.
      if (phaseRef.current !== 'inMeeting') onRefreshAuth();
    },
  });

  useEffect(() => () => cleanup(), [cleanup]);

  if (phase === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Couldn&apos;t join</Text>
        <Text style={styles.body}>{error ?? DEFAULT_JOIN_ERROR}</Text>
        <Button
          label="Try again"
          onPress={onRefreshAuth}
          style={styles.action}
        />
        <Button
          label="Back to appointment"
          variant="outline"
          onPress={() => leaveScreen(appointmentId)}
          style={styles.action}
        />
      </View>
    );
  }

  if (phase === 'ended' || phase === 'dropped') {
    const dropped = phase === 'dropped';
    return (
      <View style={styles.center}>
        <Text style={styles.title}>
          {dropped ? 'Connection lost' : 'Call ended'}
        </Text>
        <Text style={styles.body}>
          {dropped
            ? 'Your call was disconnected. You can rejoin while your consultation is still in progress.'
            : 'You have left the call. If your consultation isn’t finished, you can rejoin. Your doctor will close the consultation when it is complete.'}
        </Text>
        <Button label="Rejoin call" onPress={join} style={styles.action} />
        <Button
          label="Back to appointment"
          variant="outline"
          onPress={() => leaveScreen(appointmentId)}
          style={styles.action}
        />
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <ActivityIndicator
        size="large"
        color={appTheme.colors.primary.extraDeep}
      />
      <Text style={styles.body}>
        {phase === 'inMeeting'
          ? 'Your consultation is in progress…'
          : 'Joining your appointment…'}
      </Text>
    </View>
  );
};

export const ZoomMeetingScreen = () => {
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const { token, user, profile } = useAuth();
  const { theme: appTheme } = useTheme();
  const styles = useScreenStyles();

  const [appt, setAppt] = useState<AppointmentData | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [sdkKey, setSdkKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    []
  );

  useEffect(() => {
    if (!token || !appointmentId) return;
    Promise.all([
      apiGetOneAppointment(appointmentId, token),
      apiGetZoomSignature(appointmentId, token),
    ])
      .then(([apptRes, sigRes]) => {
        if (!mountedRef.current) return;
        if (!apptRes.meeting_id) {
          setError('This appointment does not have a meeting yet.');
          return;
        }
        setAppt(apptRes);
        setSignature(sigRes.signature);
      })
      .catch((e) => {
        if (mountedRef.current)
          setError(e?.message ?? 'Failed to prepare the meeting');
      });
  }, [appointmentId, token]);

  // Fetch a new signature and remount the SDK provider (fresh init + auth).
  const refreshAuth = useCallback(() => {
    if (!token || !appointmentId) return;
    setSignature(null);
    apiGetZoomSignature(appointmentId, token)
      .then((res) => {
        if (!mountedRef.current) return;
        setSignature(res.signature);
        setSdkKey((k) => k + 1);
      })
      .catch((e) => {
        if (mountedRef.current)
          setError(e?.message ?? 'Failed to prepare the meeting');
      });
  }, [appointmentId, token]);

  const sdkConfig = useMemo(
    () => ({
      jwtToken: signature ?? '',
      domain: 'zoom.us',
      enableLog: __DEV__,
      logSize: 5,
    }),
    [signature]
  );

  const screenError = appointmentId ? error : 'No appointment was provided.';

  const userName =
    [profile?.profile?.firstName, profile?.profile?.lastName]
      .filter(Boolean)
      .join(' ') ||
    user?.fullName ||
    'Patient';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style={appTheme.mode === 'dark' ? 'light' : 'dark'} />
      {screenError ? (
        <View style={styles.center}>
          <Text style={styles.title}>Couldn&apos;t prepare the meeting</Text>
          <Text style={styles.body}>{screenError}</Text>
          <Button
            label="Back to appointment"
            onPress={() => leaveScreen(appointmentId)}
            style={styles.action}
          />
        </View>
      ) : !signature || !appt?.meeting_id ? (
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={appTheme.colors.primary.extraDeep}
          />
          <Text style={styles.body}>Preparing your appointment…</Text>
        </View>
      ) : (
        <ZoomSDKProvider key={sdkKey} config={sdkConfig}>
          <ZoomMeetingContent
            appointmentId={appt.id}
            meetingNumber={String(appt.meeting_id)}
            meetingPassword={appt.meeting_password || undefined}
            userName={userName}
            onRefreshAuth={refreshAuth}
          />
        </ZoomSDKProvider>
      )}
    </SafeAreaView>
  );
};

const useScreenStyles = () =>
  useThemedStyles((theme) =>
    StyleSheet.create({
      container: { flex: 1, backgroundColor: theme.colors.background },
      center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.base,
        gap: theme.spacing.md,
      },
      title: {
        fontFamily: theme.typography.fonts?.rounded,
        fontSize: theme.typography.sizes.lg,
        fontWeight: 'bold',
        color: theme.colors.textSecondary,
        textAlign: 'center',
      },
      body: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.md,
        color: theme.colors.text,
        textAlign: 'center',
      },
      action: { alignSelf: 'stretch' },
    })
  );

export default ZoomMeetingScreen;
