import { useState } from 'react';
import { Box, Flex, Skeleton, Text } from '@radix-ui/themes';
import { Group } from '@visx/group';
import { ParentSize } from '@visx/responsive';
import { Pie } from '@visx/shape';
import type { PieProvidedProps } from '@visx/shape';
import buildColors from '../util/buildColors.ts';

interface DataObject {
  key: string;
  value: number;
}

interface PieChartStatsProps {
  readonly title: string;
  readonly data: DataObject[];
  readonly loading?: boolean;
}

interface TooltipState {
  x: number;
  y: number;
  label: string;
  percentage: number;
}

interface PieArcProps {
  readonly arc: PieProvidedProps<DataObject>['arcs'][number];
  readonly path: PieProvidedProps<DataObject>['path'];
  readonly index: number;
  readonly colors: string[];
  readonly getPercentage: (v: number) => number;
  readonly setTooltip: (t: TooltipState | null) => void;
}

interface PieChartSvgProps {
  readonly width: number;
  readonly height: number;
  readonly data: DataObject[];
  readonly colors: string[];
  readonly getPercentage: (value: number) => number;
  readonly setTooltip: (t: TooltipState | null) => void;
}

function PieArc({ arc, path, index, colors, getPercentage, setTooltip }: PieArcProps) {
  const [labelX, labelY] = path.centroid(arc);
  const percentage = getPercentage(arc.data.value);

  return (
    <g key={arc.data.key}>
      <path
        d={path(arc) ?? ''}
        fill={colors[index]}
        onMouseMove={(event) => {
          const svgRect = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
          if (!svgRect) return;
          setTooltip({
            x: event.clientX - svgRect.left + 10,
            y: event.clientY - svgRect.top + 10,
            label: arc.data.key,
            percentage,
          });
        }}
        onMouseLeave={() => setTooltip(null)}
      />
      <text
        x={labelX}
        y={labelY}
        dy=".33em"
        fill="inherit"
        fontSize={11}
        textAnchor="middle"
        pointerEvents="none"
      >
        {percentage}%
      </text>
    </g>
  );
}

function PieChartSvg({ width, height, data, colors, getPercentage, setTooltip }: PieChartSvgProps) {
  if (width <= 0 || height <= 0) {
    return null;
  }
  const radius = Math.max(0, Math.min(width, height) / 2 - 8);

  return (
    <svg width={width} height={height}>
      <Group left={width / 2} top={height / 2}>
        <Pie<DataObject>
          data={data}
          pieValue={(d) => d.value}
          outerRadius={radius}
          innerRadius={0}
          padAngle={0.01}
        >
          {(pie) =>
            pie.arcs.map((arc, index) => (
              <PieArc
                key={arc.data.key}
                arc={arc}
                path={pie.path}
                index={index}
                colors={colors}
                getPercentage={getPercentage}
                setTooltip={setTooltip}
              />
            ))
          }
        </Pie>
      </Group>
    </svg>
  );
}

export default function PieChartStats({ title, data, loading = true }: PieChartStatsProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const colors = buildColors(data.length);
  const getPercentage = (value: number) => (total > 0 ? Math.round((value / total) * 100) : 0);

  return (
    <Box
      style={{
        flex: '1 1 0',
        width: '100%',
        border: '1px solid var(--gray-5)',
        borderRadius: '14px',
        backgroundColor: 'var(--gray-2)',
        padding: '14px 16px',
        minHeight: '320px',
        overflow: 'hidden',
      }}
    >
      <Flex direction="column" gap="2" justify="start">
        <Text as="label" size="2">
          {title}
        </Text>

        {loading ? (
          <Flex style={{ height: 280 }} gap="3" align="center">
            <Flex
              flexGrow="1"
              align="center"
              justify="center"
              style={{ height: '100%', minWidth: 0 }}
            >
              <Skeleton loading style={{ width: 180, height: 180, borderRadius: '50%' }} />
            </Flex>
            <Flex direction="column" gap="2" style={{ width: 140, minWidth: 140 }}>
              <Flex align="center" gap="2">
                <Skeleton
                  loading
                  style={{ width: 10, height: 10, borderRadius: 2, flexShrink: 0 }}
                />
                <Skeleton loading style={{ width: 90, height: 12 }} />
              </Flex>
              <Flex align="center" gap="2">
                <Skeleton
                  loading
                  style={{ width: 10, height: 10, borderRadius: 2, flexShrink: 0 }}
                />
                <Skeleton loading style={{ width: 70, height: 12 }} />
              </Flex>
              <Flex align="center" gap="2">
                <Skeleton
                  loading
                  style={{ width: 10, height: 10, borderRadius: 2, flexShrink: 0 }}
                />
                <Skeleton loading style={{ width: 80, height: 12 }} />
              </Flex>
            </Flex>
          </Flex>
        ) : (
          <Flex style={{ height: 280, position: 'relative' }} gap="3" align="center">
            <Box style={{ flex: 1, height: '100%', minWidth: 0 }}>
              <ParentSize>
                {({ width, height }) => (
                  <PieChartSvg
                    width={width}
                    height={height}
                    data={data}
                    colors={colors}
                    getPercentage={getPercentage}
                    setTooltip={setTooltip}
                  />
                )}
              </ParentSize>
            </Box>

            <Flex direction="column" gap="2" style={{ width: 140, minWidth: 140 }}>
              {data.map((item, index) => {
                const percentage = getPercentage(item.value);
                return (
                  <Flex key={item.key} align="center" gap="2">
                    <Box
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        background: colors[index],
                        flexShrink: 0,
                      }}
                    />
                    <Text size="2" style={{ color: 'var(--gray-12)' }}>
                      {item.key} - {percentage}%
                    </Text>
                  </Flex>
                );
              })}
            </Flex>

            {tooltip && (
              <Box
                style={{
                  position: 'absolute',
                  left: tooltip.x,
                  top: tooltip.y,
                  pointerEvents: 'none',
                  backgroundColor: 'var(--color-panel-solid)',
                  color: 'var(--gray-12)',
                  padding: '6px 8px',
                  borderRadius: 8,
                  fontSize: 12,
                  lineHeight: 1.2,
                  boxShadow: '0 6px 18px rgba(0, 0, 0, 0.2)',
                  border: '1px solid var(--gray-6)',
                  zIndex: 2,
                }}
              >
                <Text size="1" style={{ color: 'inherit', fontWeight: 600 }}>
                  {tooltip.label}
                </Text>
                <Text size="1" style={{ color: 'inherit', display: 'block' }}>
                  {tooltip.percentage}%
                </Text>
              </Box>
            )}
          </Flex>
        )}
      </Flex>
    </Box>
  );
}
