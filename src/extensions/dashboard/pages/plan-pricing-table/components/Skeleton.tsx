import React, { type FC } from 'react';

const SHIMMER_KEYFRAMES = `
@keyframes prpl-shimmer {
  0% { background-position: -800px 0; }
  100% { background-position: 800px 0; }
}
`;

const shimmerStyle: React.CSSProperties = {
  background: 'linear-gradient(90deg, #F0F2F5 25%, #E4E6EB 37%, #F0F2F5 63%)',
  backgroundSize: '800px 100%',
  animation: 'prpl-shimmer 1.4s ease infinite',
};

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
}

export const Skeleton: FC<SkeletonProps> = ({ width = '100%', height = 14, radius = 6 }) => (
  <div style={{ width, height, borderRadius: radius, ...shimmerStyle }} />
);

export const SkeletonStyleTag: FC = () => <style>{SHIMMER_KEYFRAMES}</style>;
