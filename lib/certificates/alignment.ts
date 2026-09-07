import { CertificateElement } from '@/lib/types';

export type AlignmentType = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
export type DistributionType = 'horizontal' | 'vertical';

/**
 * Aligns selected elements along the specified axis.
 */
export function alignElements(
  elements: CertificateElement[],
  selectedIds: string[],
  alignment: AlignmentType
): CertificateElement[] {
  if (selectedIds.length < 2) return elements;

  const targetElements = elements.filter((el) => selectedIds.includes(el.id));
  if (targetElements.length < 2) return elements;

  let targetVal = 0;
  if (alignment === 'left') {
    targetVal = Math.min(...targetElements.map((el) => el.x));
  } else if (alignment === 'center') {
    targetVal = Math.round(
      targetElements.reduce((acc, el) => acc + el.x, 0) / targetElements.length
    );
  } else if (alignment === 'right') {
    targetVal = Math.max(...targetElements.map((el) => el.x));
  } else if (alignment === 'top') {
    targetVal = Math.min(...targetElements.map((el) => el.y));
  } else if (alignment === 'middle') {
    targetVal = Math.round(
      targetElements.reduce((acc, el) => acc + el.y, 0) / targetElements.length
    );
  } else if (alignment === 'bottom') {
    targetVal = Math.max(...targetElements.map((el) => el.y));
  }

  return elements.map((el) => {
    if (!selectedIds.includes(el.id)) return el;
    if (alignment === 'left' || alignment === 'center' || alignment === 'right') {
      return { ...el, x: targetVal };
    }
    return { ...el, y: targetVal };
  });
}

/**
 * Evenly distributes selected elements between the first and last element.
 */
export function distributeElements(
  elements: CertificateElement[],
  selectedIds: string[],
  direction: DistributionType
): CertificateElement[] {
  if (selectedIds.length < 3) return elements;

  const targets = elements
    .filter((el) => selectedIds.includes(el.id))
    .sort((a, b) => (direction === 'horizontal' ? a.x - b.x : a.y - b.y));

  const first = targets[0];
  const last = targets[targets.length - 1];
  const totalSpan = direction === 'horizontal' ? last.x - first.x : last.y - first.y;
  if (totalSpan === 0) return elements;

  const step = totalSpan / (targets.length - 1);

  const updatedPositions = new Map<string, number>();
  targets.forEach((el, index) => {
    const newPos = Math.round(
      (direction === 'horizontal' ? first.x : first.y) + index * step
    );
    updatedPositions.set(el.id, newPos);
  });

  return elements.map((el) => {
    if (!updatedPositions.has(el.id)) return el;
    const newCoord = updatedPositions.get(el.id)!;
    if (direction === 'horizontal') {
      return { ...el, x: newCoord };
    }
    return { ...el, y: newCoord };
  });
}
