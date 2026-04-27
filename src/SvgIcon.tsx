import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

let Svg: any = null;
let Path: any = null;
let Circle: any = null;
let Rect: any = null;
let Line: any = null;
let Polyline: any = null;

let svgAvailable = false;

try {
  const RNSvg = require('react-native-svg');
  Svg = RNSvg.Svg;
  Path = RNSvg.Path;
  Circle = RNSvg.Circle;
  Rect = RNSvg.Rect;
  Line = RNSvg.Line;
  Polyline = RNSvg.Polyline;
  svgAvailable = !!(Svg && Path);
} catch {
  svgAvailable = false;
}

export type IconName =
  | 'terminal'
  | 'trash'
  | 'filter'
  | 'cloudOff'
  | 'barChart'
  | 'checkCircle'
  | 'moreVertical'
  | 'refresh'
  | 'share'
  | 'copy'
  | 'check'
  | 'chevronDown'
  | 'chevronUp'
  | 'chevronRight'
  | 'search'
  | 'x'
  | 'sun'
  | 'moon'
  | 'download'
  | 'alertCircle'
  | 'code';

interface SvgIconProps {
  name: IconName;
  size?: number;
  color?: string;
}

const IconPaths: Record<IconName, (color: string) => React.ReactNode> = {
  terminal: (color) => (
    <>
      <Polyline
        points="4 17 10 11 4 5"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line
        x1="12"
        y1="19"
        x2="20"
        y2="19"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </>
  ),
  trash: (color) => (
    <>
      <Polyline
        points="3 6 5 6 21 6"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line
        x1="10"
        y1="11"
        x2="10"
        y2="17"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Line
        x1="14"
        y1="11"
        x2="14"
        y2="17"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </>
  ),
  filter: (color) => (
    <Path
      d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  cloudOff: (color) => (
    <>
      <Path
        d="M22.61 16.95A5 5 0 0 0 18 10h-1.26a8 8 0 0 0-7.05-6M5 5a8 8 0 0 0 4 15h9a5 5 0 0 0 1.7-.3"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line
        x1="1"
        y1="1"
        x2="23"
        y2="23"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </>
  ),
  barChart: (color) => (
    <>
      <Line
        x1="12"
        y1="20"
        x2="12"
        y2="10"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Line
        x1="18"
        y1="20"
        x2="18"
        y2="4"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Line
        x1="6"
        y1="20"
        x2="6"
        y2="16"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </>
  ),
  checkCircle: (color) => (
    <>
      <Path
        d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Polyline
        points="22 4 12 14.01 9 11.01"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  moreVertical: (color) => (
    <>
      <Circle cx="12" cy="12" r="1" fill={color} />
      <Circle cx="12" cy="5" r="1" fill={color} />
      <Circle cx="12" cy="19" r="1" fill={color} />
    </>
  ),
  refresh: (color) => (
    <>
      <Polyline
        points="23 4 23 10 17 10"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  share: (color) => (
    <>
      <Circle cx="18" cy="5" r="3" fill="none" stroke={color} strokeWidth={2} />
      <Circle cx="6" cy="12" r="3" fill="none" stroke={color} strokeWidth={2} />
      <Circle
        cx="18"
        cy="19"
        r="3"
        fill="none"
        stroke={color}
        strokeWidth={2}
      />
      <Line
        x1="8.59"
        y1="13.51"
        x2="15.42"
        y2="17.49"
        stroke={color}
        strokeWidth={2}
      />
      <Line
        x1="15.41"
        y1="6.51"
        x2="8.59"
        y2="10.49"
        stroke={color}
        strokeWidth={2}
      />
    </>
  ),
  copy: (color) => (
    <>
      <Rect
        x="9"
        y="9"
        width="13"
        height="13"
        rx="2"
        ry="2"
        fill="none"
        stroke={color}
        strokeWidth={2}
      />
      <Path
        d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  check: (color) => (
    <Polyline
      points="20 6 9 17 4 12"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  chevronDown: (color) => (
    <Polyline
      points="6 9 12 15 18 9"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  chevronUp: (color) => (
    <Polyline
      points="18 15 12 9 6 15"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  chevronRight: (color) => (
    <Polyline
      points="9 18 15 12 9 6"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  search: (color) => (
    <>
      <Circle
        cx="11"
        cy="11"
        r="8"
        fill="none"
        stroke={color}
        strokeWidth={2}
      />
      <Line
        x1="21"
        y1="21"
        x2="16.65"
        y2="16.65"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </>
  ),
  x: (color) => (
    <>
      <Line
        x1="18"
        y1="6"
        x2="6"
        y2="18"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Line
        x1="6"
        y1="6"
        x2="18"
        y2="18"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </>
  ),
  sun: (color) => (
    <>
      <Circle
        cx="12"
        cy="12"
        r="5"
        fill="none"
        stroke={color}
        strokeWidth={2}
      />
      <Line
        x1="12"
        y1="1"
        x2="12"
        y2="3"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Line
        x1="12"
        y1="21"
        x2="12"
        y2="23"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Line
        x1="4.22"
        y1="4.22"
        x2="5.64"
        y2="5.64"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Line
        x1="18.36"
        y1="18.36"
        x2="19.78"
        y2="19.78"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Line
        x1="1"
        y1="12"
        x2="3"
        y2="12"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Line
        x1="21"
        y1="12"
        x2="23"
        y2="12"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Line
        x1="4.22"
        y1="19.78"
        x2="5.64"
        y2="18.36"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Line
        x1="18.36"
        y1="5.64"
        x2="19.78"
        y2="4.22"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </>
  ),
  moon: (color) => (
    <Path
      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  download: (color) => (
    <>
      <Path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Polyline
        points="7 10 12 15 17 10"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line
        x1="12"
        y1="15"
        x2="12"
        y2="3"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </>
  ),
  alertCircle: (color) => (
    <>
      <Circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke={color}
        strokeWidth={2}
      />
      <Line
        x1="12"
        y1="8"
        x2="12"
        y2="12"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Line
        x1="12"
        y1="16"
        x2="12.01"
        y2="16"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </>
  ),
  code: (color) => (
    <>
      <Polyline
        points="16 18 22 12 16 6"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Polyline
        points="8 6 2 12 8 18"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
};

const FallbackIcon: React.FC<{
  name: IconName;
  size: number;
  color: string;
}> = ({ name, size, color }) => {
  const fallbackMap: Record<IconName, string> = {
    terminal: '[>_]',
    trash: '🗑',
    filter: '⋮≡',
    cloudOff: '☁✕',
    barChart: '📊',
    checkCircle: '✓',
    moreVertical: '⋮',
    refresh: '↻',
    share: '↗',
    copy: '⧉',
    check: '✓',
    chevronDown: '▼',
    chevronUp: '▲',
    chevronRight: '▶',
    search: '🔍',
    x: '✕',
    sun: '☀',
    moon: '☾',
    download: '↓',
    alertCircle: '⚠',
    code: '</>',
  };

  return (
    <View style={[styles.fallback, { width: size, height: size }]}>
      <Text style={[styles.fallbackText, { fontSize: size * 0.6, color }]}>
        {fallbackMap[name]}
      </Text>
    </View>
  );
};

export const SvgIcon: React.FC<SvgIconProps> = ({
  name,
  size = 24,
  color = '#e1e2ec',
}) => {
  if (!svgAvailable) {
    return <FallbackIcon name={name} size={size} color={color} />;
  }

  const iconPath = IconPaths[name];
  if (!iconPath) {
    return <FallbackIcon name={name} size={size} color={color} />;
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {iconPath(color)}
    </Svg>
  );
};

export const isSvgAvailable = (): boolean => svgAvailable;

const styles = StyleSheet.create({
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    fontWeight: '600',
  },
});

export default SvgIcon;
