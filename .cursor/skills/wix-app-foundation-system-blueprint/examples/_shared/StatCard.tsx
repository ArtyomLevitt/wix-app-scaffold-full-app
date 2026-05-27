// @ts-nocheck — reference skeleton, not real source. Imports point at placeholder paths or modules that aren't installed in this skills repo. See examples/INDEX.md.
//
// Canonical PRPL StatCard component. Copy verbatim to one of:
//   - Astro:      src/extensions/dashboard/pages/<page>/components/StatCard.tsx
//   - Legacy CLI: src/dashboard/pages/_shared/StatCard.tsx
//
// Cross-verified against the production source of paypal-payment-button,
// stripe-payment-button, cashapp-payment-button, square-payment-button,
// donation-payment-button, venmo-payment-button (identical across all).
//
// See ../../references/DESIGN_SYSTEM.md § 2 "Stat-card design tokens" for
// the full color palette, layout contract, and usage examples.

import { type FC, type ReactNode } from 'react';
import { Badge, Box, Text } from '@wix/design-system';

// House style for in-flight loading: a shimmer skeleton sized to match the
// real value text — NEVER a <Loader /> spinner. Spinners cause the card to
// jump as content arrives. The keyframes live in the page-level SkeletonStyleTag
// (see ./Skeleton.tsx). Width 92×18 matches the bold medium <Text> the slot
// renders post-load.
const SHIMMER: React.CSSProperties = {
  background: 'linear-gradient(90deg, #F0F2F5 25%, #E4E6EB 37%, #F0F2F5 63%)',
  backgroundSize: '800px 100%',
  animation: 'prpl-shimmer 1.4s ease infinite',
  width: 92,
  height: 18,
  borderRadius: 6,
};

interface StatCardProps {
  /** Background of the 52×52 circular icon container. Use one of the
   *  6 palette slots in DESIGN_SYSTEM.md § 2 (blue/emerald/amber/rose/
   *  purple/neutral). Always a gradient for production-quality look. */
  iconBg?: string;
  /** Foreground color of the icon — pair with iconBg per the palette table. */
  iconColor?: string;
  /** WDS icon, e.g. `<Icons.CreditCard style={{ color: '#0070BA' }} />`.
   *  The wrapping div applies `color: iconColor`, but inline-styling the
   *  icon directly is more explicit and survives icon font-size changes. */
  icon: ReactNode;
  /** Short label above the value, e.g. "Connection", "Current plan". */
  label: string;
  /** The number / status text. Pass a string/number for the default
   *  `<Text size="medium" weight="bold">` styling, or pass a ReactNode
   *  (e.g. a Badge) to render it as-is. */
  value?: ReactNode;
  /** Optional status pill under the value. */
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
  /** Renders a `<Loader>` in place of value while data is fetching. */
  loading?: boolean;
  /** Switches to the purple-gradient highlighted state. Use on the
   *  current-plan card when the user is on a premium tier. */
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
