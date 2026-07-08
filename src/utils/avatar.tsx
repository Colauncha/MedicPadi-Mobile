import { Text, View, StyleSheet, TouchableOpacity, GestureResponderEvent } from "react-native";
import { colors } from "../theme";

// Define the interface for the component props
interface AvatarProps {
  input: string;
  onPress?: (event: GestureResponderEvent) => void;
  size?: number; // Optional prop to easily scale the avatar
}

const AvatarFromString: React.FC<AvatarProps> = ({ input, onPress, size = 50 }) => {
  // Fallback to a question mark if the string is empty
  const char = input && input.length > 0 ? input.slice(0, 1).toUpperCase() : "?";

  // Dynamic styles for sizing the circle and text scaling
  const dynamicContainer = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const dynamicText = {
    fontSize: size * 0.4,
  };

  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <View style={[styles.container, dynamicContainer]}>
        <Text style={[styles.character, dynamicText]}>
          {char}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.text.dark,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2, // Shadow for Android
  },
  character: {
    color: colors.text.white,
    fontWeight: "bold",
  }
});

export default AvatarFromString;