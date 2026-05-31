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
          displayName: 'PDF Viewer Data',
          displayField: 'key',
          fields: [
            {
              key: 'key',
              displayName: 'Key',
              type: 'TEXT',
              description: 'Row identifier (e.g. viewer_settings).',
            },
            {
              key: 'settingsJson',
              displayName: 'Settings JSON',
              type: 'TEXT',
              description: 'Serialized widget settings.',
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
