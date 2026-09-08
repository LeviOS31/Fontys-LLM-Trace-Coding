import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Badge, Button, Flex, IconButton, Spinner } from '@radix-ui/themes';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { isTyping } from '../../../shared/util/shortcutHelpers.ts';
import type { TraceGroupSummaryItem } from '../../../shared/types/trace.ts';
import { useTraceGroupSummaryList } from '../../traces/hooks/useTraceGroupSummaryList.ts';

interface Props {
  readonly projectId: string;
  readonly versionId: string;
  readonly activeTraceGroupId: string;
}

export function TraceGroupNavBar({ projectId, versionId, activeTraceGroupId }: Props) {
  const navigate = useNavigate();
  const stripRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useTraceGroupSummaryList(projectId, versionId, '', false);

  const groups: TraceGroupSummaryItem[] = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data]
  );

  const activeIndex = useMemo(
    () => groups.findIndex((g) => g.traceGroupId === activeTraceGroupId),
    [groups, activeTraceGroupId]
  );

  // Fetch ahead so the next group is available before the user reaches the end
  // of the loaded pages (and until the active group itself is loaded).
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    if (activeIndex === -1 || activeIndex >= groups.length - 2) {
      fetchNextPage();
    }
  }, [activeIndex, groups.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Keep the active group visible when navigation occurs. Scrolls only the
  // strip itself (scrollIntoView would also scroll ancestors and can make the
  // bar appear to jump), and only as far as needed to reveal the active item.
  useEffect(() => {
    const strip = stripRef.current;
    const item = itemRefs.current[activeTraceGroupId];
    if (!strip || !item) return;

    const stripRect = strip.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    const itemLeft = itemRect.left - stripRect.left + strip.scrollLeft;
    const itemRight = itemLeft + itemRect.width;

    if (itemLeft < strip.scrollLeft) {
      strip.scrollTo({ left: itemLeft, behavior: 'smooth' });
    } else if (itemRight > strip.scrollLeft + strip.clientWidth) {
      strip.scrollTo({ left: itemRight - strip.clientWidth, behavior: 'smooth' });
    }
  }, [activeTraceGroupId, activeIndex]);

  const goToIndex = useCallback(
    (index: number) => {
      const group = groups[index];
      if (!group) return;
      navigate(`/projects/${projectId}/versions/${versionId}/open-code/${group.traceGroupId}`);
    },
    [groups, navigate, projectId, versionId]
  );

  const canGoPrevious = activeIndex > 0;
  const canGoNext = activeIndex !== -1 && activeIndex < groups.length - 1;

  // ─── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isTyping()) return;

      if (e.key === 'ArrowLeft' && canGoPrevious) {
        e.preventDefault();
        goToIndex(activeIndex - 1);
      } else if (e.key === 'ArrowRight' && canGoNext) {
        e.preventDefault();
        goToIndex(activeIndex + 1);
      }
    };

    globalThis.addEventListener('keydown', handleKey);
    return () => globalThis.removeEventListener('keydown', handleKey);
  }, [activeIndex, canGoPrevious, canGoNext, goToIndex]);

  if (isLoading || isError || groups.length === 0) return null;

  return (
    <nav aria-label="Trace groups">
      <Flex align="center" gap="2" width="100%" minWidth="0">
        <IconButton
          variant="ghost"
          color="gray"
          size="1"
          disabled={!canGoPrevious}
          aria-label="Previous trace group"
          onClick={() => goToIndex(activeIndex - 1)}
        >
          <ChevronLeft size={16} />
        </IconButton>

        <Flex
          ref={stripRef}
          align="center"
          gap="2"
          flexGrow="1"
          minWidth="0"
          style={{ overflowX: 'auto', scrollbarWidth: 'none' }}
        >
          {groups.map((group) => {
            const isActive = group.traceGroupId === activeTraceGroupId;

            return (
              <Button
                key={group.traceGroupId}
                ref={(el) => {
                  itemRefs.current[group.traceGroupId] = el;
                }}
                size="1"
                variant={isActive ? 'soft' : 'ghost'}
                color={isActive ? undefined : 'gray'}
                aria-current={isActive ? 'page' : undefined}
                onClick={() =>
                  navigate(
                    `/projects/${projectId}/versions/${versionId}/open-code/${group.traceGroupId}`
                  )
                }
                style={{ flexShrink: 0, maxWidth: 280 }}
              >
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    minWidth: 0,
                  }}
                >
                  {group.groupTitle}
                </span>
                {group.traceCount > 0 && (
                  <Badge radius="full" color="green" style={{ flexShrink: 0 }}>
                    {group.traceCount}
                  </Badge>
                )}
              </Button>
            );
          })}

          {isFetchingNextPage && <Spinner size="1" style={{ flexShrink: 0 }} />}
        </Flex>

        <IconButton
          variant="ghost"
          color="gray"
          size="1"
          disabled={!canGoNext}
          aria-label="Next trace group"
          onClick={() => goToIndex(activeIndex + 1)}
        >
          <ChevronRight size={16} />
        </IconButton>
      </Flex>
    </nav>
  );
}
