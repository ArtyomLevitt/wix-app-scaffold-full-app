import React, {
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { PURPLE_LOGO_DATA_URI } from './purple-logo';
import type { FitMode, PageLayout, ThemeMode } from './widget-settings-types';

export interface PdfViewerLabels {
  placeholderTitle: string;
  placeholderSubtitle: string;
  invalidUrl: string;
  loadError: string;
  editorPreviewTitle: string;
  editorPreviewSubtitle: string;
  prevPage: string;
  nextPage: string;
  zoomIn: string;
  zoomOut: string;
  download: string;
  pageOf: string;
  poweredBy: string;
  pageLimitNotice: string;
}

export interface PdfViewerCoreProps {
  pdfUrl: string;
  defaultZoom: number;
  fitMode: FitMode;
  showToolbar: boolean;
  allowDownload: boolean;
  theme: ThemeMode;
  accentColor: string;
  viewerHeight: number;
  pageLayout: PageLayout;
  isPremium: boolean;
  maxPages: number | null;
  labels: PdfViewerLabels;
  previewWidth?: number | string;
  isEditorPreview?: boolean;
}

type ViewerState = 'idle' | 'loading' | 'ready' | 'error';

interface PdfJsLib {
  getDocument: (src: { url: string; withCredentials?: boolean }) => {
    promise: Promise<PdfDocument>;
  };
  GlobalWorkerOptions: { workerSrc: string };
}

interface PdfDocument {
  numPages: number;
  getPage: (n: number) => Promise<PdfPage>;
}

interface PdfPage {
  getViewport: (opts: { scale: number }) => { width: number; height: number };
  render: (ctx: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }) => { promise: Promise<void> };
}

const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174';

let pdfJsPromise: Promise<PdfJsLib> | null = null;

function loadPdfJs(): Promise<PdfJsLib> {
  if (pdfJsPromise) return pdfJsPromise;
  pdfJsPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('no window'));
      return;
    }
    const w = window as Window & { pdfjsLib?: PdfJsLib };
    if (w.pdfjsLib) {
      resolve(w.pdfjsLib);
      return;
    }
    const script = document.createElement('script');
    script.src = `${PDFJS_CDN}/pdf.min.js`;
    script.async = true;
    script.onload = () => {
      const lib = w.pdfjsLib;
      if (!lib) {
        reject(new Error('pdfjs failed'));
        return;
      }
      lib.GlobalWorkerOptions.workerSrc = `${PDFJS_CDN}/pdf.worker.min.js`;
      resolve(lib);
    };
    script.onerror = () => reject(new Error('pdfjs script failed'));
    document.head.appendChild(script);
  });
  return pdfJsPromise;
}

export function detectSandboxedFrame(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem('__pdf_viewer_sandbox_probe', '1');
    localStorage.removeItem('__pdf_viewer_sandbox_probe');
  } catch {
    return true;
  }
  const markers = ['editor.wix.com', 'wixstudio.com', 'wix.com/_partials'];
  try {
    const ancestors = window.location.ancestorOrigins;
    if (ancestors) {
      for (let i = 0; i < ancestors.length; i++) {
        if (markers.some((m) => (ancestors[i] || '').includes(m))) return true;
      }
    }
  } catch {
    /* ignore */
  }
  const ref = document.referrer || '';
  if (markers.some((m) => ref.includes(m))) return true;
  return false;
}

