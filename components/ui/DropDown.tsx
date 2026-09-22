import { useThemedStyles } from '@/hooks/useThemedStyle';
import React, { Fragment, useState } from 'react';
import {
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { IconSymbol } from './icon-symbol';

export type DropDownItem = {
  id: string;
  label: string;
  disabled?: boolean;
};

type DropDownProps = {
  data: DropDownItem[];

  /** Controlled selected id. If provided, the parent owns selection. */
  value?: string;

  /** Uncontrolled initial selection, ignored if `value` is provided. */
  defaultValue?: string;

  onChange?: (id: string) => void;

  placeholder?: string;

  disabled?: boolean;

  borderless?: boolean;

  style?: StyleProp<ViewStyle>;
};

function DropDown({
  data,
  value,
  defaultValue,
  onChange,
  placeholder = 'Select',
  borderless = true,
  disabled,
  style,
}: DropDownProps) {
  const isControlled = value !== undefined;

  const [internalValue, setInternalValue] = useState<string | undefined>(
    defaultValue
  );

  const [isOpen, setIsOpen] = useState(false);

  const [triggerHeight, setTriggerHeight] = useState(0);

  const [longestLabelWidth, setLongestLabelWidth] = useState(0);

  const selectedId = isControlled ? value : internalValue;

  const selectedLabel = data.find((item) => item.id === selectedId)?.label;

  const handleTriggerLayout = (e: LayoutChangeEvent) => {
    setTriggerHeight(e.nativeEvent.layout.height);
  };

  /**
   * Measure every label and keep the widest one.
   */
  const handleLabelLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;

    setLongestLabelWidth((currentWidth) => Math.max(currentWidth, width));
  };

  const handleSelect = (item: DropDownItem) => {
    if (item.disabled) return;

    if (!isControlled) {
      setInternalValue(item.id);
    }

    onChange?.(item.id);
    setIsOpen(false);
  };

  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      root: {
        alignSelf: 'flex-start',
        zIndex: 100,
      },

      trigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',

        borderWidth: borderless ? 0 : 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.md,

        paddingHorizontal: 16,
        paddingVertical: 12,

        backgroundColor: theme.colors.surfaceCard,
      },

      triggerDisabled: {
        opacity: 0.5,
      },

      triggerText: {
        fontSize: 16,
        color: theme.colors.text,

        /*
         * Prevent Android from unexpectedly shrinking
         * the placeholder/selected text.
         */
        flexShrink: 0,

        /*
         * Helps keep text dimensions consistent on Android.
         */
        includeFontPadding: false,
      },

      placeholderText: {
        color: theme.colors.textMuted,
      },

      menu: {
        position: 'absolute',

        left: 0,
        right: 0,

        borderRadius: theme.radius.md,

        backgroundColor: theme.colors.surfaceCard,

        borderWidth: 1,
        borderColor: theme.colors.border,

        maxHeight: 240,
        overflow: 'hidden',

        zIndex: 20,
        elevation: 8,

        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: {
          width: 0,
          height: 4,
        },
      },

      option: {
        paddingHorizontal: 16,
        paddingVertical: 12,
      },

      optionSelected: {
        backgroundColor: theme.colors.surfaceCardLight,
      },

      optionDisabled: {
        opacity: 0.4,
      },

      optionText: {
        fontSize: 16,
        color: theme.colors.text,
        flexShrink: 0,
        includeFontPadding: false,
      },

      separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: theme.colors.border,
      },

      /*
       * The measurement view is invisible but remains inside
       * the normal coordinate space. This is more reliable
       * across Android and iOS than positioning it at -10000.
       */
      measurementContainer: {
        position: 'absolute',
        opacity: 0,
        pointerEvents: 'none',
      },

      measurementText: {
        fontSize: 16,
        includeFontPadding: false,
        color: theme.colors.text,
        elevation: 4,
      },
    })
  );

  /*
   * Account for:
   *
   * 16px left padding
   * 16px right padding
   * 16px icon
   * 12px gap
   */
  const dropdownWidth = longestLabelWidth + 16 + 16 + 16 + 12;

  return (
    <>
      {/* 
        Hidden measurement labels.
        The placeholder is included because it may be
        wider than every option.
      */}
      <View style={styles.measurementContainer} pointerEvents="none">
        <Text style={styles.measurementText} onLayout={handleLabelLayout}>
          {placeholder}
        </Text>

        {data.map((item) => (
          <Text
            key={item.id}
            style={styles.measurementText}
            onLayout={handleLabelLayout}
          >
            {item.label}
          </Text>
        ))}
      </View>

      <View
        style={[
          styles.root,
          style,
          {
            width: Math.max(dropdownWidth, 100),
          },
        ]}
      >
        <TouchableOpacity
          onLayout={handleTriggerLayout}
          style={[styles.trigger, disabled && styles.triggerDisabled]}
          onPress={() => !disabled && setIsOpen((prev) => !prev)}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityState={{
            expanded: isOpen,
            disabled: !!disabled,
          }}
        >
          <Text
            style={[
              styles.triggerText,
              !selectedLabel && styles.placeholderText,
            ]}
            numberOfLines={1}
          >
            {selectedLabel ?? placeholder}
          </Text>

          <IconSymbol name={isOpen ? 'chevron.up' : 'chevron.down'} size={16} />
        </TouchableOpacity>

        {isOpen && (
          <View
            style={[
              styles.menu,
              {
                top: triggerHeight + 4,
              },
            ]}
          >
            {data.map((item, index) => (
              <Fragment key={item.id}>
                {index > 0 && <View style={styles.separator} />}

                <TouchableOpacity
                  style={[
                    styles.option,
                    item.id === selectedId && styles.optionSelected,
                    item.disabled && styles.optionDisabled,
                  ]}
                  disabled={item.disabled}
                  onPress={() => handleSelect(item)}
                  accessibilityRole="menuitem"
                  accessibilityState={{
                    selected: item.id === selectedId,
                    disabled: !!item.disabled,
                  }}
                >
                  <Text style={styles.optionText} numberOfLines={1}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              </Fragment>
            ))}
          </View>
        )}
      </View>
    </>
  );
}

export default DropDown;
