/**
 * Client-side PDF to E-Pamphlet page image importer powered by PDF.js (pdfjs-dist).
 * Converts each PDF page into a crisp, lightweight WebP/JPEG image so the 3D Flipbook,
 * Touch Slider, and Vertical Scroll viewers stay fast and responsive on every device.
 */

import type { PamphletOrientation } from '@/lib/types/pamphlets';
import type * as PdfJsTypes from 'pdfjs-dist';

/** Maximum accepted PDF file size (30 MB) to keep browser memory safe */
export const MAX_PDF_FILE_SIZE_BYTES = 30 * 1024 * 1024;

/** Maximum number of pages extracted from a single PDF document */
export const MAX_PDF_PAGES = 60;

/** Target longest-edge resolution (px) for rendered PDF pages (sharp even at 200% zoom) */
export const DEFAULT_PDF_TARGET_MAX_DIM = 1600;

/** Hard upper bound on canvas dimensions to stay within mobile Safari / browser limits */
const MAX_CANVAS_DIMENSION = 2400;

/**
 * Self-hosted PDF.js runtime & worker matching installed pdfjs-dist version.
 * Loaded via native browser ESM import (bypassing Webpack/Turbopack) to avoid
 * Webpack 5 double-bundling collisions ("Object.defineProperty called on non-object")
 * and remain 100% compliant with strict CSP ('self').
 */
export const PDF_LIB_SRC = '/pdf.min.mjs';
export const PDF_WORKER_SRC = '/pdf.worker.min.mjs';

let pdfjsModulePromise: Promise<typeof PdfJsTypes> | null = null;

async function loadPdfJs(): Promise<typeof PdfJsTypes> {
  if (!pdfjsModulePromise) {
    const moduleUrl = new URL(PDF_LIB_SRC, window.location.origin).href;
    pdfjsModulePromise = (
      import(/* webpackIgnore: true */ /* @vite-ignore */ moduleUrl) as Promise<typeof PdfJsTypes>
    )
      .then((mod) => {
        if (mod?.GlobalWorkerOptions && mod.GlobalWorkerOptions.workerSrc !== PDF_WORKER_SRC) {
          mod.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
        }
        return mod;
      })
      .catch((err) => {
        pdfjsModulePromise = null;
        throw err;
      });
  }
  return pdfjsModulePromise;
}

export interface FileLike {
  name?: string;
  type?: string;
  size?: number;
}

export interface PdfRenderDimensions {
  scale: number;
  width: number;
  height: number;
  aspectRatio: number;
  orientation: PamphletOrientation;
}

export interface PdfImportProgress {
  stage: 'loading' | 'rendering';
  currentPage: number;
  totalPages: number;
  fileName: string;
}

export interface RenderedPdfPage {
  pageNumber: number;
  blob: Blob;
  mimeType: 'image/webp' | 'image/jpeg';
  fileExt: 'webp' | 'jpg';
  width: number;
  height: number;
  aspectRatio: number;
  orientation: PamphletOrientation;
}

export interface PdfImportResult {
  pages: RenderedPdfPage[];
  totalPdfPages: number;
  truncated: boolean;
}

export interface RenderPdfOptions {
  maxPages?: number;
  maxDimension?: number;
  quality?: number;
  onProgress?: (progress: PdfImportProgress) => void;
}

const SUPPORTED_IMAGE_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
]);

const SUPPORTED_IMAGE_EXTENSIONS = /\.(png|jpe?g|webp)$/i;

/**
 * Checks whether a file is a PDF by MIME type or .pdf extension.
 */
export function isPdfFile(file: FileLike | null | undefined): boolean {
  if (!file) return false;
  const mime = (file.type || '').toLowerCase().trim();
  if (mime === 'application/pdf' || mime === 'application/x-pdf') {
    return true;
  }
  const name = (file.name || '').trim();
  return /\.pdf$/i.test(name);
}

/**
 * Checks whether a file is a supported raster image (PNG, JPG, WebP).
 */
