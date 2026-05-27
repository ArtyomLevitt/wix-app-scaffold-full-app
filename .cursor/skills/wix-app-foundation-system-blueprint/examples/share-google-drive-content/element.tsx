// @ts-nocheck — reference skeleton, not real source. Imports point at placeholder paths or modules that aren't installed in this skills repo. See examples/INDEX.md.
import React, { type FC, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import reactToWebComponent from 'react-to-webcomponent';
import { IntlProvider, useIntl } from 'react-intl';
import styles from './element.module.css';
// @ts-ignore
import watermarkLogo from './watermark-logo.png';
import { loadMessages, getLocaleSafe } from '../../../../intl/withIntlProvider';

type DriveFileType =
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'form'
  | 'drawings'
  | 'maps'
  | 'file'
  | 'folder'
  | null;

interface ParsedDriveInfo {
  type: DriveFileType;
  id: string;
}

function parseDriveUrl(url: string): ParsedDriveInfo | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  const patterns: [RegExp, DriveFileType][] = [
    [/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/, 'document'],
    [/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/, 'spreadsheet'],
    [/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/, 'presentation'],
    [/docs\.google\.com\/forms\/d\/([a-zA-Z0-9_-]+)/, 'form'],
    [/docs\.google\.com\/drawings\/d\/([a-zA-Z0-9_-]+)/, 'drawings'],
    [/google\.com\/maps\/d\/.*[?&]mid=([a-zA-Z0-9_.-]+)/, 'maps'],
    [/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/, 'folder'],
    [/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/, 'file'],
    [/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/, 'file'],
  ];

  for (const [regex, type] of patterns) {
    const match = trimmed.match(regex);
    if (match) return { type, id: match[1] };
  }
  return null;
}

function buildEmbedUrl(info: ParsedDriveInfo, viewMode: string, folderView: string = 'list'): string {
  const { type, id } = info;
  switch (type) {
    case 'document':
      return viewMode === 'edit'
        ? `https://docs.google.com/document/d/${id}/edit?embedded=true`
        : `https://docs.google.com/document/d/${id}/preview`;
    case 'spreadsheet':
      return viewMode === 'edit'
        ? `https://docs.google.com/spreadsheets/d/${id}/edit?usp=sharing&embedded=true`
        : `https://docs.google.com/spreadsheets/d/${id}/preview`;
    case 'presentation':
      return `https://docs.google.com/presentation/d/${id}/embed?start=false&loop=false&delayms=3000`;
    case 'form':
      return `https://docs.google.com/forms/d/${id}/viewform?embedded=true`;
    case 'drawings':
      return `https://docs.google.com/drawings/d/${id}/preview`;
    case 'maps':
      return `https://www.google.com/maps/d/embed?mid=${id}`;
    case 'folder':
      return `https://drive.google.com/embeddedfolderview?id=${id}#${folderView === 'grid' ? 'grid' : 'list'}`;
    case 'file':
    default:
      return `https://drive.google.com/file/d/${id}/preview`;
  }
}

const TYPE_LABEL_KEYS: Record<string, string> = {
  document: 'contentType.document',
  spreadsheet: 'contentType.spreadsheet',
  presentation: 'contentType.presentation',
  form: 'contentType.form',
  drawings: 'contentType.drawings',
  maps: 'contentType.maps',
  file: 'contentType.driveFile',
  folder: 'contentType.folder',
};

interface Props {
  driveurl?: string;
  viewmode?: string;
  folderview?: string;
  displayheight?: string;
  showborder?: string;
  bordercolor?: string;
  borderradius?: string;
  contenttitle?: string;
  ispremium?: string;
}

