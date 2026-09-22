import { useThemedStyles } from '@/hooks/useThemedStyle';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';

type ToggleButtonProps = {
  currentState: boolean;
  bgStyle?: StyleProp<ViewStyle>;
  switchStyle?: StyleProp<ViewStyle>;
  activeBg?: StyleProp<ViewStyle>;
  setFunc: (state: boolean) => void;
};

const ToggleButton = ({
  currentState,
  bgStyle,
  switchStyle,
  activeBg,
  setFunc,
}: ToggleButtonProps) => {
  const [isActive, setIsActive] = useState(currentState);

  const translateX = useRef(new Animated.Value(currentState ? 1 : 0)).current;

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: {
        width: 52,
        height: 30,
        padding: theme.spacing.xs,
        position: 'relative',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.surface,
      },

      switch: {
        position: 'absolute',
        left: theme.spacing.xs,
        width: 22,
        height: 22,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.primary.base,
      },

      active: {
        backgroundColor: theme.colors.primary.deep,
      },
    })
  );

  const TRACK_WIDTH = 52;
  const SWITCH_WIDTH = 22;
  const PADDING = 4;

  const maxTranslate = TRACK_WIDTH - SWITCH_WIDTH - PADDING * 2;

  useEffect(() => {
    setIsActive(currentState);

    Animated.timing(translateX, {
      toValue: currentState ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [currentState, translateX]);

  const handlePress = () => {
    const next = !isActive;

    setIsActive(next);
    setFunc(next);

    Animated.timing(translateX, {
      toValue: next ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        bgStyle,
        isActive && (activeBg || styles.active),
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.switch,
          switchStyle,
          {
            transform: [
              {
                translateX: translateX.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, maxTranslate],
                }),
              },
            ],
          },
        ]}
      />
    </TouchableOpacity>
  );
};

export default ToggleButton;
