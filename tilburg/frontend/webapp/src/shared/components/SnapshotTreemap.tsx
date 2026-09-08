import type { CSSProperties } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Flex, Heading, Text } from '@radix-ui/themes';
import type { AxialCodeSnapshotCode } from '../types/axialCodeSnapshotCode.ts';
import type { Snapshot } from '../types/snapshot.ts';
import { colors } from '../styling/colors.ts';

interface ScaledItem {
  readonly _v: number;
  readonly code: AxialCodeSnapshotCode;
}

interface TreemapRect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly code: AxialCodeSnapshotCode;
}

function worst(row: readonly ScaledItem[], shorter: number): number {
  const sum = row.reduce((s, i) => s + i._v, 0);
  const max = Math.max(...row.map((i) => i._v));
  const min = Math.min(...row.map((i) => i._v));
  if (sum === 0 || min === 0) return Infinity;
  const s2 = shorter * shorter;
  const sum2 = sum * sum;
  return Math.max((s2 * max) / sum2, sum2 / (s2 * min));
}

function placeRow(
  row: readonly ScaledItem[],
  x: number,
  y: number,
  w: number,
  h: number
): TreemapRect[] {
  const sum = row.reduce((s, i) => s + i._v, 0);
  if (sum === 0 || row.length === 0) return [];
  const horizontal = w >= h;
  const rects: TreemapRect[] = [];
  if (horizontal) {
    const rowW = sum / h;
    let cy = y;
    for (const item of row) {
      const itemH = item._v / rowW;
      rects.push({ x, y: cy, w: rowW, h: itemH, code: item.code });
      cy += itemH;
    }
  } else {
    const rowH = sum / w;
    let cx = x;
    for (const item of row) {
      const itemW = item._v / rowH;
      rects.push({ x: cx, y, w: itemW, h: rowH, code: item.code });
      cx += itemW;
    }
  }
  return rects;
}

function layout(
  children: readonly ScaledItem[],
  row: readonly ScaledItem[],
  x: number,
  y: number,
  w: number,
  h: number
): TreemapRect[] {
  if (children.length === 0) return row.length > 0 ? placeRow(row, x, y, w, h) : [];
  const next = children[0];
  const newRow = [...row, next];
  const shorter = Math.min(w, h);
  if (row.length === 0 || worst(newRow, shorter) <= worst(row, shorter)) {
    return layout(children.slice(1), newRow, x, y, w, h);
  }
  const placed = placeRow(row, x, y, w, h);
  const rowSum = row.reduce((s, i) => s + i._v, 0);
  if (w >= h) {
    const rowW = rowSum / h;
    return [...placed, ...layout(children, [], x + rowW, y, w - rowW, h)];
  }
  const rowH = rowSum / w;
  return [...placed, ...layout(children, [], x, y + rowH, w, h - rowH)];
}

function squarify(
  codes: readonly AxialCodeSnapshotCode[],
  width: number,
  height: number
): TreemapRect[] {
  const sorted = [...codes].sort((a, b) => b.openCodeCount - a.openCodeCount);
  const total = sorted.reduce((s, c) => s + c.openCodeCount, 0);
  if (total === 0 || width === 0 || height === 0) return [];
  const scaled: ScaledItem[] = sorted.map((c) => ({
    _v: (c.openCodeCount / total) * width * height,
    code: c,
  }));
  return layout(scaled, [], 0, 0, width, height);
}

