import React, { ComponentType, ReactNode, useState } from 'react';
import { StyleProp, TextStyle } from 'react-native';

type TruncateTextElementProps = {
  children?: ReactNode;
  style?: StyleProp<TextStyle>;
  onPress?: () => void;
};

type TruncateJsxProps = {
  input: string;
  len?: number;
  showAllTrigger?: boolean;
  TextElement: ComponentType<TruncateTextElementProps>;
  inputStyle?: StyleProp<TextStyle>;
  showAllStyle?: StyleProp<TextStyle>;
};

export const useTruncateJsx = ({
  input,
  len = 15,
  showAllTrigger = false,
  TextElement,
  inputStyle,
  showAllStyle,
}: TruncateJsxProps): React.ReactElement => {
  const [showAll, setShowAll] = useState(false);

  const length = Math.max(0, Math.trunc(len));
  const chars = Array.from(input);

  // Nothing to truncate.
  if (chars.length <= length) {
    return <TextElement style={inputStyle}>{input}</TextElement>;
  }

  // Truncation is disabled.
  if (!showAllTrigger) {
    const truncatedText = `${chars.slice(0, length).join('')}`;

    return <TextElement style={inputStyle}>{truncatedText}</TextElement>;
  }

  // Show complete text.
  if (showAll) {
    return (
      <TextElement style={inputStyle}>
        {input}{' '}
        <TextElement style={showAllStyle} onPress={() => setShowAll(false)}>
          ...hide
        </TextElement>
      </TextElement>
    );
  }

  // Show truncated text.
  const truncatedText = `${chars.slice(0, length).join('')}`;

  return (
    <TextElement style={inputStyle}>
      {truncatedText}{' '}
      <TextElement style={showAllStyle} onPress={() => setShowAll(true)}>
        ...show all
      </TextElement>
    </TextElement>
  );
};
