import { TouchableOpacity } from 'react-native';

import ProviderGrid from '@/components/ProviderGrid';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/theme/ThemeProvider';

export default function PharmacyScreen() {
  const { theme: appTheme } = useTheme();

  return (
    <ProviderGrid
      role="pharmacy"
      title="Pharmacies"
      searchPlaceholder="Search pharmacies..."
      fallbackName="Pharmacy"
      fallbackSubtitle="Pharmacy"
      emptyLabel="pharmacies"
      headerRight={
        <TouchableOpacity>
          <IconSymbol
            name="cart"
            size={24}
            color={appTheme.colors.textSecondary}
          />
        </TouchableOpacity>
      }
    />
  );
}
