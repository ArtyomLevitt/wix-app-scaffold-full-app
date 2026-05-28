import React, { type FC } from 'react';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number;
}

export const Skeleton: FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  radius = 8,
}) => (
  <div
    style={{
      width,
      height,
      borderRadius: radius,
      background: 'linear-gradient(90deg, #F0F2F5 25%, #E4E6EB 37%, #F0F2F5 63%)',
      backgroundSize: '800px 100%',
      animation: 'prpl-shimmer 1.4s ease infinite',
    }}
  />
);

export const SkeletonStyleTag: FC = () => (
  <style>{`
    @keyframes prpl-shimmer {
      0% { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }
  `}</style>
);
