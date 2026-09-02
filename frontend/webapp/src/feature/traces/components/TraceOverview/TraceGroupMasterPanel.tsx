import { useCallback, useEffect, useRef } from 'react';
import { Box, Flex, Spinner, Text } from '@radix-ui/themes';
import type { TraceGroupSummaryItem } from '../../../../shared/types/trace.ts';
import TraceGroupListItem from './TraceGroupListItem.tsx';
import { useNavigate, useParams } from 'react-router';

interface Props {
  readonly groups: readonly TraceGroupSummaryItem[];
  readonly focusedIndex: number;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly hasNextPage: boolean;
  readonly isFetchingNextPage: boolean;
  readonly fetchNextPage: () => void;
}

export default function TraceGroupMasterPanel({
  groups,
  focusedIndex,
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: Props) {
  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const fetchStateRef = useRef({ hasNextPage, isFetchingNextPage });
  const { id, versionId } = useParams<{ id: string; versionId: string }>();
  const navigate = useNavigate();

  // Keep the ref updated on every render
  useEffect(() => {
    fetchStateRef.current = { hasNextPage, isFetchingNextPage };
  }, [hasNextPage, isFetchingNextPage]);

  const onSentinel = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      if (!entry) return;

      const { hasNextPage: hasNext, isFetchingNextPage: isFetching } = fetchStateRef.current;

      if (entry.isIntersecting && hasNext && !isFetching) {
        fetchNextPage();
      }
    },
    [fetchNextPage]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const container = listContainerRef.current;
    if (!sentinel || !container) return;

    const viewport = container.querySelector('[data-radix-scroll-area-viewport]');
    if (!viewport) return;

    const observer = new IntersectionObserver(onSentinel, {
      root: viewport,
      threshold: 0,
      rootMargin: '0px 0px 120px 0px',
    });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [onSentinel]);

  useEffect(() => {
    if (focusedIndex < 0) return;

    const el = itemRefs.current[focusedIndex];
    if (el) {
      el.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [focusedIndex]);

  return (
    <Box ref={listContainerRef} style={{ width: '100%', height: '100%' }}>
      <Flex direction="column" pt="2">
        {isLoading && (
          <Flex align="center" justify="center" p="6">
            <Spinner size="2" />
          </Flex>
        )}

        {isError && (
          <Flex align="center" justify="center" p="6">
            <Text size="2" color="red">
              Failed to load traces.
            </Text>
          </Flex>
        )}

        {!isLoading && !isError && groups.length === 0 && (
          <Flex align="center" justify="center" p="6">
            <Text size="2" color="gray">
              No trace groups found.
            </Text>
          </Flex>
        )}

        {groups.map((group, i) => (
          <Box
            key={group.traceGroupId}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
          >
            <TraceGroupListItem
              trace={group}
              isFocused={i === focusedIndex}
              onClick={() => {
                navigate(`/projects/${id}/versions/${versionId}/open-code/${group.traceGroupId}`);
              }}
            />
          </Box>
        ))}

        {/* Infinite scroll sentinel */}
        <Box ref={sentinelRef} style={{ height: 5 }} />

        {isFetchingNextPage && (
          <Flex align="center" justify="center" p="3">
            <Spinner size="1" />
          </Flex>
        )}
      </Flex>
    </Box>
  );
}
