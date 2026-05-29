'use client';

/**
 * Shared certificate rendering helpers — used by:
 *   - Single-cert download in `app/(public)/check/[formId]/client.tsx`
 *   - Bulk-from-CSV generator in `app/(dashboard)/certificates/[id]/bulk/`
 *
 * Why client-only: html2canvas-pro and jspdf require a real DOM. The
 * caller mounts a hidden `<CertificateRenderer>` and passes its ref here.
 */

interface CaptureOpts {
  /** A4 landscape: 1123x794. Portrait: 794x1123. */
  width: number;
  height: number;
  scale?: number;
}

/**
 * Capture a DOM element to a canvas. The element is expected to live
 * off-screen (e.g. `top: -9999px`) — we move it into view ONLY inside the
 * cloned sandbox so the user's screen never flashes mid-capture.
 */
export async function captureToCanvas(
  el: HTMLElement,
  opts: CaptureOpts
): Promise<HTMLCanvasElement> {
  const html2canvas = (await import('html2canvas-pro')).default;
  return html2canvas(el, {
    scale: opts.scale ?? 3,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    width: opts.width,
    height: opts.height,
    scrollY: 0,
    scrollX: 0,
    windowWidth: opts.width,
    windowHeight: opts.height,
    onclone: (clonedDoc) => {
      const elId = el.id;
      if (!elId) return;
      const cloned = clonedDoc.getElementById(elId);
      if (cloned) {
        cloned.style.position = 'absolute';
        cloned.style.top = '0px';
        cloned.style.left = '0px';
        cloned.style.zIndex = '9999';
      }
    },
  });
}

/**
 * Convert a canvas to a PNG Blob.
 */
export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('canvas.toBlob returned null'));
      },
      'image/png',
      1.0
    );
  });
}

/**
 * Convert a canvas to a single-page A4 PDF Blob.
 */
export async function canvasToPdfBlob(
  canvas: HTMLCanvasElement,
  isPortrait: boolean
): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({
    orientation: isPortrait ? 'portrait' : 'landscape',
    unit: 'mm',
    format: 'a4',
  });
  const imgData = canvas.toDataURL('image/jpeg', 0.7);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth + 2, pdfHeight + 2, undefined, 'FAST');
  return pdf.output('blob');
}

/**
 * Sanitize a filename component so it's safe to drop into a ZIP entry.
 * Allows letters/digits/dash/underscore. Everything else collapses to `_`.
 */
export function safeFilename(name: string, maxLen = 80): string {
  const cleaned = name
    .normalize('NFKD')
    .replace(/[^\w\s.-]/g, '')
    .trim()
    .replace(/\s+/g, '_');
  return cleaned.slice(0, maxLen) || 'certificate';
}
