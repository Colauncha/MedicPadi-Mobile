import { TouchableOpacity, Text, View } from 'react-native';

import ProviderGrid from '@/components/ProviderGrid';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/theme/ThemeProvider';
import { useCart } from '@/context/CartContext';
import { router } from 'expo-router';

export default function PharmacyScreen() {
  const { theme: appTheme } = useTheme();
  const { itemCount } = useCart();

  return (
    <ProviderGrid
      role="pharmacy"
      title="Pharmacies"
      searchPlaceholder="Search pharmacies..."
      fallbackName="Pharmacy"
      fallbackSubtitle="Pharmacy"
      emptyLabel="pharmacies"
      headerRight={
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() =>
            router.push(
              {
                pathname: '/pharmacy/checkout',
              },
              { withAnchor: true }
            )
          }
          style={{
            position: 'relative',
          }}
        >
          <IconSymbol
            name="cart"
            size={24}
            color={appTheme.colors.textSecondary}
          />
          {itemCount > 0 && (
            <View
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                width: appTheme.spacing.base,
                height: appTheme.spacing.base,
                borderRadius: appTheme.radius.full,
                backgroundColor: appTheme.colors.danger,
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'row',
              }}
            >
              <Text
                style={{
                  color: appTheme.colors.mono.light,
                  fontSize: appTheme.typography.sizes.sm,
                }}
              >
                {itemCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      }
    />
  );
}
