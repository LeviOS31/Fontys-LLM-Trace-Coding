import { Box, Flex, Heading, Skeleton, Text } from '@radix-ui/themes';
import { Group } from '@visx/group';
import { ParentSize } from '@visx/responsive';
import { Bar } from '@visx/shape';
import buildColors from '../../../../../shared/util/buildColors.ts';

interface DataObject {
  key: string;
  value: number;
}

interface BarChartStatsProps {
  readonly data: DataObject[];
  readonly title: string;
  readonly subtitle?: string;
  readonly loading?: boolean;
}

export default function BarChartStats({
  data,
  title,
  subtitle,
  loading = false,
}: BarChartStatsProps) {
  const maxValue = data.reduce((max, item) => Math.max(max, item.value), 0);
  const colors = buildColors(data.length);

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
        <Box mb="1">
          <Heading size="3" style={{ letterSpacing: '-0.01em' }}>
            {title}
          </Heading>
          {subtitle && (
            <Text as="p" size="1" color="gray" mt="1">
              {subtitle}
            </Text>
          )}
        </Box>

        {loading ? (
          <Flex direction="column" justify="end" style={{ height: 280 }}>
            <Flex align="end" gap="3" style={{ height: 220 }}>
              <Skeleton loading style={{ width: '20%', height: '35%', borderRadius: 6 }} />
              <Skeleton loading style={{ width: '20%', height: '55%', borderRadius: 6 }} />
              <Skeleton loading style={{ width: '20%', height: '75%', borderRadius: 6 }} />
              <Skeleton loading style={{ width: '20%', height: '45%', borderRadius: 6 }} />
            </Flex>
            <Flex gap="3" mt="3">
              <Skeleton loading style={{ width: '20%', height: 12 }} />
              <Skeleton loading style={{ width: '20%', height: 12 }} />
              <Skeleton loading style={{ width: '20%', height: 12 }} />
              <Skeleton loading style={{ width: '20%', height: 12 }} />
            </Flex>
          </Flex>
        ) : (
          <Box style={{ height: 280 }}>
            <ParentSize>
              {({ width, height }) => {
                const margin = { top: 12, right: 12, bottom: 56, left: 36 };
                const innerWidth = Math.max(0, width - margin.left - margin.right);
                const innerHeight = Math.max(0, height - margin.top - margin.bottom);
                const barGap = 12;
                const barWidth =
                  data.length > 0
                    ? Math.max(12, (innerWidth - barGap * (data.length - 1)) / data.length)
                    : 0;

                return (
                  <svg width={width} height={height}>
                    <Group left={margin.left} top={margin.top}>
                      <line
                        x1={0}
                        x2={innerWidth}
                        y1={innerHeight}
                        y2={innerHeight}
                        stroke="var(--gray-7)"
                        strokeWidth={1}
                      />

                      {data.map((item, index) => {
                        const ratio = maxValue > 0 ? item.value / maxValue : 0;
                        const barHeight = ratio * innerHeight;
                        const x = index * (barWidth + barGap);
                        const y = innerHeight - barHeight;

                        return (
                          <g key={item.key}>
                            <Bar
                              x={x}
                              y={y}
                              width={barWidth}
                              height={barHeight}
                              fill={colors[index]}
                              rx={6}
                            />

                            <text
                              x={x + barWidth / 2}
                              y={innerHeight + 16}
                              textAnchor="middle"
                              fill="var(--gray-11)"
                              fontSize={11}
                            >
                              {item.key}
                            </text>

                            <text
                              x={x + barWidth / 2}
                              y={Math.max(12, y - 6)}
                              textAnchor="middle"
                              fill="var(--gray-12)"
                              fontSize={11}
                            >
                              {item.value}
                            </text>
                          </g>
                        );
                      })}
                    </Group>
                  </svg>
                );
              }}
            </ParentSize>
          </Box>
        )}
      </Flex>
    </Box>
  );
}
