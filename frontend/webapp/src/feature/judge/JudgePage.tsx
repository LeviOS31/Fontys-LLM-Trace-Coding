import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router';
import { Box, Flex, Text } from '@radix-ui/themes';
import { Gavel } from 'lucide-react';
import { BASE_URL } from '../../shared/api/api';
import JudgeOverview from './components/JudgeOverview';
import JudgeRunDetails from './components/JudgeRunDetails';
import RunJudgePanel from './components/JudgeRunPanel';
import {
  isJudgeResponse,
  type JudgeResult,
  type JudgeRunListItem,
  type JudgeRunSummary,
  type JudgeRunTotals,
  type JudgeTemplate,
  type RunError,
} from './hooks/judgeUtils';

type PageParams = { id: string; versionId: string };
type ListResponse = { judgeRuns: JudgeRunSummary[]; totals: JudgeRunTotals };

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

  // All templates, including deprecated ones, so older runs can still show a name.
  const [templates, setTemplates] = useState<JudgeTemplate[]>([]);
  const [templateIds, setTemplateIds] = useState<string[]>([]);

  const [summaries, setSummaries] = useState<JudgeRunSummary[]>([]);
  const [totals, setTotals] = useState<JudgeRunTotals>(EMPTY_TOTALS);
  const [listLoading, setListLoading] = useState(false);

  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [results, setResults] = useState<JudgeResult[] | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);

  const [running, setRunning] = useState(false);
  const [error, setError] = useState<RunError | null>(null);

  const runsUrl = useCallback(
    (suffix = '') =>
      new URL(`/v1/projects/${projectId}/versions/${versionId}/judge-runs${suffix}`, BASE_URL),
    [projectId, versionId]
  );

  useEffect(() => {
    if (!projectId || !versionId) return;

    // Fixed: Construct endpoint using BASE_URL directly to prevent new URL invalid URL errors in Vitest/Happy-DOM
    const endpoint = `${BASE_URL.replace(/\/$/, '')}/v1/projects/${projectId}/versions/${versionId}/judge-templates`;

    fetch(endpoint)
      .then((r) => r.json())
      .then((d: { judgeTemplates: JudgeTemplate[] }) => setTemplates(d.judgeTemplates));
  }, [projectId, versionId]);

  // offset 0 replaces the list, a higher offset appends the next page.
  const loadRuns = useCallback(
    async (offset = 0, signal?: AbortSignal) => {
      if (!projectId || !versionId) return;
      setListLoading(true);
      try {
        const url = runsUrl();
        url.searchParams.set('limit', String(PAGE_SIZE));
        url.searchParams.set('offset', String(offset));
        const res = await fetch(url, { signal });
        if (!res.ok) throw new Error(`Failed to load runs (${res.status})`);
        const d: ListResponse = await res.json();
        setSummaries((prev) => (offset === 0 ? d.judgeRuns : [...prev, ...d.judgeRuns]));
        setTotals(d.totals);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError({ message: 'Could not load judge runs.', raw: String(err) });
        }
      } finally {
        setListLoading(false);
      }
    },
    [projectId, versionId, runsUrl]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadRuns(0, controller.signal);
    return () => controller.abort();
  }, [loadRuns]);

  // The full results are only fetched for the run that is opened.
  useEffect(() => {
    if (!selectedRunId || !projectId || !versionId) {
      setResults(null);
      return;
    }
    const controller = new AbortController();
    setResults(null);
    setResultsLoading(true);
    fetch(runsUrl(`/${selectedRunId}`), { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to load run (${res.status})`);
        const d: { results: JudgeResult[] } = await res.json();
        setResults(d.results);
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
  }, [selectedRunId, projectId, versionId, runsUrl]);

  const activeTemplates = useMemo(() => templates.filter((t) => !t.isDeprecated), [templates]);

  const runs: JudgeRunListItem[] = useMemo(
    () =>
      summaries.map((s) => ({
        ...s,
        templateName:
          (
            templates.find((t) => t.axialCodeId === s.axialCodeId && !t.isDeprecated) ??
            templates.find((t) => t.axialCodeId === s.axialCodeId)
          )?.name ?? 'Unknown template',
      })),
    [summaries, templates]
  );

  const selectedRun = runs.find((r) => r.judgeRunId === selectedRunId) ?? null;
  const hasMore = summaries.length < totals.runs;
  let selectedTemplates = activeTemplates.filter((t) => templateIds.includes(t.id));

  if (!projectId || !versionId) return <Navigate to="/404" replace />;

  const runJudge = async () => {
    selectedTemplates = activeTemplates.filter((t) => templateIds.includes(t.id));

    if (!selectedTemplates || selectedTemplates.length === 0) return;
    setRunning(true);
    setError(null);

    const axialCodeIds: string[] = [];

    selectedTemplates.forEach((template) => {
      axialCodeIds.push(template.axialCodeId);
    });

    try {
      const url = new URL(`/v1/projects/${projectId}/versions/${versionId}/judge`, BASE_URL);

      const res = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ axialCodeIds }),
      });
      const data = await res.json();

      if (res.ok && isJudgeResponse(data)) {
        await loadRuns(0);
        setSelectedRunId(data.judgeRunId);
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
    setError(null);
    try {
      const res = await fetch(runsUrl(`/${judgeRunId}`), { method: 'DELETE' });
      if (!res.ok) {
        setError({ message: `Could not delete run (${res.status}).`, raw: await res.text() });
        return;
      }
      setSelectedRunId(null);
      await loadRuns(0);
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
            Run the judge on an axial code and review earlier runs for this version.
          </Text>
        </Box>
      </Flex>

      <RunJudgePanel
        templates={activeTemplates}
        onTemplateChange={(updatedIds: string[]) => setTemplateIds(updatedIds)}
        onRun={runJudge}
        canRun={!running && Boolean(selectedTemplates.length > 0)}
        loading={running}
        error={error}
      />

      {selectedRun ? (
        <JudgeRunDetails
          run={selectedRun}
          results={results}
          resultsLoading={resultsLoading}
          onBack={() => setSelectedRunId(null)}
          onDelete={() => deleteRun(selectedRun.judgeRunId)}
        />
      ) : (
        <JudgeOverview
          runs={runs}
          totals={totals}
          hasMore={hasMore}
          loading={listLoading}
          onLoadMore={() => loadRuns(summaries.length)}
          onSelect={setSelectedRunId}
        />
      )}
    </Flex>
  );
}