const GoogleDriveViewerInner: FC<Props> = ({
  driveurl = '',
  viewmode = 'preview',
  folderview = 'list',
  displayheight = '600',
  showborder = 'true',
  bordercolor = '#e0e0e0',
  borderradius = '8',
  contenttitle = '',
  ispremium = 'false',
}) => {
  const intl = useIntl();
  const t = (id: string) => intl.formatMessage({ id });

  const premium = ispremium === 'true';

  if (!driveurl) {
    return (
      <div className={styles.root}>
        <div className={styles.placeholder}>
          <svg className={styles.driveIcon} viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5l5.4 9.35z" fill="#0066da" />
            <path d="M43.65 25L29.9 1.2C28.55 2 27.4 3.1 26.6 4.5L3.15 45.15c-.8 1.4-1.2 2.95-1.2 4.5h27.5L43.65 25z" fill="#00ac47" />
            <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75L84.3 60.2c.8-1.4 1.2-2.95 1.2-4.5H58.05l6.85 12.3 8.65 8.8z" fill="#ea4335" />
            <path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2L43.65 25z" fill="#00832d" />
            <path d="M58.05 49.65h27.5c0-1.55-.4-3.1-1.2-4.5L70.6 22.65c-.8-1.4-1.95-2.5-3.3-3.3L43.65 49.65h14.4z" fill="#2684fc" />
            <path d="M43.65 25l-17-29.5c-1.35.8-2.5 1.9-3.3 3.3l23.3 50.85h14.4L43.65 25z" fill="#ffba00" />
          </svg>
          <div className={styles.placeholderTitle}>{t('widget.placeholderTitle')}</div>
          <div className={styles.placeholderSubtitle}>
            {t('widget.placeholderSubtitle')}
          </div>
        </div>
      </div>
    );
  }

  const parsed = parseDriveUrl(driveurl);
  if (!parsed) {
    return (
      <div className={styles.root}>
        <div className={styles.error}>
          {t('widget.invalidUrl')}
        </div>
      </div>
    );
  }

  const embedUrl = buildEmbedUrl(parsed, viewmode, folderview);
  const typeKey = TYPE_LABEL_KEYS[parsed.type || ''];
  const ariaLabel = typeKey ? t(typeKey) : t('widget.fallbackLabel');
  const hasBorder = showborder === 'true';

  const isFileEmbed = parsed.type === 'file';
  const wrapperStyle: React.CSSProperties = {
    borderRadius: `${borderradius}px`,
    ...(hasBorder ? { border: `1px solid ${bordercolor}` } : {}),
  };

  return (
    <div className={styles.root}>
      {contenttitle && contenttitle.trim().length > 0 && (
        <h3 className={styles.title}>{contenttitle.trim()}</h3>
      )}
      <div
        className={`${styles.frameWrapper} ${isFileEmbed ? styles.frameWrapperVideo : ''}`}
        style={wrapperStyle}
      >
        <iframe
          src={embedUrl}
          height={isFileEmbed ? undefined : displayheight}
          style={isFileEmbed ? { height: '100%' } : undefined}
          allow="autoplay; encrypted-media"
          allowFullScreen
          loading="lazy"
          title={ariaLabel}
          className={styles.iframe}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation allow-popups-to-escape-sandbox"
        />
        {!premium && (
          <div className={styles.watermark} aria-hidden="true">
            <img
              src={watermarkLogo}
              alt=""
              className={styles.watermarkLogo}
              draggable={false}
            />
            <span className={styles.watermarkText}>Powered by PURPLE</span>
          </div>
        )}
      </div>
    </div>
  );
};

const LocalizedGoogleDriveViewer: FC<Props> = (props) => {
  const [messages, setMessages] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    loadMessages()
      .then(setMessages)
      .catch(() => {
        import('../../../../intl/messages/en.json').then((m) => setMessages(m.default));
      });
  }, []);

  if (!messages) return null;

  return (
    <IntlProvider messages={messages} locale={getLocaleSafe()} defaultLocale="en">
      <GoogleDriveViewerInner {...props} />
    </IntlProvider>
  );
};

const customElement = reactToWebComponent(
  LocalizedGoogleDriveViewer,
  React,
  ReactDOM as any,
  {
    props: {
      driveurl: 'string',
      viewmode: 'string',
      folderview: 'string',
      displayheight: 'string',
      showborder: 'string',
      bordercolor: 'string',
      borderradius: 'string',
      contenttitle: 'string',
      ispremium: 'string',
    },
  },
);

export default customElement;
