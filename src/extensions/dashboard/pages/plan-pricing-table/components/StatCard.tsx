import React, { type CSSProperties, type FC, type ReactNode } from 'react';
import { Badge, Box, Text } from '@wix/design-system';

const SHIMMER: CSSProperties = {
  background: 'linear-gradient(90deg, #F0F2F5 25%, #E4E6EB 37%, #F0F2F5 63%)',
  backgroundSize: '800px 100%',
  animation: 'prpl-shimmer 1.4s ease infinite',
  width: 92,
  height: 18,
  borderRadius: 6,
};

interface StatCardProps {
  iconBg?: string;
  iconColor?: string;
  icon: ReactNode;
  label: string;
  value?: ReactNode;
  badge?: {
    text: string;
    skin?:
      | 'neutralSuccess'
      | 'neutralStandard'
      | 'standard'
      | 'warning'
      | 'success'
      | 'danger'
      | 'neutral'
      | 'premium';
  };
  loading?: boolean;
  highlight?: boolean;
}

export const StatCard: FC<StatCardProps> = ({
  iconBg = '#EDF3FF',
  iconColor = '#3B6AEA',
  icon,
  label,
  value,
  badge,
  loading,
  highlight,
}) => (
  <div
    style={{
      borderRadius: 12,
      background: highlight
        ? 'linear-gradient(135deg, #F3E8FF 0%, #EDE7F6 100%)'
        : '#fff',
      border: highlight ? '1px solid #D1C4E9' : '1px solid #E4E6EB',
      padding: '20px',
      height: '100%',
      boxSizing: 'border-box',
      boxShadow: highlight
        ? '0 2px 12px rgba(107,33,168,0.08)'
        : '0 1px 3px rgba(0,0,0,0.06)',
    }}
  >
    <Box direction="vertical" gap="8px" align="center">
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: iconBg,
          color: iconColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>
      <Text size="small" weight="bold" secondary>
        {label}
      </Text>
      {loading ? (
        <div style={SHIMMER} />
      ) : value !== undefined ? (
        typeof value === 'string' || typeof value === 'number' ? (
          <Text size="medium" weight="bold">{value}</Text>
        ) : (
          value
        )
      ) : null}
      {badge && (
        <Badge size="tiny" skin={badge.skin ?? 'neutralStandard'}>
          {badge.text}
        </Badge>
      )}
    </Box>
  </div>
);
