import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const baseWidth = 375;
const baseHeight = 812;

const scaleWidth = width / baseWidth;
const scaleHeight = height / baseHeight;
const scale = Math.min(scaleWidth, scaleHeight);

export const responsiveFontSize = (size: number): number => {
  const newSize = size * scale;
  return Math.round(newSize);
};

export const rf = responsiveFontSize;
