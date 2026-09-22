import { useThemedStyles } from '@/hooks/useThemedStyle';
import {
  GestureResponderEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Define the interface for the component props
interface AvatarProps {
  input: string;
  onPress?: (event: GestureResponderEvent) => void;
  size?: number; // Optional prop to easily scale the avatar
}

const AvatarFromString: React.FC<AvatarProps> = ({
  input,
  onPress,
  size = 50,
}) => {
  // Fallback to a question mark if the string is empty
  const char =
    input && input.length > 0 ? input.slice(0, 1).toUpperCase() : '?';

  // Dynamic styles for sizing the circle and text scaling
  const dynamicContainer = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const dynamicText = {
    fontSize: size * 0.4,
  };

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: {
        backgroundColor: theme.colors.textSecondary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: theme.colors.textMuted,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2, // Shadow for Android
      },
      character: {
        color: theme.colors.mono.light,
        fontWeight: 'bold',
      },
    })
  );

  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <View style={[styles.container, dynamicContainer]}>
        <Text style={[styles.character, dynamicText]}>{char}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default AvatarFromString;
