// @ts-nocheck — reference skeleton, not real source. Imports point at placeholder paths or modules that aren't installed in this skills repo. See examples/INDEX.md.
import { extensions } from '@wix/astro/builders';

export default extensions.customElement({
  id: '<CUSTOM_ELEMENT_UUID>',
  name: 'PayPal Pay Button',
  tagName: 'paypal-pay-button',
  element: './extensions/site/widgets/custom-elements/paypal-pay-button/widget.tsx',
  settings: './extensions/site/widgets/custom-elements/paypal-pay-button/panel.tsx',
  installation: {
    autoAdd: true,
  },
  width: {
    defaultWidth: 320,
    allowStretch: true,
  },
  height: {
    defaultHeight: 240,
  },
});