export function isSupportedImageFile(file: FileLike | null | undefined): boolean {
  if (!file) return false;
  const mime = (file.type || '').toLowerCase().trim();
  if (SUPPORTED_IMAGE_MIME_TYPES.has(mime)) {
    return true;
  }
  const name = (file.name || '').trim();
  return SUPPORTED_IMAGE_EXTENSIONS.test(name);
}

/**
 * Checks whether a file is supported by the E-Pamphlet Builder uploader (PDF or image).
 */
export function isSupportedPamphletFile(file: FileLike | null | undefined): boolean {
  return isPdfFile(file) || isSupportedImageFile(file);
}

/**
 * Validates a PDF file before attempting client-side parsing.
 */
export function validatePdfForImport(
  file: FileLike | null | undefined,
  maxSizeBytes: number = MAX_PDF_FILE_SIZE_BYTES
): { valid: true } | { valid: false; error: string } {
  if (!file || !isPdfFile(file)) {
    return {
      valid: false,
      error: 'Please select a valid PDF file (.pdf).',
    };
  }

  const size = typeof file.size === 'number' ? file.size : 0;
  if (size <= 0) {
    return {
      valid: false,
      error: `PDF file "${file.name || 'document.pdf'}" is empty.`,
    };
  }

  if (size > maxSizeBytes) {
    const maxMb = Math.round(maxSizeBytes / (1024 * 1024));
    return {
      valid: false,
      error: `PDF file "${file.name || 'document.pdf'}" exceeds the ${maxMb}MB size limit.`,
    };
  }

  return { valid: true };
}

/**
 * Computes crisp target render scale, pixel dimensions, aspect ratio (width/height),
 * and orientation from a PDF page's unscaled point dimensions (at scale = 1).
 */
export function computePdfRenderDimensions(
  pageWidthPt: number,
  pageHeightPt: number,
  maxDimension: number = DEFAULT_PDF_TARGET_MAX_DIM
): PdfRenderDimensions {
  // Fallback safely to A4 portrait (595 x 842 pt) if PDF reports invalid dimensions
  const safeW = Number.isFinite(pageWidthPt) && pageWidthPt > 0 ? pageWidthPt : 595;
  const safeH = Number.isFinite(pageHeightPt) && pageHeightPt > 0 ? pageHeightPt : 842;

  const targetMax = Math.min(
    MAX_CANVAS_DIMENSION,
    Math.max(400, Number.isFinite(maxDimension) ? maxDimension : DEFAULT_PDF_TARGET_MAX_DIM)
  );

  const longestEdge = Math.max(safeW, safeH);
  const rawScale = targetMax / longestEdge;
  // Clamp scale so tiny PDF pages do not explode and giant posters fit inside canvas limits
  const scale = Math.min(3, Math.max(0.25, Number(rawScale.toFixed(4))));

  const width = Math.max(1, Math.min(MAX_CANVAS_DIMENSION, Math.round(safeW * scale)));
  const height = Math.max(1, Math.min(MAX_CANVAS_DIMENSION, Math.round(safeH * scale)));
  const aspectRatio = Number((width / height).toFixed(3));
  const orientation: PamphletOrientation = aspectRatio > 1.05 ? 'landscape' : 'portrait';

  return {
    scale,
    width,
    height,
    aspectRatio,
    orientation,
  };
}

/**
 * Converts a rendered HTMLCanvasElement into a lightweight WebP blob, falling back
 * to JPEG when a browser does not support WebP canvas encoding.
 */
async function canvasToOptimizedBlob(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<{ blob: Blob; mimeType: 'image/webp' | 'image/jpeg'; fileExt: 'webp' | 'jpg' }> {
  const clampedQuality = Math.min(0.95, Math.max(0.5, quality));

  const webpBlob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/webp', clampedQuality);
  });

  if (webpBlob && webpBlob.type === 'image/webp' && webpBlob.size > 0) {
    return { blob: webpBlob, mimeType: 'image/webp', fileExt: 'webp' };
  }

  const jpegQuality = Math.min(0.92, clampedQuality + 0.04);
  const jpegBlob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', jpegQuality);
  });

  if (!jpegBlob || jpegBlob.size === 0) {
    throw new Error('Failed to encode rendered PDF page image.');
  }

  return { blob: jpegBlob, mimeType: 'image/jpeg', fileExt: 'jpg' };
}

