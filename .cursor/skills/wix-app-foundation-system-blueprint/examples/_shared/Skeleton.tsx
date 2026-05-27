// @ts-nocheck — reference skeleton, not real source. Imports point at placeholder paths or modules that aren't installed in this skills repo. See examples/INDEX.md.
// Canonical PRPL Skeleton component — copy verbatim into _shared/Skeleton.tsx.
//
// House style for dashboard loading states: ALWAYS use a shimmer skeleton
// sized to match the real content slot, NEVER a <Loader /> spinner. Spinners
// cause layout jumps as data arrives, look amateurish on stat cards and form
// sections, and don't communicate the shape of the incoming content.
//
// Reference implementations:
//  - StatCard: 92×18 shimmer in place of the value
//  - Form sections: stack of label-sized + input-sized shimmers (see BlockSkeleton)
//  - Preview / iframe area: full-bleed shimmer with the same aspect ratio
//  - Plan cards: 3-column grid of card-shaped shimmer rectangles
//
// Mount <SkeletonStyleTag /> ONCE per page (just under WixDesignSystemProvider).
// All Skeleton instances on the page read its global @keyframes definition.

import React, { type FC } from 'react';

const SHIMMER_KEYFRAMES = `
@keyframes prpl-shimmer {
  0% { background-position: -800px 0; }
  100% { background-position: 800px 0; }
}
`;

const shimmerStyle: React.CSSProperties = {
  background:
    'linear-gradient(90deg, #F0F2F5 25%, #E4E6EB 37%, #F0F2F5 63%)',
  backgroundSize: '800px 100%',
  animation: 'prpl-shimmer 1.4s ease infinite',
};

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  style?: React.CSSProperties;
}

export const Skeleton: FC<SkeletonProps> = ({
  width = '100%',
  height = 14,
  radius = 6,
  style,
}) => (
  <div
    style={{
      width,
      height,
      borderRadius: radius,
      ...shimmerStyle,
      ...style,
    }}
  />
);

export const SkeletonStyleTag: FC = () => <style>{SHIMMER_KEYFRAMES}</style>;

// 92×18 bar — matches `<Text size="medium" weight="bold">` in the StatCard
// value slot so the card doesn't jump when data arrives.
export const StatValueSkeleton: FC = () => (
  <Skeleton width={92} height={18} radius={6} />
);

// Multi-line text-shape placeholder for paragraph-style content.
export const BlockSkeleton: FC<{ lines?: number; widths?: string[] }> = ({
  lines = 3,
  widths = ['100%', '90%', '60%'],
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      padding: '4px 0',
    }}
  >
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        width={widths[i] || '75%'}
        height={12}
        radius={4}
      />
    ))}
  </div>
);
