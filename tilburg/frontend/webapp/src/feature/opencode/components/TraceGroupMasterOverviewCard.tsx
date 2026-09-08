import { useEffect, useState, useMemo, useCallback } from 'react';
import { Box, Button, Flex, Kbd } from '@radix-ui/themes';
import { Upload } from 'lucide-react';
import type { TraceGroupSummaryItem } from '../../../shared/types/trace.ts';
import { isTyping } from '../../../shared/util/shortcutHelpers.ts';
import { useTraceGroupSummaryList } from '../../traces/hooks/useTraceGroupSummaryList.ts';
import ImportTraceCollectionModal from '../../traces/components/ImportTraceCollectionModal.tsx';
import TraceGroupMasterPanel from '../../traces/components/TraceOverview/TraceGroupMasterPanel.tsx';
import TraceFilterBar from '../../traces/components/TraceOverview/TraceFilterBar.tsx';
import { useNavigate, useParams, useSearchParams } from 'react-router';

interface Props {
  readonly projectId: string;
  readonly projectVersionId: string;
}

export default function TraceGroupMasterOverviewCard({
  projectId,
  projectVersionId,
}: Readonly<Props>) {
  const [focusedIndex, setFocusedIndex] = useState<number>(-1); // <-- Tracks keyboard focus
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // URL Parameters
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  const [collectionFilter, setCollectionFilter] = useState(
    searchParams.get('traceCollection') ?? 'All'
  );

  const [hasNoOpenCode, setHasNoOpenCode] = useState(searchParams.get('hasNoOpenCode') === 'true');

  const { id, versionId } = useParams<{ id: string; versionId: string }>();
  const navigate = useNavigate();

  const updateSearchParam = useCallback(
    (key: string, value: string | boolean | null) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);

          if (value === null || value === '' || value === false) {
            params.delete(key);
          } else {
            params.set(key, String(value));
          }
          return params;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );
  // ─── Search Debounce ──────────────────────────────────────────────────────
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

  const groups: TraceGroupSummaryItem[] = useMemo(() => {
    return data?.pages.flatMap((p) => p.items) ?? [];
  }, [data]); // Only re-calculate if 'data' changes

  // ─── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isTyping()) return;

      // Arrow Down
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev < groups.length - 1 ? prev + 1 : prev));
        return;
      }

      // Arrow Up
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        return;
      }

      // Enter -> Select the currently focused item
      if (e.key === 'Enter') {
        if (focusedIndex >= 0 && groups[focusedIndex]) {
          e.preventDefault();
          navigate(
            `/projects/${id}/versions/${versionId}/open-code/${groups[focusedIndex].traceGroupId}`
          );
        }
        return;
      }

      // I → Open Import Modal
      if (e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setIsImportModalOpen(true);
      }
    };

    globalThis.addEventListener('keydown', handleKey);
    // Note: added groups and focusedIndex so the Enter key closure has the latest data
    return () => globalThis.removeEventListener('keydown', handleKey);
  }, [groups, focusedIndex, id, navigate, versionId]);

  return (
    <Box>
      <Flex direction="column">
        {/* Row 1: Title & Buttons */}
        <Flex
          direction={{ initial: 'column', sm: 'row' }}
          align={{ initial: 'start', sm: 'center' }}
          justify="between"
          width="100%"
          mb="2"
        >
          <Box>
            {/* Row 2: Filters */}
            <TraceFilterBar
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
          </Box>

          <Flex gap="3" wrap="wrap">
            <Button
              variant="soft"
              onClick={() => setIsImportModalOpen(true)}
              disabled={isLoading || !data}
            >
              <Upload size={16} /> Import trace collection{' '}
              <Kbd size="1" style={{ opacity: 0.6 }}>
                I
              </Kbd>
            </Button>
          </Flex>
        </Flex>

        <Box style={{ marginInline: '-16px', borderBottom: '1px solid var(--gray-a5)' }} />

        {/* Row 3: Master-Detail */}
        <TraceGroupMasterPanel
          groups={groups}
          focusedIndex={focusedIndex}
          isLoading={isLoading}
          isError={isError}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
        />
      </Flex>

      <ImportTraceCollectionModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        projectVersionId={projectVersionId}
        projectId={projectId}
      />
    </Box>
  );
}
