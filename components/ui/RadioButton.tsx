// import { useThemedStyles } from '@/hooks/useThemedStyle';
// import React, { useState } from 'react';
// import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
// import { IconSymbol, IconSymbolName } from './icon-symbol';

// function RadioButton({
//   id,
//   text,
//   outerSize = 24,
//   innerSize = 12,
//   disable,
//   setFunc,
// }: {
//   id: string;
//   disable?: boolean;
//   text?: string;
//   outerSize?: number;
//   innerSize?: number;
//   setFunc: (id: string) => void;
// }) {
//   const [isSelected, setIsSelected] = useState(false);

//   const styles = useThemedStyles((theme) =>
//     StyleSheet.create({
//       container: { flex: 1, padding: 24, justifyContent: 'center' },
//       radioContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'center',
//       },
//       outerCircle: {
//         height: outerSize,
//         width: outerSize,
//         borderRadius: outerSize / 4,
//         borderWidth: 2,
//         borderColor: theme.colors.textMuted,
//         alignItems: 'center',
//         justifyContent: 'center',
//         // marginRight: 12,
//       },
//       outerCircleSelected: {
//         borderColor: theme.colors.primary.deep, // Active accent color
//       },
//       innerCircle: {
//         height: innerSize,
//         width: innerSize,
//         borderRadius: innerSize / 4,
//         backgroundColor: theme.colors.primary.deep,
//       },
//       radioText: { fontSize: 16 },
//     })
//   );

//   return (
//     <View style={styles.container}>
//       <Pressable
//         style={styles.radioContainer}
//         disabled={disable}
//         onPress={() => {
//           setIsSelected(!isSelected);
//         }}
//       >
//         {/* Outer Circle */}
//         <View
//           style={[styles.outerCircle, isSelected && styles.outerCircleSelected]}
//         >
//           {/* Inner Circle (Only renders if active) */}
//           {isSelected && <View style={styles.innerCircle} />}
//         </View>

//         {text && <Text style={styles.radioText}>{text}</Text>}
//       </Pressable>
//     </View>
//   );
// }

// type ChoiceData = {
//   id: string;
//   icon?: IconSymbolName;
//   PrimaryLabel?: string;
//   SecondaryLabel?: string;
//   RowStyle?: any;
//   PrimaryLabelStyle?: any;
//   SecondaryLabelStyle?: any;
//   IconStyle?: any;
//   IconSize?: number;
// };

// function RadioButtons({
//   data,
//   setFunc,
// }: {
//   data: ChoiceData[];
//   setFunc: (id: ChoiceData['id']) => void;
// }) {
//   return (
//     <View>
//       <FlatList
//         data={data}
//         renderItem={(data) => (
//           <View style={data.item.RowStyle}>
//             {data.item.icon && (
//               <IconSymbol
//                 name={data.item.icon}
//                 size={data.item.IconSize}
//                 style={data.item.IconStyle}
//               />
//             )}
//             {data.item.PrimaryLabel && (
//               <View>
//                 <Text style={data.item.PrimaryLabelStyle}>
//                   {data.item.PrimaryLabel}
//                 </Text>
//                 {data.item.SecondaryLabel && (
//                   <Text style={data.item.SecondaryLabelStyle}>
//                     {data.item.SecondaryLabel}
//                   </Text>
//                 )}
//               </View>
//             )}
//             <RadioButton setFunc={} id={data.item.id} />
//           </View>
//         )}
//       />
//     </View>
//   );
// }

// export default RadioButtons;

import { useThemedStyles } from '@/hooks/useThemedStyle';
import React, { Fragment, useState } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { IconSymbol, IconSymbolName } from './icon-symbol';

// ---------- RadioButton (controlled) ----------

function RadioButton({
  id,
  text,
  outerSize = 24,
  innerSize = 12,
  disabled,
  isSelected,
  onSelect,
}: {
  id: string;
  disabled?: boolean;
  text?: string;
  outerSize?: number;
  innerSize?: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      radioContainer: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      outerCircle: {
        height: outerSize,
        width: outerSize,
        borderRadius: outerSize / 4,
        borderWidth: 2,
        borderColor: theme.colors.textMuted,
        alignItems: 'center',
        justifyContent: 'center',
      },
      outerCircleSelected: {
        borderColor: theme.colors.primary.deep,
      },
      outerCircleDisabled: {
        opacity: 0.4,
      },
      innerCircle: {
        height: innerSize,
        width: innerSize,
        borderRadius: innerSize / 4,
        backgroundColor: theme.colors.primary.deep,
      },
      radioText: { fontSize: 16, marginLeft: 12 },
    })
  );

  return (
    <Pressable
      style={styles.radioContainer}
      disabled={disabled}
      onPress={() => onSelect(id)}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected, disabled: !!disabled }}
      hitSlop={8}
    >
      <View
        style={[
          styles.outerCircle,
          isSelected && styles.outerCircleSelected,
          disabled && styles.outerCircleDisabled,
        ]}
      >
        {isSelected && <View style={styles.innerCircle} />}
      </View>

      {text && <Text style={styles.radioText}>{text}</Text>}
    </Pressable>
  );
}

// ---------- RadioButtons (group) ----------

type ChoiceData = {
  id: string;
  icon?: IconSymbolName;
  primaryLabel?: string;
  secondaryLabel?: string;
  disabled?: boolean;
  rowStyle?: StyleProp<ViewStyle>;
  primaryLabelStyle?: StyleProp<TextStyle>;
  secondaryLabelStyle?: StyleProp<TextStyle>;
  iconStyle?: StyleProp<TextStyle>;
  iconSize?: number;
};

function RadioButtons({
  data,
  value,
  defaultValue,
  onChange,
  outerSize,
  innerSize,
}: {
  data: ChoiceData[];
  /** Controlled selected id. If provided, the parent owns selection. */
  value?: string;
  /** Uncontrolled initial selection, ignored if `value` is provided. */
  defaultValue?: string;
  onChange?: (id: string) => void;
  outerSize?: number;
  innerSize?: number;
}) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<string | undefined>(
    defaultValue
  );
  const selectedId = isControlled ? value : internalValue;

  const handleSelect = (id: string) => {
    if (!isControlled) {
      setInternalValue(id);
    }
    onChange?.(id);
  };

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
      },
      labelContainer: {
        flex: 1,
      },
      separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: theme.colors.textMuted,
      },
    })
  );

  return (
    <View accessibilityRole="radiogroup">
      {data.map((item, index) => (
        <Fragment key={item.id}>
          {index > 0 && <View style={styles.separator} />}
          <View style={[styles.row, item.rowStyle]}>
            {item.icon && (
              <IconSymbol
                name={item.icon}
                size={item.iconSize}
                style={item.iconStyle}
              />
            )}

            {(item.primaryLabel || item.secondaryLabel) && (
              <View style={styles.labelContainer}>
                {item.primaryLabel && (
                  <Text style={item.primaryLabelStyle}>
                    {item.primaryLabel}
                  </Text>
                )}
                {item.secondaryLabel && (
                  <Text style={item.secondaryLabelStyle}>
                    {item.secondaryLabel}
                  </Text>
                )}
              </View>
            )}

            <RadioButton
              id={item.id}
              disabled={item.disabled}
              isSelected={selectedId === item.id}
              onSelect={handleSelect}
              outerSize={outerSize}
              innerSize={innerSize}
            />
          </View>
        </Fragment>
      ))}
    </View>
  );
}

export default RadioButtons;
export { RadioButton };
export type { ChoiceData };
