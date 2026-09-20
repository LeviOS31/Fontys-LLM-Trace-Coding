import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Flex, IconButton, Kbd, ScrollArea, Spinner, Text } from '@radix-ui/themes';
import { PanelLeftClose, PanelLeftOpen, Upload } from 'lucide-react';
import { useLocation, useMatch, useNavigate, useSearchParams } from 'react-router';
import type { TraceGroupSummaryItem } from '../../../../shared/types/trace.ts';
import { isTyping } from '../../../../shared/util/shortcutHelpers.ts';
import { useTraceGroupSummaryList } from '../../../traces/hooks/useTraceGroupSummaryList.ts';
import ImportTraceCollectionModal from '../../../traces/components/ImportTraceCollectionModal.tsx';
import { useUpdateSearchParam } from '../../hooks/useUpdateSearchParam.ts';
import TraceSidebarFilters from './TraceSidebarFilters.tsx';
import TraceSidebarItem from './TraceSidebarItem.tsx';
import TraceSidebarTraceList from './TraceSidebarTraceList.tsx';

interface Props {
  readonly projectId: string;
  readonly projectVersionId: string;
}

const EXPANDED_WIDTH = 320;
const COLLAPSED_WIDTH = 44;

export default function TraceSidebar({ projectId, projectVersionId }: Readonly<Props>) {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // The active group comes from the child route, so it is read from the match
  // rather than from useParams (which only sees this layout route's params).
  const groupMatch = useMatch('/projects/:id/versions/:versionId/open-code/:traceGroupId');
  const activeTraceGroupId = groupMatch?.params.traceGroupId ?? null;

  // ─── Filters (mirrored into the URL so they survive a reload) ─────────────
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [collectionFilter, setCollectionFilter] = useState(
    searchParams.get('traceCollection') ?? 'All'
  );
  const [hasNoOpenCode, setHasNoOpenCode] = useState(searchParams.get('hasNoOpenCode') === 'true');

  const updateSearchParam = useUpdateSearchParam();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      updateSearchParam('q', search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, updateSearchParam]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useTraceGroupSummaryList(
      projectId,
      projectVersionId,
      debouncedSearch,
      hasNoOpenCode,
      collectionFilter
    );

  const groups: TraceGroupSummaryItem[] = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  );

  const totalCount = data?.pages[0]?.totalCount ?? 0;

  const activeTraceId = searchParams.get('traceId');

  // Selecting a group without naming a trace clears the previous group's trace,
  // which would otherwise linger in the URL pointing at a trace of another group.
  const openTraceGroup = useCallback(
    (traceGroupId: string, traceId?: string) => {
      const params = new URLSearchParams(location.search);
      if (traceId) {
        params.set('traceId', traceId);
      } else {
        params.delete('traceId');
      }

      navigate({
        pathname: `/projects/${projectId}/versions/${projectVersionId}/open-code/${traceGroupId}`,
        search: params.toString(),
      });
    },
    [navigate, projectId, projectVersionId, location.search]
  );

  // The active group is expanded by default; the map only holds the groups the
  // user has explicitly toggled, so no effect is needed to keep it in sync.
  const [expansionOverrides, setExpansionOverrides] = useState<Record<string, boolean>>({});

  const isGroupExpanded = useCallback(
    (traceGroupId: string) =>
      expansionOverrides[traceGroupId] ?? traceGroupId === activeTraceGroupId,
    [expansionOverrides, activeTraceGroupId]
  );

  const toggleGroup = useCallback(
    (traceGroupId: string) => {
      setExpansionOverrides((previous) => ({
        ...previous,
        [traceGroupId]: !(previous[traceGroupId] ?? traceGroupId === activeTraceGroupId),
      }));
    },
    [activeTraceGroupId]
  );

  // ─── Infinite scroll ──────────────────────────────────────────────────────
  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const fetchStateRef = useRef({ hasNextPage, isFetchingNextPage });

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
  }, [onSentinel, isCollapsed]);

  // Keep the active group in view when it changes (e.g. arrow key navigation).
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!activeTraceGroupId || isCollapsed) return;
    itemRefs.current[activeTraceGroupId]?.scrollIntoView({ block: 'nearest' });
  }, [activeTraceGroupId, isCollapsed, groups.length]);

  const activeIndex = useMemo(
    () => groups.findIndex((group) => group.traceGroupId === activeTraceGroupId),
    [groups, activeTraceGroupId]
  );

  // Fetch ahead so the next group is loaded before the user reaches the end of
  // the list (and until the active group itself has been loaded).
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    if (activeTraceGroupId && (activeIndex === -1 || activeIndex >= groups.length - 2)) {
      fetchNextPage();
    }
  }, [
    activeIndex,
    activeTraceGroupId,
    groups.length,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ]);

  // ─── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isTyping()) return;

      // I → import, T → toggle the sidebar
      if (e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setIsImportModalOpen(true);
        return;
      }

      if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        setIsCollapsed((collapsed) => !collapsed);
        return;
      }

      // ← / → move between trace groups
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (groups.length === 0) return;

      e.preventDefault();
      const nextIndex = e.key === 'ArrowRight' ? activeIndex + 1 : activeIndex - 1;
      const nextGroup = groups[nextIndex];
      if (nextGroup) openTraceGroup(nextGroup.traceGroupId);
    };

    globalThis.addEventListener('keydown', handleKey);
    return () => globalThis.removeEventListener('keydown', handleKey);
  }, [activeIndex, groups, openTraceGroup]);

  const width = isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  return (
    <>
      <Box
        asChild
        style={{
          width,
          flexShrink: 0,
          height: '100%',
          borderRight: '1px solid var(--gray-a5)',
          backgroundColor: 'var(--gray-a2)',
          overflow: 'hidden',
          transition: 'width 0.2s ease',
        }}
      >
        <aside aria-label="Traces">
          <Flex direction="column" style={{ height: '100%', minHeight: 0, width }}>
            {isCollapsed ? (
              <Flex justify="center" pt="3">
                <IconButton
                  variant="ghost"
                  color="gray"
                  size="1"
                  onClick={() => setIsCollapsed(false)}
                  aria-label="Expand trace list"
                >
                  <PanelLeftOpen size={16} />
                </IconButton>
              </Flex>
            ) : (
              <>
                <Flex direction="column" gap="2" p="3" style={{ flexShrink: 0 }}>
                  <Flex align="center" justify="between" gap="2">
                    <Flex align="baseline" gap="2" style={{ minWidth: 0 }}>
                      <Text size="3" weight="bold">
                        Traces
                      </Text>
                      {!isLoading && !isError && (
                        <Text size="1" color="gray">
                          {totalCount} group{totalCount === 1 ? '' : 's'}
                        </Text>
                      )}
                    </Flex>
                    <IconButton
                      variant="ghost"
                      color="gray"
                      size="1"
                      onClick={() => setIsCollapsed(true)}
                      aria-label="Collapse trace list"
                    >
                      <PanelLeftClose size={16} />
                    </IconButton>
                  </Flex>

                  <Button
                    variant="soft"
                    onClick={() => setIsImportModalOpen(true)}
                    disabled={isLoading}
                  >
                    <Upload size={16} /> Import trace collection{' '}
                    <Kbd size="1" style={{ opacity: 0.6 }}>
                      I
                    </Kbd>
                  </Button>
                </Flex>

                <TraceSidebarFilters
                  projectId={projectId}
                  versionId={projectVersionId}
                  search={search}
                  setSearch={setSearch}
                  collectionFilter={collectionFilter}
                  setCollectionFilter={setCollectionFilter}
                  hasNoOpenCode={hasNoOpenCode}
                  setHasNoOpenCode={setHasNoOpenCode}
                  setSearchParams={updateSearchParam}
                />

                <Box ref={listContainerRef} style={{ flex: 1, minHeight: 0 }}>
                  <ScrollArea type="hover" scrollbars="vertical" style={{ height: '100%' }}>
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
                        <Text size="2" color="gray" align="center">
                          No trace groups found.
                        </Text>
                      </Flex>
                    )}

                    {groups.map((group) => (
                      <Box
                        key={group.traceGroupId}
                        ref={(el) => {
                          itemRefs.current[group.traceGroupId] = el;
                        }}
                      >
                        <TraceSidebarItem
                          group={group}
                          isActive={group.traceGroupId === activeTraceGroupId}
                          isExpanded={isGroupExpanded(group.traceGroupId)}
                          onClick={() => openTraceGroup(group.traceGroupId)}
                          onToggleExpand={() => toggleGroup(group.traceGroupId)}
                        >
                          {isGroupExpanded(group.traceGroupId) && (
                            <TraceSidebarTraceList
                              projectId={projectId}
                              projectVersionId={projectVersionId}
                              traceGroupId={group.traceGroupId}
                              activeTraceId={activeTraceId}
                              isActiveGroup={group.traceGroupId === activeTraceGroupId}
                              onSelectTrace={(traceId) =>
                                openTraceGroup(group.traceGroupId, traceId)
                              }
                            />
                          )}
                        </TraceSidebarItem>
                      </Box>
                    ))}

                    {/* Infinite scroll sentinel */}
                    <Box ref={sentinelRef} style={{ height: 5 }} />

                    {isFetchingNextPage && (
                      <Flex align="center" justify="center" p="3">
                        <Spinner size="1" />
                      </Flex>
                    )}
                  </ScrollArea>
                </Box>
              </>
            )}
          </Flex>
        </aside>
      </Box>

      <ImportTraceCollectionModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        projectVersionId={projectVersionId}
        projectId={projectId}
      />
    </>
  );
}
