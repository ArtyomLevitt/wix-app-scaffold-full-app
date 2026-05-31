import { dataExtension } from './extensions/data/extensions.ts';
import pdfViewerPage from './extensions/dashboard/pages/pdf-viewer/pdf-viewer.extension.ts';
import pdfViewerWidget from './extensions/site/widgets/custom-elements/pdf-viewer/pdf-viewer.extension.ts';
import appInstalled from './extensions/backend/events/app-installed/app-installed.extension.ts';
import appRemoved from './extensions/backend/events/app-removed/app-removed.extension.ts';
import planChanged from './extensions/backend/events/plan-changed/plan-changed.extension.ts';

export default {
  extensions: [
    dataExtension,
    pdfViewerPage,
    pdfViewerWidget,
    appInstalled,
    appRemoved,
    planChanged,
  ],
};
