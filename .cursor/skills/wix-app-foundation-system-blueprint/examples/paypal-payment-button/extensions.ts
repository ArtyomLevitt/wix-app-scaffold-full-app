// @ts-nocheck — reference skeleton, not real source. Imports point at placeholder paths or modules that aren't installed in this skills repo. See examples/INDEX.md.
import { app } from '@wix/astro/builders';
import { dataExtension } from './extensions/data/extensions.ts';
import myPage from './extensions/dashboard/pages/my-page/my-page.extension.ts';
import paypalPayButton from './extensions/site/widgets/custom-elements/paypal-pay-button/paypal-pay-button.extension.ts';
import { eventAppInstalled } from './extensions/backend/events/app-installed/app-installed.extension.ts';
import { eventAppRemoved } from './extensions/backend/events/app-removed/app-removed.extension.ts';
import { eventPlanChanged } from './extensions/backend/events/plan-changed/plan-changed.extension.ts';

export default app()
  .use(dataExtension)
  .use(myPage)
  .use(paypalPayButton)
  .use(eventAppInstalled)
  .use(eventAppRemoved)
  .use(eventPlanChanged);
