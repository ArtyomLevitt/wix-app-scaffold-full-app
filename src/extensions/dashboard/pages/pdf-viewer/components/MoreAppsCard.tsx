import { type FC } from 'react';
import { useIntl } from 'react-intl';
import { Box, Button, Card, Text, TextButton } from '@wix/design-system';
import * as Icons from '@wix/wix-ui-icons-common';

import frequentlyBoughtImg from '../assets/frequently-bought-together.png';
import verifyingShippingImg from '../assets/verifying-shipping-addresses.png';
import productViewer360Img from '../assets/360-product-viewer.png';
import customAdditionalFeesImg from '../assets/custom-additional-fees.png';
import purpleLogoIcon from '../assets/purple-logo.png';

const toUrl = (asset: string | { src?: string }): string =>
  typeof asset === 'string' ? asset : asset?.src ?? '';

const REFERRAL_QS =
  '?referral=developer&referralTag=purple&referralSectionName=developer-page';

export const MoreAppsCard: FC = () => {
  const intl = useIntl();
  const t = (id: string) => intl.formatMessage({ id });

  const apps = [
    {
      name: t('moreApps.frequentlyBoughtTogether'),
      desc: t('moreApps.frequentlyBoughtTogetherDesc'),
      icon: toUrl(frequentlyBoughtImg),
      url: `https://www.wix.com/app-market/17d75b11-b574-4b49-9708-4ffa8be777a6${REFERRAL_QS}`,
    },
    {
      name: t('moreApps.shippingAddressVerifier'),
      desc: t('moreApps.shippingAddressVerifierDesc'),
      icon: toUrl(verifyingShippingImg),
      url: `https://www.wix.com/app-market/shipping-address-verifier${REFERRAL_QS}`,
    },
    {
      name: t('moreApps.productViewer360'),
      desc: t('moreApps.productViewer360Desc'),
      icon: toUrl(productViewer360Img),
      url: `https://www.wix.com/app-market/dd2b43ee-f3e5-4ca2-bb87-73f41be78d18${REFERRAL_QS}`,
    },
    {
      name: t('moreApps.customAdditionalFees'),
      desc: t('moreApps.customAdditionalFeesDesc'),
      icon: toUrl(customAdditionalFeesImg),
      url: `https://www.wix.com/app-market/90064897-d063-459c-afdb-69856d3e9b08${REFERRAL_QS}`,
    },
  ];

  return (
    <Card>
      <Card.Content>
        <Box direction="vertical" gap="18px">
          <Text size="medium" weight="bold">
            {t('moreApps.title')}
          </Text>

          <div
            style={{
              display: 'flex',
              gap: 24,
              alignItems: 'stretch',
              flexWrap: 'wrap',
            }}
          >
            {apps.map((app) => (
              <div
                key={app.url}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  padding: 16,
                  borderRadius: 8,
                  border: '1px solid #E8E8E8',
                  flex: '1 1 0',
                  minWidth: 200,
                  boxSizing: 'border-box',
                }}
              >
                <img
                  src={app.icon}
                  alt={app.name}
                  style={{ width: 48, height: 48, borderRadius: 10 }}
                />
                <Text size="small" weight="bold" style={{ textAlign: 'center' }}>
                  {app.name}
                </Text>
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start' }}>
                  <Text size="tiny" secondary style={{ textAlign: 'center' }}>
                    {app.desc}
                  </Text>
                </div>
                <Button
                  size="tiny"
                  priority="secondary"
                  as="a"
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('button.getApp')}
                </Button>
              </div>
            ))}
          </div>

          <Box direction="horizontal" verticalAlign="middle">
            <Box flex="1">
              <TextButton
                size="small"
                as="a"
                href="https://www.wix.com/app-market/developer/purple"
                target="_blank"
                rel="noopener noreferrer"
                suffixIcon={<Icons.ExternalLinkSmall />}
              >
                {t('moreApps.exploreMore')}
              </TextButton>
            </Box>
            <Box direction="horizontal" gap="SP1" verticalAlign="middle">
              <Text
                size="tiny"
                secondary
                style={{ letterSpacing: '1.2px', textTransform: 'uppercase' }}
              >
                {t('moreApps.poweredBy')}
              </Text>
              <img
                src={toUrl(purpleLogoIcon)}
                alt="PURPLE"
                style={{ height: 20, display: 'block' }}
              />
            </Box>
          </Box>
        </Box>
      </Card.Content>
    </Card>
  );
};
