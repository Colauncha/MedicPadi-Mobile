import { StyleSheet, View } from 'react-native';

import SpecialityGrid from '@/components/SpecialityGrid';
import { useThemedStyles } from '@/hooks/useThemedStyle';

export default function SpecialityScreen() {
  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: { flex: 1, backgroundColor: theme.colors.background },
    })
  );

  return (
    <View style={styles.container}>
      <SpecialityGrid />
    </View>
  );
}
