// @ts-nocheck — reference skeleton, not real source. Imports point at placeholder paths or modules that aren't installed in this skills repo. See examples/INDEX.md.
import { app } from '@wix/astro/builders';
import myPage from './extensions/dashboard/pages/my-page/my-page.extension.ts';
import configureProductModal from './extensions/dashboard/modals/configure-product/configure-product.extension.ts';
import { orderFilesPlugin } from './extensions/dashboard/plugins/order-files/order-files.extension.ts';
import { dataExtension } from './extensions/data/data.extension.ts';
import appInstalled from './extensions/backend/events/app-installed/app-installed.extension.ts';
import appRemoved from './extensions/backend/events/app-removed/app-removed.extension.ts';
import planChanged from './extensions/backend/events/plan-changed/plan-changed.extension.ts';
import planPurchased from './extensions/backend/events/plan-purchased/plan-purchased.extension.ts';
import orderCreated from './extensions/backend/events/order-created/order-created.extension.ts';
import fileUploaderPlugin from './extensions/site/plugins/file-uploader/file-uploader.extension.ts';
import checkoutFileLabel from './extensions/site/plugins/checkout-file-label/checkout-file-label.extension.ts';
import cartFileLabelScript from './extensions/site/embedded-scripts/cart-file-label/cart-file-label.extension.ts';

export default app()
  .use(myPage)
  .use(configureProductModal)
  .use(orderFilesPlugin)
  .use(dataExtension)
  .use(appInstalled)
  .use(appRemoved)
  .use(planChanged)
  .use(planPurchased)
  .use(orderCreated)
  .use(fileUploaderPlugin)
  .use(checkoutFileLabel)
  .use(cartFileLabelScript);
