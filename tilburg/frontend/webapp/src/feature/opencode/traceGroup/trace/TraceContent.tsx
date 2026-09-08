import { Badge, Flex, Text, Separator, Code, DataList, Heading } from '@radix-ui/themes';
import type { TraceDetailView } from '../../../../shared/types/trace';
import { getSpanCategory } from './getSpanCategory';
import { buildSpanTree, flattenSpanTree } from './spanTree';
import { TraceAxialCodeBadge } from '../../components/TraceAxialCodeBadge';

type Props = {
  trace: TraceDetailView;
  projectId: string;
  versionId: string;
};

const formatNanoTimestamp = (nano: number) => {
  const ns = BigInt(nano);
  const ms = ns / BigInt(1_000_000);
  const nanosPart = (ns % BigInt(1_000_000_000)).toString().padStart(9, '0');
  const date = new Date(Number(ms));
  const iso = date.toISOString().replace('T', ' ').replace('Z', '');
  return `${iso.slice(0, 19)}.${nanosPart}`;
};

const isHiddenKey = (key: string) =>
  /^gen_ai\.(prompt|completion)\.\d+\..+$/.test(key) || key === 'traceloop.entity.input';

export function TraceContent({ trace, projectId, versionId }: Readonly<Props>) {
  return (
    <Flex direction="column" gap="5" p="4">
      <Flex direction="column" gap="2">
        <Flex align="center" gap="3" wrap="wrap">
          <Heading>Trace</Heading>
          <TraceAxialCodeBadge trace={trace} projectId={projectId} versionId={versionId} />
        </Flex>

        {/* Trace ID */}
        <Text size="2" color="gray">
          Trace ID: <Code size="1">{trace.traceId}</Code>
        </Text>

        {/* Resources */}
        <DataList.Root size="1">
          {trace.traceResources.map((resource) => (
            <DataList.Item key={resource.key} align="center">
              <DataList.Label minWidth="120px">
                <Text size="1" weight="medium" color="gray">
                  {resource.key.toUpperCase()}
                </Text>
              </DataList.Label>
              <DataList.Value>
                <Text size="1">{resource.value}</Text>
              </DataList.Value>
            </DataList.Item>
          ))}
        </DataList.Root>
      </Flex>

      <Separator size="4" />

      {/* Spans */}
      <Flex direction="column" gap="5">
        {trace.traceScopes.flatMap((scope) =>
          flattenSpanTree(buildSpanTree(scope.spans)).map((span) => {
            const { label, color, Icon } = getSpanCategory(span);
            return (
              <Flex
                key={span.traceScopeSpanId}
                direction="column"
                gap="3"
                data-span-id={span.traceScopeSpanId}
              >
                {/* Span header */}
                <Flex align="center" gap="2">
                  <Badge size="1" variant="soft" color={color}>
                    <Flex align="center" gap="1">
                      <Icon size={10} />
                      {label}
                    </Flex>
                  </Badge>
                  <Text size="2" weight="medium">
                    {span.name.toUpperCase()}
                  </Text>
                </Flex>

                {/* Timing */}
                <Flex direction="column" gap="2">
                  <Text size="1" weight="bold" color="gray">
                    TIMING
                  </Text>
                  <DataList.Root size="1">
                    <DataList.Item align="center">
                      <DataList.Label minWidth="80px">
                        <Text size="1">Start</Text>
                      </DataList.Label>
                      <DataList.Value>
                        <Code size="1" variant="ghost">
                          {formatNanoTimestamp(span.startTimeUnixNano)}
                        </Code>
                      </DataList.Value>
                    </DataList.Item>
                    <DataList.Item align="center">
                      <DataList.Label minWidth="80px">
                        <Text size="1">End</Text>
                      </DataList.Label>
                      <DataList.Value>
                        <Code size="1" variant="ghost">
                          {formatNanoTimestamp(span.endTimeUnixNano)}
                        </Code>
                      </DataList.Value>
                    </DataList.Item>
                    <DataList.Item align="center">
                      <DataList.Label minWidth="80px">
                        <Text size="1">Duration</Text>
                      </DataList.Label>
                      <DataList.Value>
                        <Badge size="1" variant="soft" color="green">
                          {(
                            (BigInt(span.endTimeUnixNano) - BigInt(span.startTimeUnixNano)) /
                            BigInt(1_000_000)
                          ).toString()}{' '}
                          ms
                        </Badge>
                      </DataList.Value>
                    </DataList.Item>
                  </DataList.Root>
                </Flex>

                {/* Attributes */}
                <Flex direction="column" gap="5">
                  {span.attributes.some((attr) => !isHiddenKey(attr.key)) && (
                    <Flex direction="column" gap="2">
                      <Text size="1" weight="bold" color="gray">
                        ATTRIBUTES
                      </Text>
                      <DataList.Root size="1">
                        {span.attributes
                          .filter((attr) => !isHiddenKey(attr.key))
                          .map((attr) => (
                            <DataList.Item key={attr.key} align="center">
                              <DataList.Label minWidth="140px">
                                <Code size="1" color="blue">
                                  {attr.key}
                                </Code>
                              </DataList.Label>
                              <DataList.Value>
                                <Text size="1" color="gray">
                                  {String(attr.value)}
                                </Text>
                              </DataList.Value>
                            </DataList.Item>
                          ))}
                      </DataList.Root>
                    </Flex>
                  )}

                  <Separator size="4" />
                </Flex>
              </Flex>
            );
          })
        )}
      </Flex>
    </Flex>
  );
}
