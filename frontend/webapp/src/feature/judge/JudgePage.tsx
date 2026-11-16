import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router';
import { Box, Flex, Text } from '@radix-ui/themes';
import { Gavel } from 'lucide-react';
import { BASE_URL } from '../../shared/api/api';
import JudgeCollectionOverview from './components/JudgeCollectionOverview';
import JudgeOverview from './components/JudgeOverview';
import JudgeRunDetails from './components/JudgeRunDetails';
import RunJudgePanel from './components/JudgeRunPanel';
import {
  isJudgeResponse,
  type JudgeCollection,
  type JudgeResult,
  type JudgeRunListItem,
  type JudgeRunSummary,
  type JudgeRunTotals,
  type JudgeTemplate,
  type RunError,
} from './hooks/judgeUtils';

type PageParams = { id: string; versionId: string };
type CollectionListResponse = { judgeCollections: JudgeCollection[] };
type RunListResponse = { judgeRuns: JudgeRunSummary[]; totals: JudgeRunTotals };

const PAGE_SIZE = 20;
const EMPTY_TOTALS: JudgeRunTotals = {
  runs: 0,
  totalCount: 0,
  trueCount: 0,
  falseCount: 0,
  failedCount: 0,
};

export default function JudgePage() {
  const { id: projectId, versionId } = useParams<PageParams>();

  const [templates, setTemplates] = useState<JudgeTemplate[]>([]);
  const [templateIds, setTemplateIds] = useState<string[]>([]);
  const [selectedTraceCollectionIds, setSelectedTraceCollectionIds] = useState<string[]>([]);

  const [collections, setCollections] = useState<JudgeCollection[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  const [summaries, setSummaries] = useState<JudgeRunSummary[]>([]);
  const [totals, setTotals] = useState<JudgeRunTotals>(EMPTY_TOTALS);
  const [listLoading, setListLoading] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [results, setResults] = useState<JudgeResult[] | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);

  const [running, setRunning] = useState(false);
  const [error, setError] = useState<RunError | null>(null);

  const collectionListUrl = useCallback(
    () => new URL(`/v1/projects/${projectId}/versions/${versionId}/judgecollection`, BASE_URL),
    [projectId, versionId]
  );

  const runListUrl = useCallback(
    (judgeCollectionId: string) =>
      new URL(
        `/v1/projects/${projectId}/versions/${versionId}/judgecollections/${judgeCollectionId}/judge-runs`,
        BASE_URL
      ),
    [projectId, versionId]
  );

  const runUrl = useCallback(
    (judgeCollectionId: string, judgeRunId: string) =>
      new URL(
        `/v1/projects/${projectId}/versions/${versionId}/judgecollection/${judgeCollectionId}/judge-runs/${judgeRunId}`,
        BASE_URL
      ),
    [projectId, versionId]
  );

  useEffect(() => {
    if (!projectId || !versionId) return;
    const endpoint = `${BASE_URL.replace(/\/$/, '')}/v1/projects/${projectId}/versions/${versionId}/judge-templates`;
    fetch(endpoint)
      .then((r) => r.json())
      .then((d: { judgeTemplates: JudgeTemplate[] }) => setTemplates(d.judgeTemplates));
  }, [projectId, versionId]);

  const loadCollections = useCallback(
    async (signal?: AbortSignal) => {
      if (!projectId || !versionId) return;
      setCollectionsLoading(true);
      try {
        const res = await fetch(collectionListUrl(), { signal });
        if (!res.ok) throw new Error(`Failed to load collections (${res.status})`);
        const data: CollectionListResponse = await res.json();
        setCollections(
          [...data.judgeCollections].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError({ message: 'Could not load judge collections.', raw: String(err) });
        }
      } finally {
        if (!signal?.aborted) setCollectionsLoading(false);
      }
    },
    [projectId, versionId, collectionListUrl]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadCollections(controller.signal);
    return () => controller.abort();
  }, [loadCollections]);

  const loadRuns = useCallback(
    async (judgeCollectionId: string, offset = 0, signal?: AbortSignal) => {
      setListLoading(true);
      try {
        const url = runListUrl(judgeCollectionId);
        url.searchParams.set('limit', String(PAGE_SIZE));
        url.searchParams.set('offset', String(offset));
        const res = await fetch(url, { signal });
        if (!res.ok) throw new Error(`Failed to load runs (${res.status})`);
        const data: RunListResponse = await res.json();
        setSummaries((prev) => (offset === 0 ? data.judgeRuns : [...prev, ...data.judgeRuns]));
        setTotals(data.totals);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError({ message: 'Could not load judge runs.', raw: String(err) });
        }
      } finally {
        if (!signal?.aborted) setListLoading(false);
      }
    },
    [runListUrl]
  );

  useEffect(() => {
    setSummaries([]);
    setTotals(EMPTY_TOTALS);
    setSelectedRunId(null);
    if (!selectedCollectionId) return;

    const controller = new AbortController();
    loadRuns(selectedCollectionId, 0, controller.signal);
    return () => controller.abort();
  }, [selectedCollectionId, loadRuns]);

  useEffect(() => {
    if (!selectedRunId || !selectedCollectionId) {
      setResults(null);
      return;
    }
    const controller = new AbortController();
    setResults(null);
    setResultsLoading(true);
    fetch(runUrl(selectedCollectionId, selectedRunId), { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to load run (${res.status})`);
        const data: { results: JudgeResult[] } = await res.json();
        setResults(data.results);
      })
      .catch((err) => {
        if ((err as Error).name !== 'AbortError') {
          setError({ message: 'Could not load the run.', raw: String(err) });
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setResultsLoading(false);
      });
    return () => controller.abort();
  }, [selectedRunId, selectedCollectionId, runUrl]);

  const activeTemplates = useMemo(() => templates.filter((t) => !t.isDeprecated), [templates]);
  const selectedCollection =
    collections.find((collection) => collection.judgeCollectionId === selectedCollectionId) ?? null;
  const runs: JudgeRunListItem[] = summaries;
  const selectedRun = runs.find((run) => run.judgeRunId === selectedRunId) ?? null;
  const hasMore = summaries.length < totals.runs;
  const selectedTemplates = activeTemplates.filter((template) => templateIds.includes(template.id));

  if (!projectId || !versionId) return <Navigate to="/404" replace />;

  const runJudge = async () => {
    if (selectedTemplates.length === 0 || selectedTraceCollectionIds.length === 0) return;
    setRunning(true);
    setError(null);
    try {
      const url = new URL(`/v1/projects/${projectId}/versions/${versionId}/judge`, BASE_URL);
      const res = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          judgeTemplateIds: selectedTemplates.map((template) => template.id),
          traceCollectionIds: selectedTraceCollectionIds,
        }),
      });
      const data: unknown = await res.json();

      if (res.ok && isJudgeResponse(data)) {
        await loadCollections();
        setSelectedRunId(null);
        setSelectedCollectionId(data.judgeCollectionId);
      } else {
        setError({
          message: res.ok
            ? 'The judge returned an unexpected response.'
            : `Request failed (${res.status}).`,
          raw: JSON.stringify(data, null, 2),
        });
      }
    } catch (err) {
      setError({ message: 'Request failed.', raw: String(err) });
    } finally {
      setRunning(false);
    }
  };

  const deleteRun = async (judgeRunId: string) => {
    if (!selectedCollectionId) return;
    setError(null);
    try {
      const res = await fetch(runUrl(selectedCollectionId, judgeRunId), { method: 'DELETE' });
      if (!res.ok) {
        setError({ message: `Could not delete run (${res.status}).`, raw: await res.text() });
        return;
      }
      setSelectedRunId(null);
      await loadRuns(selectedCollectionId, 0);
    } catch (err) {
      setError({ message: 'Could not delete run.', raw: String(err) });
    }
  };

  return (
    <Flex direction="column" gap="4">
      <Flex align="start" justify="between">
        <Box>
          <Flex align="center" gap="2">
            <Gavel size={20} />
            <Text size="6" weight="bold">
              Judge
            </Text>
          </Flex>
          <Text as="p" size="2" mt="1" color="gray" ml="6" style={{ maxWidth: 720 }}>
            Run the judge on selected traces and review results by collection and run.
          </Text>
        </Box>
      </Flex>

      <RunJudgePanel
        templates={activeTemplates}
        onTemplateChange={setTemplateIds}
        projectId={projectId}
        versionId={versionId}
        onCollectionChange={setSelectedTraceCollectionIds}
        onRun={runJudge}
        canRun={!running && selectedTemplates.length > 0 && selectedTraceCollectionIds.length > 0}
        loading={running}
        error={error}
      />

      {selectedRun && selectedCollection ? (
        <JudgeRunDetails
          run={selectedRun}
          results={results}
          resultsLoading={resultsLoading}
          onBack={() => setSelectedRunId(null)}
          onDelete={() => deleteRun(selectedRun.judgeRunId)}
        />
      ) : selectedCollection ? (
        <JudgeOverview
          collectionName={selectedCollection.name}
          runs={runs}
          totals={totals}
          hasMore={hasMore}
          loading={listLoading}
          onBack={() => setSelectedCollectionId(null)}
          onLoadMore={() => loadRuns(selectedCollection.judgeCollectionId, summaries.length)}
          onSelect={setSelectedRunId}
        />
      ) : (
        <JudgeCollectionOverview
          collections={collections}
          loading={collectionsLoading}
          onSelect={(judgeCollectionId) => {
            setError(null);
            setSelectedCollectionId(judgeCollectionId);
          }}
        />
      )}
    </Flex>
  );
}