export const PdfViewerCore: FC<PdfViewerCoreProps> = ({
  pdfUrl,
  defaultZoom,
  fitMode,
  showToolbar,
  allowDownload,
  theme,
  accentColor,
  viewerHeight,
  pageLayout,
  isPremium,
  maxPages,
  labels,
  previewWidth = '100%',
  isEditorPreview,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<ViewerState>('idle');
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(defaultZoom);
  const [errorMsg, setErrorMsg] = useState('');
  const docRef = useRef<PdfDocument | null>(null);

  const effectiveMaxPages = maxPages ?? numPages;
  const displayPages = Math.min(numPages, effectiveMaxPages);
  const sandboxed = isEditorPreview ?? detectSandboxedFrame();

  const themeStyles = useMemo(
    () => ({
      bg: theme === 'dark' ? '#1a1a2e' : '#ffffff',
      text: theme === 'dark' ? '#f0f0f0' : '#333333',
      toolbarBg: theme === 'dark' ? '#16213e' : '#f7f8fa',
      border: theme === 'dark' ? '#2a2a4a' : '#e4e6eb',
    }),
    [theme],
  );

  const renderPages = useCallback(async () => {
    if (!pdfUrl.trim() || !containerRef.current || sandboxed) return;
    setState('loading');
    setErrorMsg('');
    try {
      const pdfjs = await loadPdfJs();
      const loadingTask = pdfjs.getDocument({ url: pdfUrl, withCredentials: false });
      const pdf = await loadingTask.promise;
      docRef.current = pdf;
      setNumPages(pdf.numPages);
      setCurrentPage(1);
      setState('ready');
    } catch (err) {
      console.error('[PdfViewerCore] load failed:', err);
      setState('error');
      setErrorMsg(labels.loadError);
    }
  }, [pdfUrl, sandboxed, labels.loadError]);

  useEffect(() => {
    setZoom(defaultZoom);
  }, [defaultZoom]);

  useEffect(() => {
    renderPages();
  }, [renderPages]);

  useEffect(() => {
    if (state !== 'ready' || !docRef.current || !containerRef.current) return;

    const canvasHost = containerRef.current.querySelector('[data-pdf-canvas-host]');
    if (!canvasHost) return;

    let cancelled = false;

    async function draw() {
      const pdf = docRef.current;
      const host = containerRef.current?.querySelector('[data-pdf-canvas-host]');
      if (!pdf || !host) return;
      host.innerHTML = '';

      const scale = (zoom / 100) * (fitMode === 'fit-page' ? 0.85 : 1);
      const pagesToRender =
        pageLayout === 'single'
          ? [currentPage]
          : Array.from({ length: displayPages }, (_, i) => i + 1);

      for (const pageNum of pagesToRender) {
        if (cancelled || pageNum > displayPages) break;
        const page = await pdf.getPage(pageNum);
        let viewport = page.getViewport({ scale });
        if (fitMode === 'fit-width' && containerRef.current) {
          const containerWidth = containerRef.current.clientWidth - 32;
          if (containerWidth > 0 && viewport.width > containerWidth) {
            const ratio = containerWidth / viewport.width;
            viewport = page.getViewport({ scale: scale * ratio });
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.display = 'block';
        canvas.style.margin = pageLayout === 'continuous' ? '0 auto 16px' : '0 auto';
        canvas.style.maxWidth = '100%';
        canvas.style.height = 'auto';
        host.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        await page.render({ canvasContext: ctx, viewport }).promise;
      }
    }

    draw().catch((err) => {
      console.error('[PdfViewerCore] render failed:', err);
      setState('error');
      setErrorMsg(labels.loadError);
    });

    return () => {
      cancelled = true;
    };
  }, [state, currentPage, zoom, fitMode, pageLayout, displayPages, labels.loadError]);

  const handleDownload = () => {
    if (!allowDownload || !pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = 'document.pdf';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  };

  const rootStyle: React.CSSProperties = {
    width: previewWidth,
    height: viewerHeight,
    minHeight: 320,
    display: 'flex',
    flexDirection: 'column',
    background: themeStyles.bg,
    color: themeStyles.text,
    borderRadius: 8,
    border: `1px solid ${themeStyles.border}`,
    overflow: 'hidden',
    position: 'relative',
    boxSizing: 'border-box',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  };

  if (!pdfUrl.trim()) {
    return (
      <div style={rootStyle}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{labels.placeholderTitle}</div>
            <div style={{ fontSize: 14, opacity: 0.7 }}>{labels.placeholderSubtitle}</div>
          </div>
        </div>
      </div>
    );
  }

  if (sandboxed) {
    return (
      <div style={rootStyle}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{labels.editorPreviewTitle}</div>
            <div style={{ fontSize: 14, opacity: 0.7 }}>{labels.editorPreviewSubtitle}</div>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div style={rootStyle}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, color: '#c0392b' }}>
          {errorMsg || labels.loadError}
        </div>
      </div>
    );
  }

  return (
    <div style={rootStyle} ref={containerRef}>
      {showToolbar && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            background: themeStyles.toolbarBg,
            borderBottom: `1px solid ${themeStyles.border}`,
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1 || pageLayout === 'continuous'}
            style={toolbarBtn(accentColor)}
            aria-label={labels.prevPage}
          >
            ‹
          </button>
          <span style={{ fontSize: 13, minWidth: 80, textAlign: 'center' }}>
            {labels.pageOf
              .replace('{current}', String(pageLayout === 'continuous' ? displayPages : currentPage))
              .replace('{total}', String(displayPages))}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(displayPages, p + 1))}
            disabled={currentPage >= displayPages || pageLayout === 'continuous'}
            style={toolbarBtn(accentColor)}
            aria-label={labels.nextPage}
          >
            ›
          </button>
          <button type="button" onClick={() => setZoom((z) => Math.max(50, z - 10))} style={toolbarBtn(accentColor)} aria-label={labels.zoomOut}>
            −
          </button>
          <span style={{ fontSize: 13 }}>{zoom}%</span>
          <button type="button" onClick={() => setZoom((z) => Math.min(200, z + 10))} style={toolbarBtn(accentColor)} aria-label={labels.zoomIn}>
            +
          </button>
          {allowDownload && isPremium && (
            <button type="button" onClick={handleDownload} style={{ ...toolbarBtn(accentColor), marginLeft: 'auto' }}>
              {labels.download}
            </button>
          )}
        </div>
      )}
      <div
        data-pdf-canvas-host
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 16,
          position: 'relative',
        }}
      >
        {state === 'loading' && (
          <div style={{ textAlign: 'center', padding: 40, opacity: 0.6 }}>…</div>
        )}
      </div>
      {!isPremium && maxPages !== null && numPages > maxPages && (
        <div
          style={{
            padding: '8px 12px',
            fontSize: 12,
            background: themeStyles.toolbarBg,
            borderTop: `1px solid ${themeStyles.border}`,
            textAlign: 'center',
          }}
        >
          {labels.pageLimitNotice.replace('{limit}', String(maxPages))}
        </div>
      )}
      {!isPremium && (
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            right: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255,255,255,0.92)',
            padding: '6px 10px',
            borderRadius: 6,
            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
            pointerEvents: 'none',
          }}
          aria-hidden
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '1.1px',
              textTransform: 'uppercase',
              color: '#888',
            }}
          >
            {labels.poweredBy}
          </span>
          <img src={PURPLE_LOGO_DATA_URI} alt="" style={{ height: 18, display: 'block' }} draggable={false} />
        </div>
      )}
    </div>
  );
};

function toolbarBtn(accent: string): React.CSSProperties {
  return {
    padding: '4px 10px',
    fontSize: 16,
    lineHeight: 1,
    borderRadius: 4,
    border: `1px solid ${accent}`,
    background: 'transparent',
    color: accent,
    cursor: 'pointer',
  };
}

export default PdfViewerCore;
