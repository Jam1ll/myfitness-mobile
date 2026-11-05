import { useTypography } from '@/theme/typography';
import React from 'react';
import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

export interface AppTextProps extends TextProps {
  className?: string;
  weight?: 'normal' | 'bold' | 'semibold' | 'regular';
}

export function AppText({
  style,
  className = '',
  weight,
  children,
  ...props
}: AppTextProps) {
  const { getFont } = useTypography();

  // Flatten styles to inspect existing fontWeight
  const flattenedStyle = StyleSheet.flatten(style) || {};

  const isBoldFromClass =
    className.includes('font-bold') ||
    className.includes('font-extrabold') ||
    className.includes('font-black') ||
    className.includes('font-semibold');

  const isBoldFromProps = weight === 'bold' || weight === 'semibold';
  const isRegularFromProps = weight === 'regular' || weight === 'normal';

  const isBoldFromStyle =
    flattenedStyle.fontWeight === 'bold' ||
    flattenedStyle.fontWeight === '700' ||
    flattenedStyle.fontWeight === '800' ||
    flattenedStyle.fontWeight === '900' ||
    flattenedStyle.fontWeight === '600';

  const effectiveWeight: TextStyle['fontWeight'] = isRegularFromProps
    ? 'normal'
    : isBoldFromClass || isBoldFromProps || isBoldFromStyle
    ? 'bold'
    : flattenedStyle.fontWeight;

  const fontName = getFont(effectiveWeight);

  const dynamicStyle: TextStyle = {
    ...(fontName ? { fontFamily: fontName } : {}),
  };

  return (
    <Text
      {...props}
      className={className}
      style={[style, dynamicStyle]}
    >
      {children}
    </Text>
  );
}

export default AppText;

