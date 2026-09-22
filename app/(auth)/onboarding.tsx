import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemedStyles } from '@/hooks/useThemedStyle';
import { storage } from '@/utils/storage';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
// import Link
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

const { width } = Dimensions.get('window');

// Image circle scales with screen width instead of a fixed 360px,
// so it fits smaller devices and stays proportionate on larger ones.
const IMAGE_SIZE = Math.min(width * 0.85, 340);

const images = {
  splash1: require('../../assets/images/1st_splash.png'),
  splash2: require('../../assets/images/2nd_splash.png'),
  splash3: require('../../assets/images/3rd_splash.png'),
};

const slides = [
  {
    title: 'Your Health, Anytime, Anywhere',
    subtitle:
      'Connect instantly with certified doctors from the comfort of your home.',
  },
  {
    title: 'Talk to Medical Professionals',
    subtitle:
      'Book physical, or chat consultations with licensed doctors across multiple specialties.',
  },
  {
    title: 'Care That Never Sleeps',
    subtitle:
      'Our doctors are available around the clock to provide guidance whenever you need it.',
  },
];
const ONBOARDING_KEY = 'mp_onboarding_done';

const Onboarding = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const markSeenAndGo = () => {
    storage.setItem(ONBOARDING_KEY, '1').catch(() => {});
    router.replace('/register');
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const next = currentIndex + 1;
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      setCurrentIndex(next);
    } else {
      markSeenAndGo();
    }
  };

  // Switched from onScroll to onMomentumScrollEnd. onScroll fires continuously
  // during the drag/animation, which was fighting with the manual setCurrentIndex
  // in handleNext (both updating state mid-animation, hence the dot glitch).
  // onMomentumScrollEnd only fires once the scroll settles.
  const handleMomentumScrollEnd = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const handleSkip = () => markSeenAndGo();

  const isLast = currentIndex === slides.length - 1;

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: {
        flex: 1,
      },
      iconColor: {
        color: theme.colors.primary.extraDeep,
      },
      skipBtn: {
        position: 'absolute',
        top: 56,
        right: theme.spacing.base,
        zIndex: 10,
        padding: theme.spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
      },
      skipText: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.base,
        color: theme.colors.primary.extraDeep,
      },
      slider: {
        flex: 1,
      },
      slide: {
        // THE FIX: each slide must be exactly `width` wide for paging math
        // (scrollTo(next * width) and contentOffset / width) to line up.
        // Without this, slides shrink to fit their content and paging drifts.
        width,
        alignItems: 'center',
        justifyContent: 'center',
      },
      imagePlaceholder: {
        width: IMAGE_SIZE,
        height: IMAGE_SIZE,
        borderRadius: IMAGE_SIZE / 2,
        backgroundColor: theme.colors.primary.shallow,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 80,
        overflow: 'hidden', // ensures the image respects the circular clip
      },
      image: {
        width: IMAGE_SIZE,
        height: IMAGE_SIZE,
        borderRadius: IMAGE_SIZE / 2,
      },
      bottom: {
        paddingHorizontal: theme.spacing.base,
        paddingBottom: 48,
        paddingTop: theme.spacing.xl,
      },
      content: {
        marginBottom: theme.spacing.xl,
      },
      title: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.xl,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
        justifyContent: 'center',
        textAlign: 'center',
      },
      subtitle: {
        fontFamily: theme.typography.fonts?.sans,
        fontSize: theme.typography.sizes.base,
        color: theme.colors.text,
        lineHeight: 24,
        textAlign: 'center',
      },
      dotsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
        gap: theme.spacing.sm,
      },
      dot: {
        width: 4,
        height: 10,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.text,
      },
      dotActive: {
        width: 4,
        height: 20,
        backgroundColor: theme.colors.text,
        borderRadius: 5,
      },
      btn: {
        width: '100%',
      },
      btnText: {
        color: theme.colors.text,
      },
    })
  );

  return (
    <ThemedView style={styles.container}>
      <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
        <ThemedText style={styles.skipText}>Skip</ThemedText>
        <IconSymbol name="chevron.right" size={14} style={styles.iconColor} />
      </TouchableOpacity>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        style={styles.slider}
      >
        {slides.map((slide, idx) => (
          <ThemedView key={idx} style={styles.slide}>
            <ThemedView style={styles.imagePlaceholder}>
              <Image
                source={images[`splash${idx + 1}` as keyof typeof images]}
                fadeDuration={0}
                style={styles.image}
                resizeMode="cover"
              />
            </ThemedView>
          </ThemedView>
        ))}
      </ScrollView>

      <ThemedView style={styles.bottom}>
        <ThemedView style={styles.content}>
          <ThemedText style={styles.title}>
            {slides[currentIndex].title}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {slides[currentIndex].subtitle}
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.dotsRow}>
          {slides.map((_, idx) => (
            <ThemedView
              key={idx}
              style={[styles.dot, idx === currentIndex && styles.dotActive]}
            />
          ))}
        </ThemedView>

        <Button
          label={isLast ? 'Get Started' : 'Next'}
          onPress={handleNext}
          style={styles.btn}
          variant="primary"
        />
      </ThemedView>
    </ThemedView>
  );
};

export default Onboarding;
