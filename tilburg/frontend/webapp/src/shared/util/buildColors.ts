import { colors } from '../styling/colors.ts';

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '');
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((channel) =>
      Math.max(0, Math.min(255, Math.round(channel)))
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`;
}

function mixHex(from: string, to: string, ratio: number): string {
  const [fromR, fromG, fromB] = hexToRgb(from);
  const [toR, toG, toB] = hexToRgb(to);

  return rgbToHex(
    fromR + (toR - fromR) * ratio,
    fromG + (toG - fromG) * ratio,
    fromB + (toB - fromB) * ratio
  );
}

export default function buildColors(count: number): string[] {
  if (count <= 0) return [];

  const values = Object.values(colors.theme.radix.primaryScale);
  const referencePalette = [9, 8, 7, 6, 5, 4, 3].map((i) => values[i]);

  return Array.from({ length: count }, (_, i) => {
    if (count === 1) {
      return referencePalette[0];
    }

    const progress = i / (count - 1);
    const scaledIndex = progress * (referencePalette.length - 1);
    const lowerIndex = Math.floor(scaledIndex);
    const upperIndex = Math.min(referencePalette.length - 1, Math.ceil(scaledIndex));

    if (lowerIndex === upperIndex) {
      return referencePalette[lowerIndex];
    }

    return mixHex(
      referencePalette[lowerIndex],
      referencePalette[upperIndex],
      scaledIndex - lowerIndex
    );
  });
}
