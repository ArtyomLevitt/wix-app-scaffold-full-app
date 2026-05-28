import React from 'react';
import { Box, Text } from '@wix/design-system';

const Panel: React.FC = () => (
  <Box padding="SP4" direction="vertical" gap="SP2">
    <Text weight="bold">Pricing Plans Compare</Text>
    <Text size="small" secondary>
      Manage plan cards, themes, and badges from the app dashboard. Drag the widget on
      your page to resize it.
    </Text>
  </Box>
);

export default Panel;
