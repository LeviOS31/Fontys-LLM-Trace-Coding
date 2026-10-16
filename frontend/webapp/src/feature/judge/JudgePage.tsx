import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router';
import { Box, Flex, Text } from '@radix-ui/themes';
import { Gavel } from 'lucide-react';
import { BASE_URL } from '../../shared/api/api';
import JudgeOverview from './components/JudgeOverview';
import JudgeRunDetails from './components/JudgeRunDetails';
import RunJudgePanel from './components/JudgeRunPanel';
import {
  isJudgeResponse,
  type JudgeRun,
  type JudgeTemplate,
  type RunError,
} from './hooks/judgeUtils';

type PageParams = { id: string; versionId: string };

export default function JudgePage() {
  const { id: projectId, versionId } = useParams<PageParams>();

  const [templates, setTemplates] = useState<JudgeTemplate[]>([]);
  const [templateId, setTemplateId] = useState('');

  // The backend does not store judge runs, so they only live in this state
  // and are lost on reload.
  const [runs, setRuns] = useState<JudgeRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<RunError | null>(null);

  useEffect(() => {
    if (!projectId || !versionId) return;
    fetch(new URL(`/v1/projects/${projectId}/versions/${versionId}/judge-templates`, BASE_URL))
      .then((r) => r.json())
      .then((d: { judgeTemplates: JudgeTemplate[] }) =>
        setTemplates(d.judgeTemplates.filter((t) => !t.isDeprecated))
      );
  }, [projectId, versionId]);

  const selectedTemplate = templates.find((t) => t.id === templateId);
  const selectedRun = runs.find((r) => r.judgeRunId === selectedRunId) ?? null;

  if (!projectId || !versionId) return <Navigate to="/404" replace />;

  const runJudge = async () => {
    if (!selectedTemplate) return;
    setLoading(true);
    setError(null);
    try {
      const url = new URL(
        `/v1/projects/${projectId}/versions/${versionId}/axial-codes/${selectedTemplate.axialCodeId}/judge`,
        BASE_URL
      );
      const res = await fetch(url.toString(), { method: 'POST' });
      const data = await res.json();

      if (res.ok && isJudgeResponse(data)) {
        const run: JudgeRun = {
          ...data,
          axialCodeId: selectedTemplate.axialCodeId,
          templateName: selectedTemplate.name,
          createdAt: new Date().toISOString(),
        };
        setRuns((prev) => [run, ...prev]);
        setSelectedRunId(run.judgeRunId);
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
      setLoading(false);
    }
  };

  return (
    <Flex direction="column" gap="4">
      {/* Page header */}
      <Flex align="start" justify="between">
        <Box>
          <Flex align="center" gap="2">
            <Gavel size={20} />
            <Text size="6" weight="bold">
              Judge
            </Text>
          </Flex>
          <Text as="p" size="2" mt="1" color="gray" ml="6" style={{ maxWidth: 720 }}>
            Run the judge on an axial code and review the results of runs from this session.
          </Text>
        </Box>
      </Flex>

      <RunJudgePanel
        templates={templates}
        templateId={templateId}
        onTemplateChange={setTemplateId}
        onRun={runJudge}
        canRun={!loading && Boolean(selectedTemplate)}
        loading={loading}
        error={error}
      />

      {selectedRun ? (
        <JudgeRunDetails run={selectedRun} onBack={() => setSelectedRunId(null)} />
      ) : (
        <JudgeOverview runs={runs} onSelect={setSelectedRunId} />
      )}
    </Flex>
  );
}
