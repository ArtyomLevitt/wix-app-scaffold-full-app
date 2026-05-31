import { extensions } from '@wix/astro/builders';

export const dataExtension = extensions.genericExtension({
  compId: '432c704d-130a-454d-a5bd-039eb082bb54',
  compName: 'data-extension',
  compType: 'DATA_COMPONENT',
  compData: {
    dataComponent: {
      collections: [
        {
          schemaUrl: 'https://www.wix.com/',
          idSuffix: 'pdf-viewer-data',
          displayName: 'PDF Viewer & Flipbook Data',
          displayField: 'key',
          fields: [
            {
              key: 'key',
              displayName: 'Key',
              type: 'TEXT',
              description: 'Row identifier — e.g. "widget_settings", "usage_counter".',
            },
            {
              key: 'settings',
              displayName: 'Settings JSON',
              type: 'OBJECT',
              objectOptions: {},
            },
            {
              key: 'v',
              displayName: 'Encoded Value',
              type: 'TEXT',
              description: 'Encoded monthly usage counter.',
            },
          ],
          dataPermissions: {
            itemRead: 'PRIVILEGED',
            itemInsert: 'PRIVILEGED',
            itemUpdate: 'PRIVILEGED',
            itemRemove: 'PRIVILEGED',
          },
        },
      ],
    },
  },
});
