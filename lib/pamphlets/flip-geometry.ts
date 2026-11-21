/**
 * Pure geometry helpers for 3D flipbook solo-cover transitions in StPageFlip.
 *
 * When closing to a solo front cover (e.g. spread 2-3 -> page 1) or solo back cover
 * (e.g. spread 4-5 -> page 6) with soft paper density, StPageFlip sets
 * `bottomPage === flippingPage` because there is no page underneath the lifted leaf.
 * Computing the exact complement polygon of the fold crease clips the lifted static
 * page cleanly along the crease line so no ghost remnant stays visible behind it.
 */

export interface FlipPoint {
  x: number;
  y: number;
}

export interface SoloCoverCloseGeometry {
  /** CSS `polygon(...)` clip-path for the still-flat portion of the lifted page */
  clipPath: string;
  /** Dynamic left offset (px) for the book drop-shadow container */
  shadowLeft: number;
  /** Dynamic width (px) for the book drop-shadow container */
  shadowWidth: number;
  /** Horizontal extent (px) from the center spine still lying flat on the lifted side */
  flatExtent: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clampPoint(point: FlipPoint, width: number, height: number): FlipPoint {
  return {
    x: clamp(point.x, 0, width),
    y: clamp(point.y, 0, height),
  };
}

/**
 * Computes the exact still-flat polygon (in element-local CSS coordinates) and
 * adaptive shadow bounds for the lifted page while closing to a solo cover.
 *
 * Coordinate conventions:
 * - Input intersect points are in StPageFlip page-local coordinates where `x = 0`
 *   lies on the center spine and `x = pageWidth` lies on the outer book edge.
 * - For `direction === 'back'` (lifting `leftPage`, e.g. 2-3 -> 1), element CSS
 *   `x = 0` is the outer left edge and `x = pageWidth` is the spine, so `x` is mirrored.
 * - For `direction === 'forward'` (lifting `rightPage`, e.g. 4-5 -> 6), element CSS
 *   `x = 0` is the spine and `x = pageWidth` is the outer right edge.
 */
export function computeSoloCoverCloseGeometry(params: {
  direction: 'forward' | 'back';
  pageWidth: number;
  pageHeight: number;
  bookWidth: number;
  topIntersect: FlipPoint | null;
  sideIntersect: FlipPoint | null;
  bottomIntersect: FlipPoint | null;
}): SoloCoverCloseGeometry {
  const {
    direction,
    pageWidth,
    pageHeight,
    bookWidth,
    topIntersect,
    sideIntersect,
    bottomIntersect,
  } = params;

  const w = Math.max(0, pageWidth);
  const h = Math.max(0, pageHeight);
  const totalBookWidth = Math.max(w, bookWidth);

  let localPolygon: FlipPoint[];
  let flatExtent: number;

  if (topIntersect !== null && bottomIntersect !== null) {
    // Crease crosses from top edge to bottom edge — outer edge has fully lifted
    const t = clampPoint(topIntersect, w, h);
    const b = clampPoint(bottomIntersect, w, h);
    localPolygon = [
      { x: 0, y: 0 },
      t,
      b,
      { x: 0, y: h },
    ];
    flatExtent = Math.min(t.x, b.x);
  } else if (topIntersect !== null && sideIntersect !== null) {
    // Top outer corner is peeled back; bottom outer corner still lies flat
    const t = clampPoint(topIntersect, w, h);
    const s = clampPoint(sideIntersect, w, h);
    localPolygon = [
      { x: 0, y: 0 },
      t,
      s,
      { x: w, y: h },
      { x: 0, y: h },
    ];
    flatExtent = t.x;
  } else if (sideIntersect !== null && bottomIntersect !== null) {
    // Bottom outer corner is peeled back; top outer corner still lies flat
    const s = clampPoint(sideIntersect, w, h);
    const b = clampPoint(bottomIntersect, w, h);
    localPolygon = [
      { x: 0, y: 0 },
      { x: w, y: 0 },
      s,
      b,
      { x: 0, y: h },
    ];
    flatExtent = b.x;
  } else {
    // Degenerate / fully closed frame — hide the lifted page completely
    localPolygon = [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ];
    flatExtent = 0;
  }

  const mappedPoints = localPolygon.map((pt) => ({
    x: direction === 'back' ? w - pt.x : pt.x,
    y: pt.y,
  }));

  const clipPath = `polygon(${mappedPoints
    .map((pt) => `${pt.x.toFixed(2)}px ${pt.y.toFixed(2)}px`)
    .join(', ')})`;

  const clampedFlat = clamp(flatExtent, 0, w);
  const shadowWidth = Math.min(totalBookWidth, Math.round(w + clampedFlat));
  const shadowLeft =
    direction === 'back' ? Math.max(0, Math.round(totalBookWidth - shadowWidth)) : 0;

  return {
    clipPath,
    shadowLeft,
    shadowWidth,
    flatExtent: clampedFlat,
  };
}

/**
 * Resolves whether the 3D Flipbook renders as a 2-page spread or 1-page view:
 * - Single-page document (`totalPages < 2`): always 1 page.
 * - `forceMobile` (e.g. vertical phone preview in builder): 1 page when vertical, 2 pages if horizontal.
 * - Desktop (`viewportWidth >= 768`): always 2 pages.
 * - Mobile (`viewportWidth < 768`): 1 page in vertical/portrait, 2 pages in horizontal/landscape.
 */
export function resolveIsTwoPageSpread(params: {
  totalPages: number;
  viewportWidth: number;
  viewportHeight: number;
  forceMobile?: boolean;
}): boolean {
  const { totalPages, viewportWidth, viewportHeight, forceMobile = false } = params;
  if (totalPages < 2) return false;
  if (forceMobile) {
    return viewportWidth > viewportHeight;
  }
  if (viewportWidth >= 768) return true;
  return viewportWidth > viewportHeight;
}

/**
 * Formats the page indicator label for 3D Flipbook mode (e.g. `1 / 6`, `2-3 / 6`, `6 / 6`, `1-2 / 2`).
 */
export function formatFlipbookPageLabel(params: {
  currentPage: number;
  totalPages: number;
  isTwoPageSpread: boolean;
}): string {
  const { currentPage, totalPages, isTwoPageSpread } = params;
  if (totalPages <= 0) return `${currentPage} / 1`;
  if (!isTwoPageSpread || totalPages === 1) {
    return `${currentPage} / ${totalPages}`;
  }
  if (totalPages === 2) {
    return '1-2 / 2';
  }
  if (currentPage <= 1) {
    return `1 / ${totalPages}`;
  }
  if (currentPage >= totalPages && totalPages % 2 === 0) {
    return `${totalPages} / ${totalPages}`;
  }
  const left = currentPage % 2 === 0 ? currentPage : currentPage - 1;
  const right = Math.min(totalPages, left + 1);
  return left === right ? `${left} / ${totalPages}` : `${left}-${right} / ${totalPages}`;
}

export interface BookEdgeThickness {
  /** Outer left page-stack thickness in px (0 when no pages lie on the left side) */
  leftThickness: number;
  /** Outer right page-stack thickness in px (0 when no pages lie on the right side) */
  rightThickness: number;
  /** Maximum full-book stack thickness in px for this document's page count */
  maxThickness: number;
}

/**
 * Computes realistic dynamic outer page-stack thicknesses for the left and right sides
 * of the 3D flipbook based on how many physical leaves sit on each side of the spine.
 *
 * Examples (6-page book, 3 leaves, maxThickness = 12px):
 * - Page 1 (Front Cover): left 0px, right 12px
 * - Spread 2-3: left 2px (thin), right 10px (thick)
 * - Spread 4-5: left 10px (thick), right 2px (thin)
 * - Page 6 (Back Cover): left 12px, right 0px
 */
export function computeBookEdgeThickness(params: {
  totalPages: number;
  currentPage: number;
  isTwoPageSpread: boolean;
}): BookEdgeThickness {
  const { totalPages, currentPage, isTwoPageSpread } = params;

  if (totalPages <= 1) {
    return { leftThickness: 0, rightThickness: 0, maxThickness: 0 };
  }

  const safePage = clamp(Math.round(currentPage), 1, totalPages);

  // Single-page (mobile vertical) mode: show remaining stack depth on the right edge only
  if (!isTwoPageSpread) {
    const maxSingle = Math.min(14, Math.max(4, Math.round(3 + Math.sqrt(totalPages - 1) * 2.5)));
    const remainingRatio = (totalPages - safePage) / Math.max(1, totalPages - 1);
    const rightThickness =
      safePage >= totalPages ? 0 : Math.max(2, Math.round(remainingRatio * maxSingle));
    return {
      leftThickness: 0,
      rightThickness,
      maxThickness: maxSingle,
    };
  }

  // Two-page spread of an exact 2-page single-leaf pamphlet (Page 1 left, Page 2 right)
  if (totalPages === 2) {
    return { leftThickness: 2, rightThickness: 2, maxThickness: 4 };
  }

  const totalLeaves = Math.ceil(totalPages / 2);
  const maxThickness = Math.min(18, Math.round(6 + Math.sqrt(totalLeaves - 1) * 4.2));

  // Solo Front Cover (Page 1 on right, nothing on left)
  if (safePage <= 1) {
    return { leftThickness: 0, rightThickness: maxThickness, maxThickness };
  }

  // Solo Back Cover for even-page books (Page N on left, nothing on right)
  if (safePage >= totalPages && totalPages % 2 === 0) {
    return { leftThickness: maxThickness, rightThickness: 0, maxThickness };
  }

  // Open interior 2-page spread
  const leftPageNum = safePage % 2 === 0 ? safePage : safePage - 1;
  const leftLeaves = Math.max(1, Math.ceil(leftPageNum / 2));
  const rightLeaves = Math.max(1, totalLeaves - leftLeaves);

  const minOpenEdge = 2;
  const maxOpenEdge = Math.max(minOpenEdge, maxThickness - 2);

  const computeOpenSide = (leaves: number): number => {
    if (totalLeaves <= 2) {
      return Math.round((minOpenEdge + maxOpenEdge) / 2);
    }
    const ratio = clamp((leaves - 1) / (totalLeaves - 2), 0, 1);
    return Math.round(minOpenEdge + ratio * (maxOpenEdge - minOpenEdge));
  };

  return {
    leftThickness: computeOpenSide(leftLeaves),
    rightThickness: computeOpenSide(rightLeaves),
    maxThickness,
  };
}
