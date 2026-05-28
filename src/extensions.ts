import { app } from '@wix/astro/builders';
import dashboardPage from './extensions/dashboard/pages/plan-pricing-table/plan-pricing-table.extension.ts';
import { dataExtension } from './extensions/data/extensions.ts';
import appInstalled from './extensions/backend/events/app-installed/app-installed.extension.ts';
import appRemoved from './extensions/backend/events/app-removed/app-removed.extension.ts';
import planChanged from './extensions/backend/events/plan-changed/plan-changed.extension.ts';
import planPricingWidget from './extensions/site/widgets/custom-elements/plan-pricing-table/plan-pricing-table.extension.ts';

export default app()
  .use(dashboardPage)
  .use(dataExtension)
  .use(appInstalled)
  .use(appRemoved)
  .use(planChanged)
  .use(planPricingWidget);