function getLuminance(hex: string): number {
  const c = hex.replace('#', '');
  const r = Number.parseInt(c.slice(0, 2), 16) / 255;
  const g = Number.parseInt(c.slice(2, 4), 16) / 255;
  const b = Number.parseInt(c.slice(4, 6), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// ---------- Single treemap block ----------

const GAP = 3;

interface BlockProps {
  readonly rect: TreemapRect;
  readonly isHovered: boolean;
  readonly isDimmed: boolean;
  readonly accentMatch: boolean;
  readonly onMouseEnter: () => void;
  readonly onMouseLeave: () => void;
}

function TreemapBlock({
  rect,
  isHovered,
  isDimmed,
  accentMatch,
  onMouseEnter,
  onMouseLeave,
}: BlockProps) {
  const { x, y, w, h, code } = rect;
  const luminance = getLuminance(code.color);
  const useDarkText = luminance > 0.66;
  const isLight = luminance > 0.55;
  const textShadow = useDarkText
    ? '0 1px 2px rgba(255,255,255,0.2)'
    : isLight
      ? '0 1px 3px rgba(0,0,0,0.32)'
      : 'none';
  const fg = useDarkText ? '#0F2A1E' : '#FFFFFF';
  const fgMuted = useDarkText ? 'rgba(15,42,30,0.82)' : 'rgba(255,255,255,0.82)';
  const showLabel = w > GAP * 2 + 60 && h > GAP * 2 + 28;
  const showStats = w > GAP * 2 + 90 && h > GAP * 2 + 52;

  return (
    <button
      type="button"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onMouseEnter}
      onBlur={onMouseLeave}
      aria-label={`${code.name}, ${code.openCodeCount} open codes, ${code.prevalence}% prevalence`}
      style={{
        position: 'absolute',
        left: x + GAP,
        top: y + GAP,
        width: Math.max(0, w - GAP * 2),
        height: Math.max(0, h - GAP * 2),
        background: code.color,
        borderRadius: 4,
        border: 'none',
        padding: '10px 12px',
        boxSizing: 'border-box',
        cursor: 'pointer',
        transition: 'opacity 160ms ease, box-shadow 160ms ease',
        opacity: isDimmed ? 0.35 : 1,
        boxShadow: isHovered ? `0 4px 14px var(--${colors.theme.radix.primary}-a4)` : 'none',
        outline: accentMatch ? `2px solid var(--${colors.theme.radix.primary}-12)` : 'none',
        outlineOffset: -2,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        textAlign: 'left',
      }}
    >
      {showLabel && (
        <div
          style={
            {
              fontSize: w > 180 ? 13 : 11.5,
              fontWeight: 600,
              color: fg,
              textShadow,
              lineHeight: 1.25,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            } as CSSProperties
          }
        >
          {code.name}
        </div>
      )}
      {showStats && (
        <div
          style={{
            marginTop: 6,
            fontSize: 10.5,
            color: fgMuted,
            textShadow,
          }}
        >
          {code.prevalence}% · {code.openCodeCount} open codes
        </div>
      )}
    </button>
  );
}

// ---------- Treemap (one snapshot) ----------

interface TreemapProps {
  readonly snapshot: Snapshot;
  readonly width: number;
  readonly height: number;
  readonly hovered: (AxialCodeSnapshotCode & { _snap: string }) | null;
  readonly setHovered: (code: (AxialCodeSnapshotCode & { _snap: string }) | null) => void;
  readonly accentMatch: readonly string[] | null;
  readonly snap: 'A' | 'B';
}

function TreemapCanvas({
  snapshot,
  width,
  height,
  hovered,
  setHovered,
  accentMatch,
  snap,
}: TreemapProps) {
  const rects = useMemo(
    () => squarify(snapshot.codes, width, height),
    [snapshot.codes, width, height]
  );
  const accentMatchSet = useMemo(() => new Set(accentMatch ?? []), [accentMatch]);

  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden' }}>
      {rects.map((rect) => {
        const isHovered = hovered?.id === rect.code.id && hovered?._snap === snap;
        const isAccent = accentMatchSet.has(rect.code.id);
        // Dim everything that is neither the hovered block nor an accent-matched cross-highlight
        const isDimmed = hovered !== null && !isHovered && !isAccent;
        return (
          <TreemapBlock
            key={rect.code.id}
            rect={rect}
            isHovered={isHovered}
            isDimmed={isDimmed}
            accentMatch={isAccent}
            onMouseEnter={() => setHovered({ ...rect.code, _snap: snap })}
            onMouseLeave={() => setHovered(null)}
          />
        );
      })}
    </div>
  );
}

// ---------- Section (one or two snapshots + header) ----------

interface SectionProps {
  readonly snapshotA: Snapshot;
  readonly snapshotB?: Snapshot;
}

export default function SnapshotTreemapSection({ snapshotA, snapshotB }: SectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(560);
  const [hovered, setHovered] = useState<(AxialCodeSnapshotCode & { _snap: string }) | null>(null);

  const isDual = snapshotB !== undefined;

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateWidth = (containerWidth: number) => {
      setWidth(isDual ? Math.floor((containerWidth - 20) / 2) : containerWidth);
    };

    updateWidth(element.offsetWidth);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      updateWidth(entry.contentRect.width);
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [isDual]);

  const hoveredIdSet = useMemo(() => new Set(hovered?.traceIds ?? []), [hovered]);
  const matchA =
    hovered?._snap === 'B'
      ? snapshotA.codes
          .filter((a) => a.traceIds.some((id) => hoveredIdSet.has(id)))
          .map((a) => a.id)
      : null;
  const matchB =
    hovered?._snap === 'A' && snapshotB
      ? snapshotB.codes
          .filter((b) => b.traceIds.some((id) => hoveredIdSet.has(id)))
          .map((b) => b.id)
      : null;

  return (
    <Box>
      <Flex align="end" justify="between" gap="4" mb="3">
        <Box>
          <Heading size="3" style={{ letterSpacing: '-0.01em' }}>
            Axial Code Distribution
          </Heading>
          <Text as="p" size="1" color="gray" mt="1">
            Block size = open code count.
            {isDual && '; Hover over a box, it outlines mark related codes across snapshots.'}
          </Text>
        </Box>
      </Flex>

      <div
        ref={containerRef}
        style={{ display: 'grid', gridTemplateColumns: isDual ? '1fr 1fr' : '1fr', gap: 20 }}
      >
        <Box>
          {isDual && (
            <Text size="1" color="gray" mb="2" style={{ display: 'block' }}>
              {snapshotA.label} · {snapshotA.codes.length} codes
            </Text>
          )}
          <TreemapCanvas
            snapshot={snapshotA}
            width={width}
            height={400}
            hovered={hovered}
            setHovered={setHovered}
            accentMatch={matchA}
            snap="A"
          />
        </Box>
        {snapshotB && (
          <Box>
            <Text size="1" color="gray" mb="2" style={{ display: 'block' }}>
              {snapshotB.label} · {snapshotB.codes.length} codes
            </Text>
            <TreemapCanvas
              snapshot={snapshotB}
              width={width}
              height={400}
              hovered={hovered}
              setHovered={setHovered}
              accentMatch={matchB}
              snap="B"
            />
          </Box>
        )}
      </div>
    </Box>
  );
}
