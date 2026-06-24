import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { Button } from '../../components/Button';
import { colors, typography, spacing } from '../../theme';

const { width } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;
};

const images = {
  splash1: require('../../../assets/images/1st_splash.png'),
  splash2: require('../../../assets/images/2nd_splash.png'),
  splash3: require('../../../assets/images/3rd_splash.png'),
}

const slides = [
  {
    title: 'Your Health, Anytime, Anywhere',
    subtitle: 'Connect instantly with certified doctors from the comfort of your home.',
  },
  {
    title: 'Talk to Medical Professionals',
    subtitle: 'Book physical, or chat consultations with licensed doctors across multiple specialties.',
  },
  {
    title: 'Care That Never Sleeps',
    subtitle: 'Our doctors are available around the clock to provide guidance whenever you need it.',
  },
];

export const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const next = currentIndex + 1;
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      setCurrentIndex(next);
    } else {
      navigation.replace('UserType');
    }
  };

  const handleScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  }

  const handleSkip = () => navigation.replace('UserType');

  const isLast = currentIndex === slides.length - 1;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
        <Ionicons name="arrow-forward" size={14} color={colors.primary[950]} />
      </TouchableOpacity>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={true}
        onScroll={handleScroll}
        style={styles.slider}
      >
        {slides.map((slide, idx) => (
          <View key={idx} style={styles.slide}>
            <View style={styles.imagePlaceholder}>
              <Image source={images[`splash${idx + 1}` as keyof typeof images]} style={styles.image} />
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottom}>
        <View style={styles.content}>
          <Text style={styles.title}>{slides[currentIndex].title}</Text>
          <Text style={styles.subtitle}>{slides[currentIndex].subtitle}</Text>
        </View>

        <View style={styles.dotsRow}>
          {slides.map((_, idx) => (
            <View key={idx} style={[styles.dot, idx === currentIndex && styles.dotActive]} />
          ))}
        </View>

        <Button
          label={isLast ? 'Get Started' : 'Next'}
          onPress={handleNext}
          style={styles.btn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  skipBtn: {
    position: 'absolute',
    top: 56,
    right: spacing.base,
    zIndex: 10,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  skipText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.base,
    color: colors.primary[950],
  },
  slider: {
    flex: 1,
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholder: {
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  imagePlaceholderText: {
    fontSize: 100,
  },
  image: { 
    width: 360, 
    height: 360, 
    borderRadius: 180 
  },
  bottom: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.base,
    paddingBottom: 48,
    paddingTop: spacing.xl,
  },
  content: {
    marginBottom: spacing.xl,
  },
  title: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.xl,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    justifyContent: 'center',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.base,
    color: '#454545',
    lineHeight: 24,
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  dot: {
    width: 4,
    height: 10,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.text.muted,
  },
  dotActive: {
    width: 4,
    height: 20,
    backgroundColor: colors.text.dark,
    borderRadius: 5,
  },
  btn: {
    width: '100%',
  },
});
