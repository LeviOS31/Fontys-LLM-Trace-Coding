import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Box, Flex, Grid, Heading, Text } from '@radix-ui/themes';
import { LayoutDashboard } from 'lucide-react';
import { Navigate, useParams } from 'react-router';
import type { CurrentAxialCodesResponse } from '../../shared/api/axialCode.ts';
import { QUERY_KEYS } from '../../shared/api/queryKeys.ts';
import type { AxialCode as ApiAxialCode } from '../../shared/types/axialCode.ts';
import type { Snapshot } from '../../shared/types/snapshot.ts';
import { GenerateAxialCodesPanel } from './components/GenerateAxailCodesPanal/GenerateAxialCodesPanel.tsx';
import InterpretationPanel from './components/InterpretationPanel/InterpretationPanel.tsx';
import { useGetCurrentAxialCodesOfVersion } from './hooks/useGetCurrentAxialCodesOfVersion.ts';
import { useGetOpenCodesByVersion } from './hooks/useGetOpenCodesByVersion.ts';
import { useSaveAxialCodingResults } from './hooks/useSaveAxialCodingResults.ts';
import SnapshotSummaryCard from './components/SnapshotSummaryCard.tsx';
import SnapshotTreemapSection from '../../shared/components/SnapshotTreemap.tsx';
import AxialCodeList from './components/AxialCodeList.tsx';
import { convertApiCodesToSnapshot } from '../../shared/util/convertApiCodesToSnapshot.ts';
import './AxialCodePage.module.css';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type PageParams = {
  id: string;
  versionId: string;
};

function SectionHead({ title, subtitle }: { readonly title: string; readonly subtitle?: string }) {
  return (
    <Box mb="3">
      <Heading size="3" style={{ letterSpacing: '-0.01em' }}>
        {title}
      </Heading>
      {subtitle && (
        <Text as="p" size="2" color="gray" mt="1" style={{ maxWidth: 600 }}>
          {subtitle}
        </Text>
      )}
    </Box>
  );
}

