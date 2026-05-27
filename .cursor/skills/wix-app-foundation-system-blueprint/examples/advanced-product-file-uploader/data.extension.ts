// @ts-nocheck — reference skeleton, not real source. Imports point at placeholder paths or modules that aren't installed in this skills repo. See examples/INDEX.md.
import { extensions } from '@wix/astro/builders';

export const dataExtension = extensions.genericExtension({
  compId: '<DATA_EXTENSION_UUID>',
  compName: 'data-extension',
  compType: 'DATA_COMPONENT',
  compData: {
    dataComponent: {
      collections: [
        {
          schemaUrl: 'https://www.wix.com/',
          idSuffix: 'product-file-configs',
          displayName: 'Product File Configs',
          displayField: 'productName',
          fields: [
            {
              key: 'productId',
              displayName: 'Product ID',
              type: 'TEXT',
              unique: true,
              description: 'Wix Stores product ID',
            },
            {
              key: 'productName',
              displayName: 'Product Name',
              type: 'TEXT',
              description: 'Cached product name for display',
            },
            {
              key: 'productImage',
              displayName: 'Product Image',
              type: 'TEXT',
              description: 'Cached product thumbnail URL',
            },
            {
              key: 'isEnabled',
              displayName: 'Enabled',
              type: 'BOOLEAN',
              description: 'Whether file upload is active for this product',
            },
            {
              key: 'maxFiles',
              displayName: 'Max Files',
              type: 'NUMBER',
              description: 'Maximum number of files per order',
            },
            {
              key: 'allowedTypes',
              displayName: 'Allowed Types',
              type: 'TEXT',
              description: 'Comma-separated MIME types',
            },
            {
              key: 'maxFileSize',
              displayName: 'Max File Size (MB)',
              type: 'NUMBER',
              description: 'Maximum file size in megabytes',
            },
            {
              key: 'instructions',
              displayName: 'Instructions',
              type: 'TEXT',
              description: 'Instructions shown to customer on upload',
            },
            {
              key: 'isRequired',
              displayName: 'Required',
              type: 'BOOLEAN',
              description: 'Whether file upload is mandatory to complete purchase',
            },
            {
              key: 'collectionId',
              displayName: 'Collection ID',
              type: 'TEXT',
              description: 'Wix Stores collection ID for filtering',
            },
          ],
          dataPermissions: {
            itemRead: 'ANYONE',
            itemInsert: 'CMS_EDITOR',
            itemUpdate: 'CMS_EDITOR',
            itemRemove: 'CMS_EDITOR',
          },
        },
        {
          schemaUrl: 'https://www.wix.com/',
          idSuffix: 'uploaded-files',
          displayName: 'Uploaded Files',
          displayField: 'fileName',
          fields: [
            {
              key: 'orderId',
              displayName: 'Order ID',
              type: 'TEXT',
              description: 'Wix eCommerce order ID',
            },
            {
              key: 'productId',
              displayName: 'Product ID',
              type: 'TEXT',
              description: 'Associated product ID',
            },
            {
              key: 'productName',
              displayName: 'Product Name',
              type: 'TEXT',
              description: 'Cached product name',
            },
            {
              key: 'fileName',
              displayName: 'File Name',
              type: 'TEXT',
              description: 'Original uploaded file name',
            },
            {
              key: 'fileUrl',
              displayName: 'File URL',
              type: 'TEXT',
              description: 'Wix Media Manager URL',
            },
            {
              key: 'fileSize',
              displayName: 'File Size',
              type: 'NUMBER',
              description: 'File size in bytes',
            },
            {
              key: 'fileType',
              displayName: 'File Type',
              type: 'TEXT',
              description: 'MIME type of the file',
            },
            {
              key: 'uploadedAt',
              displayName: 'Uploaded At',
              type: 'DATETIME',
              description: 'Upload timestamp',
            },
            {
              key: 'customerEmail',
              displayName: 'Customer Email',
              type: 'TEXT',
              description: 'Customer email for reference',
            },
            {
              key: 'lineItemId',
              displayName: 'Line Item ID',
              type: 'TEXT',
              description: 'eCommerce line item ID',
            },
            {
              key: 'sessionId',
              displayName: 'Session ID',
              type: 'TEXT',
              description: 'Visitor upload session identifier for order linking',
            },
          ],
          dataPermissions: {
            itemRead: 'ANYONE',
            itemInsert: 'ANYONE',
            itemUpdate: 'CMS_EDITOR',
            itemRemove: 'CMS_EDITOR',
          },
        },
      ],
    },
  },
});