/**
 * Renders every page of a user-selected PDF file in the browser into crisp
 * WebP/JPEG blobs ready to be uploaded and displayed in the 3D Flipbook viewer.
 *
 * Dynamically loads `pdfjs-dist` at runtime so SSR and public viewer bundles remain zero-overhead.
 */
export async function renderPdfFileToPageImages(
  file: File,
  options: RenderPdfOptions = {}
): Promise<PdfImportResult> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('PDF import can only run in the browser.');
  }

  const validation = validatePdfForImport(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const maxPages = options.maxPages ?? MAX_PDF_PAGES;
  const maxDimension = options.maxDimension ?? DEFAULT_PDF_TARGET_MAX_DIM;
  const quality = options.quality ?? 0.86;
  const { onProgress } = options;

  onProgress?.({
    stage: 'loading',
    currentPage: 0,
    totalPages: 0,
    fileName: file.name,
  });

  // Native browser ESM load keeps pdfjs-dist out of SSR, out of public viewer bundles,
  // and avoids Next.js Webpack 5 double-bundling collisions with pdfjs-dist's internal webpack wrapper.
  const pdfjs = await loadPdfJs();

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(arrayBuffer),
    isEvalSupported: false,
    useSystemFonts: true,
  });

  let pdfDoc: Awaited<typeof loadingTask.promise> | null = null;
  const canvas = document.createElement('canvas');

  try {
    try {
      pdfDoc = await loadingTask.promise;
    } catch (err) {
      const errName = err instanceof Error ? err.name : '';
      const errMsg = err instanceof Error ? err.message : '';
      if (errName === 'PasswordException' || /password/i.test(errMsg)) {
        throw new Error(
          `PDF "${file.name}" is password-protected. Please unlock it first before uploading.`
        );
      }
      if (errName === 'InvalidPDFException') {
        throw new Error(
          `File "${file.name}" is not a valid or readable PDF document.`
        );
      }
      throw new Error(
        `Could not read PDF "${file.name}". Please ensure the file is not corrupted.`
      );
    }

    const totalPdfPages: number = pdfDoc.numPages || 0;
    if (totalPdfPages <= 0) {
      throw new Error(`PDF "${file.name}" contains no readable pages.`);
    }

    const pagesToRender = Math.min(totalPdfPages, maxPages);
    const truncated = totalPdfPages > maxPages;
    const renderedPages: RenderedPdfPage[] = [];

    for (let pageNum = 1; pageNum <= pagesToRender; pageNum++) {
      onProgress?.({
        stage: 'rendering',
        currentPage: pageNum,
        totalPages: pagesToRender,
        fileName: file.name,
      });

      const page = await pdfDoc.getPage(pageNum);
      try {
        const baseViewport = page.getViewport({ scale: 1 });
        const dims = computePdfRenderDimensions(
          baseViewport.width,
          baseViewport.height,
          maxDimension
        );
        const viewport = page.getViewport({ scale: dims.scale });

        canvas.width = Math.max(1, Math.round(viewport.width));
        canvas.height = Math.max(1, Math.round(viewport.height));

        const ctx = canvas.getContext('2d', { alpha: false });
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        await page.render({
          canvas,
          viewport,
          background: '#ffffff',
        }).promise;

        const { blob, mimeType, fileExt } = await canvasToOptimizedBlob(canvas, quality);

        renderedPages.push({
          pageNumber: pageNum,
          blob,
          mimeType,
          fileExt,
          width: canvas.width,
          height: canvas.height,
          aspectRatio: dims.aspectRatio,
          orientation: dims.orientation,
        });
      } finally {
        try {
          page.cleanup();
        } catch {
          // Non-fatal cleanup
        }
      }
    }

    return {
      pages: renderedPages,
      totalPdfPages,
      truncated,
    };
  } finally {
    // Release backing canvas memory immediately
    canvas.width = 0;
    canvas.height = 0;
    if (pdfDoc) {
      try {
        await pdfDoc.destroy();
      } catch {
        // Ignore teardown errors
      }
    }
  }
}
