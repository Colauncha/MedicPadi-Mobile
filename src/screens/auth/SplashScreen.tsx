import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { colors, typography } from '../../theme';

const ONBOARDING_KEY = 'mp_onboarding_done';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Splash'>;
};

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const opacity = new Animated.Value(0);
  const scale = new Animated.Value(0.5);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 1500, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(async () => {
      const seen = await SecureStore.getItemAsync(ONBOARDING_KEY).catch(() => null);
      navigation.replace(seen ? 'Login' : 'Onboarding');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={[colors.primary[300], colors.white, colors.primary[300]]}
      locations={[0, 0.5, 1]}
      style={styles.container}
    >
      <Animated.View style={[styles.logoWrapper, { opacity, transform: [{ scale }] }]}>
        <View style={styles.logoCircle}>
          <Image style={styles.logoSize} source={require('../../../assets/Medicpadi_logo.png')} />
        </View>
        <Text style={styles.tagline}>Your Health, Anytime, Anywhere</Text>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    alignItems: 'center',
  },
  logoCircle: {
  //   width: 150,
  //   height: 150,
  //   borderRadius: 100,
  //   // backgroundColor: colors.primary[50],
  //   // opacity: 0.5,
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   marginBottom: 20,
  //   shadowColor: colors.primary[300],
  //   shadowOpacity: 0.3,
  //   shadowRadius: 100,
  //   // elevation: 8,
  },
  logoSize: {
    width: 240,
    height: 240,
  },
  appName: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.xl,
    color: colors.primary[950],
    marginBottom: 8,
  },
  tagline: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.base,
    fontWeight: 700,
    color: colors.text.dark,
  },
});