export default function AxialCodePage() {
  const { id: projectId, versionId } = useParams<PageParams>();
  const queryClient = useQueryClient();

  const [draftAxialCodes, setDraftAxialCodes] = useState<ApiAxialCode[] | null>(null);
  const [draftAxialCodingResultId, setDraftAxialCodingResultId] = useState<string | null>(null);
  const [snapshotAGeneratedAt, setSnapshotAGeneratedAt] = useState<string>('');
  const [snapshotBGeneratedAt, setSnapshotBGeneratedAt] = useState<string>('');
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);

  const isReady = Boolean(projectId && versionId);

  const { data: savedAxialCodes } = useGetCurrentAxialCodesOfVersion(
    projectId ?? '',
    versionId ?? '',
    isReady
  );
  const { data: openCodes } = useGetOpenCodesByVersion(projectId ?? '', versionId ?? '');
  const { mutate: saveAxialCodes, isPending: isSaving } = useSaveAxialCodingResults(
    projectId ?? '',
    versionId ?? '',
    isReady
  );

  const savedCodes = savedAxialCodes?.axialCodes ?? [];
  const openCodeTextById = useMemo(
    () =>
      Object.fromEntries(
        (openCodes ?? []).map((openCode) => [openCode.traceId, openCode.openCode])
      ),
    [openCodes]
  );

  const snapshotA = useMemo<Snapshot | null>(() => {
    const codes = savedAxialCodes?.axialCodes ?? [];
    if (!codes.length) return null;
    const apiCreatedAt = savedAxialCodes?.createdAt ? formatDate(savedAxialCodes.createdAt) : '';
    return convertApiCodesToSnapshot(
      codes,
      'Version A',
      snapshotAGeneratedAt || apiCreatedAt || 'Approved',
      openCodeTextById
    );
  }, [savedAxialCodes, snapshotAGeneratedAt, openCodeTextById]);

  const snapshotB = useMemo<Snapshot | null>(() => {
    if (!draftAxialCodes?.length) return null;
    return convertApiCodesToSnapshot(
      draftAxialCodes,
      'Version B',
      snapshotBGeneratedAt,
      openCodeTextById
    );
  }, [draftAxialCodes, snapshotBGeneratedAt, openCodeTextById]);

  if (!projectId || !versionId) return <Navigate to="/404" replace />;

  const handleGenerated = ({
    axialCodingResultId,
    axialCodes,
    feedback,
  }: {
    axialCodingResultId: string;
    axialCodes: ApiAxialCode[];
    feedback?: string | null;
  }) => {
    const timestamp = formatDate(new Date().toISOString());
    if (savedCodes.length === 0) {
      // First generation: auto-approve immediately
      setLastFeedback(feedback ?? null);
      setSnapshotAGeneratedAt(timestamp);
      saveAxialCodes(axialCodingResultId, {
        onSuccess: () => {
          queryClient.setQueryData<CurrentAxialCodesResponse>(
            QUERY_KEYS.axialCoding.currentAxialCodesOfVersion(versionId),
            {
              axialCodes,
              createdAt: new Date().toISOString(),
            }
          );
        },
      });
    } else {
      // Regeneration: cache as draft B for comparison
      setLastFeedback(feedback ?? null);
      setSnapshotBGeneratedAt(timestamp);
      setDraftAxialCodes(axialCodes);
      setDraftAxialCodingResultId(axialCodingResultId);
    }
  };

  const handleApproveB = () => {
    if (!draftAxialCodingResultId || !draftAxialCodes) return;
    const timestamp = snapshotBGeneratedAt;
    const approvedDraftCodes = draftAxialCodes;
    saveAxialCodes(draftAxialCodingResultId, {
      onSuccess: () => {
        queryClient.setQueryData<CurrentAxialCodesResponse>(
          QUERY_KEYS.axialCoding.currentAxialCodesOfVersion(versionId),
          {
            axialCodes: approvedDraftCodes,
            createdAt: new Date().toISOString(),
          }
        );
        setSnapshotAGeneratedAt(timestamp);
        setDraftAxialCodes(null);
        setDraftAxialCodingResultId(null);
        setSnapshotBGeneratedAt('');
        setLastFeedback(null);
      },
    });
  };

  const handleDiscardB = () => {
    setDraftAxialCodes(null);
    setDraftAxialCodingResultId(null);
    setSnapshotBGeneratedAt('');
    setLastFeedback(null);
  };

  const axialCodesForRegenerate = draftAxialCodes ?? savedCodes;
  const showSingle = snapshotA !== null && snapshotB === null;
  const showComparison = snapshotA !== null && snapshotB !== null;

  return (
    <Flex direction="column" gap="4">
      {/* Page header */}
      <Flex align="start" justify="between">
        <Box>
          <Flex align="center" gap="2">
            <LayoutDashboard size={20} />
            <Text size="6" weight="bold">
              Axial Coding
            </Text>
          </Flex>
          <Text as="p" size="2" mt="1" color="gray" ml="6" style={{ maxWidth: 720 }}>
            Generate, review and approve the LLM-generated axial codes.
          </Text>
        </Box>
      </Flex>

      {/* Generate panel — only shown when not in comparison mode */}
      {!showComparison && (
        <GenerateAxialCodesPanel
          projectId={projectId}
          projectVersionId={versionId}
          axialCodes={axialCodesForRegenerate ?? undefined}
          onGenerated={handleGenerated}
        />
      )}

      {/* Single view: approved codes, no pending draft */}
      {showSingle && (
        <>
          <Box>
            <SectionHead title="Summary" />
            <SnapshotSummaryCard snapshot={snapshotA} />
          </Box>

          <SnapshotTreemapSection snapshotA={snapshotA} />

          <Box pb="9">
            <SectionHead title="Axial codes" />
            <AxialCodeList snapshot={snapshotA} />
          </Box>
        </>
      )}

      {/* Comparison view: approved A vs draft B */}
      {showComparison && (
        <>
          <InterpretationPanel
            snapshotA={snapshotA}
            snapshotB={snapshotB}
            userFeedback={lastFeedback}
            projectId={projectId}
            projectVersionId={versionId}
            axialCodesForRegen={draftAxialCodes ?? []}
            onRegenerated={handleGenerated}
            onApprove={handleApproveB}
            onDiscard={handleDiscardB}
            isSaving={isSaving}
          />

          <Box mt="2">
            <SectionHead title="Version summary" />
            <Grid columns="2" gap="4">
              <SnapshotSummaryCard snapshot={snapshotA} isComparison />
              <SnapshotSummaryCard snapshot={snapshotB} isB isComparison />
            </Grid>
          </Box>

          <Box mt="2">
            <SnapshotTreemapSection snapshotA={snapshotA} snapshotB={snapshotB} />
          </Box>

          <Box mt="2" pb="9">
            <SectionHead
              title="Axial Codes"
              subtitle="Side-by-side comparison. Expand any card for open codes."
            />
            <Grid columns="2" gap="4">
              <AxialCodeList snapshot={snapshotA} isComparison />
              <AxialCodeList snapshot={snapshotB} isB isComparison />
            </Grid>
          </Box>
        </>
      )}
    </Flex>
  );
}
