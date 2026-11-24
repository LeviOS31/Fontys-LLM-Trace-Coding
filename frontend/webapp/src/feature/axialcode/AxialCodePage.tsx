import { useState, useMemo } from 'react';
import { Box, Flex, Grid, Heading, Text } from '@radix-ui/themes';
import { useQueryClient } from '@tanstack/react-query';
import type {
  AxialCodeNegativeExampleUpdate,
  CurrentAxialCodesResponse,
} from '../../shared/api/axialCode.ts';
import { QUERY_KEYS } from '../../shared/api/queryKeys.ts';
import { LayoutDashboard } from 'lucide-react';
import { Navigate, useParams } from 'react-router';
import type { AxialCode as ApiAxialCode } from '../../shared/types/axialCode.ts';
import type { Snapshot } from '../../shared/types/snapshot.ts';
import { GenerateAxialCodesPanel } from './components/GenerateAxailCodesPanal/GenerateAxialCodesPanel.tsx';
import InterpretationPanel from './components/InterpretationPanel/InterpretationPanel.tsx';
import { useGetCurrentAxialCodesOfVersion } from './hooks/useGetCurrentAxialCodesOfVersion.ts';
import { useGetOpenCodesByVersion } from './hooks/useGetOpenCodesByVersion.ts';
import { useSaveAxialCodingResults } from './hooks/useSaveAxialCodingResults.ts';
import SnapshotSummaryCard from './components/SnapshotSummaryCard.tsx';
import AxialCodeList from './components/AxialCodeList.tsx';
import { convertApiCodesToSnapshot } from '../../shared/util/convertApiCodesToSnapshot.ts';
import { compareAxialCodes } from '../../shared/util/compareAxialCodes.ts';
import buildComparisonColors from '../../shared/util/buildComparisonColors.ts';
import ChangesSection from './components/ChangesSection/ChangesSection.tsx';
import NegativeExampleReview from './components/NegativeExampleReview.tsx';
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

function getNegativeExampleUpdates(
  axialCodes: ApiAxialCode[]
): AxialCodeNegativeExampleUpdate[] | null {
  if (axialCodes.length === 0) return null;
  const updates = axialCodes.flatMap((code) => {
    const trace = code.negativeExampleTrace?.trim();
    const reasoning = code.negativeExampleReasoning?.trim();
    return code.axialCodeId && trace && reasoning
      ? [{ axialCodeId: code.axialCodeId, trace, reasoning }]
      : [];
  });
  return updates.length === axialCodes.length ? updates : null;
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

type PendingReview = {
  axialCodingResultId: string;
  axialCodes: ApiAxialCode[];
  feedback: string | null;
  generatedAt: string;
};

export default function AxialCodePage() {
  const { id: projectId, versionId } = useParams<PageParams>();

  const [draftAxialCodes, setDraftAxialCodes] = useState<ApiAxialCode[] | null>(null);
  const [draftAxialCodingResultId, setDraftAxialCodingResultId] = useState<string | null>(null);
  const [snapshotAGeneratedAt, setSnapshotAGeneratedAt] = useState<string>('');
  const [snapshotBGeneratedAt, setSnapshotBGeneratedAt] = useState<string>('');
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);
  const [pendingReview, setPendingReview] = useState<PendingReview | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const queryClient = useQueryClient();

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

  // What changed between the approved codes (A) and the regenerated draft (B).
  const comparison = useMemo(() => {
    const approvedCodes = savedAxialCodes?.axialCodes ?? [];
    if (!approvedCodes.length || !draftAxialCodes?.length) return null;
    const result = compareAxialCodes(approvedCodes, draftAxialCodes);
    return {
      result,
      colorOf: buildComparisonColors(approvedCodes, result),
      changeOf: new Map(result.changes.map((change) => [change.code, change])),
    };
  }, [savedAxialCodes, draftAxialCodes]);

  const snapshotA = useMemo<Snapshot | null>(() => {
    const codes = savedAxialCodes?.axialCodes ?? [];
    if (!codes.length) return null;
    const apiCreatedAt = savedAxialCodes?.createdAt ? formatDate(savedAxialCodes.createdAt) : '';
    return convertApiCodesToSnapshot(
      codes,
      'Version A',
      snapshotAGeneratedAt || apiCreatedAt || 'Approved',
      openCodeTextById,
      { colorOf: comparison?.colorOf }
    );
  }, [savedAxialCodes, snapshotAGeneratedAt, openCodeTextById, comparison]);

  const snapshotB = useMemo<Snapshot | null>(() => {
    if (!draftAxialCodes?.length) return null;
    return convertApiCodesToSnapshot(
      draftAxialCodes,
      'Version B',
      snapshotBGeneratedAt,
      openCodeTextById,
      comparison ?? undefined
    );
  }, [draftAxialCodes, snapshotBGeneratedAt, openCodeTextById, comparison]);

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
    setReviewError(null);
    setPendingReview({
      axialCodingResultId,
      axialCodes,
      feedback: feedback ?? null,
      generatedAt: formatDate(new Date().toISOString()),
    });
  };

  const handleNegativeExamplesReviewed = (axialCodes: ApiAxialCode[]) => {
    if (!pendingReview) return;
    const negativeExamples = getNegativeExampleUpdates(axialCodes);
    if (!negativeExamples) {
      setReviewError('Every axial code must have an approved negative example before continuing.');
      return;
    }

    if (savedCodes.length === 0) {
      saveAxialCodes(
        { axialCodingResultId: pendingReview.axialCodingResultId, negativeExamples },
        {
          onSuccess: () => {
            const createdAt = new Date().toISOString();
            setLastFeedback(pendingReview.feedback);
            setSnapshotAGeneratedAt(pendingReview.generatedAt);
            setReviewError(null);
            setPendingReview(null);
            queryClient.setQueryData<CurrentAxialCodesResponse>(
              QUERY_KEYS.axialCoding.currentAxialCodesOfVersion(versionId),
              { axialCodes, createdAt }
            );
          },
          onError: (error) => setReviewError(error.message),
        }
      );
      return;
    }

    setLastFeedback(pendingReview.feedback);
    setSnapshotBGeneratedAt(pendingReview.generatedAt);
    setDraftAxialCodes(axialCodes);
    setDraftAxialCodingResultId(pendingReview.axialCodingResultId);
    setPendingReview(null);
  };

  const handleApproveB = () => {
    if (!draftAxialCodingResultId || !draftAxialCodes) return;
    const timestamp = snapshotBGeneratedAt;
    const negativeExamples = getNegativeExampleUpdates(draftAxialCodes);
    if (!negativeExamples) {
      setReviewError('Every axial code must have an approved negative example before continuing.');
      return;
    }
    saveAxialCodes(
      { axialCodingResultId: draftAxialCodingResultId, negativeExamples },
      {
        onSuccess: () => {
          setSnapshotAGeneratedAt(timestamp);
          setDraftAxialCodes(null);
          setDraftAxialCodingResultId(null);
          setSnapshotBGeneratedAt('');
          setLastFeedback(null);
          setReviewError(null);
        },
        onError: (error) => setReviewError(error.message),
      }
    );
  };

  const handleDiscardB = () => {
    setDraftAxialCodes(null);
    setDraftAxialCodingResultId(null);
    setSnapshotBGeneratedAt('');
    setLastFeedback(null);
    setReviewError(null);
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

      {pendingReview ? (
        <NegativeExampleReview
          projectId={projectId}
          projectVersionId={versionId}
          axialCodes={pendingReview.axialCodes}
          isSaving={isSaving}
          saveError={reviewError}
          onComplete={handleNegativeExamplesReviewed}
        />
      ) : (
        <>
          {reviewError && (
            <Text role="alert" color="red">
              {reviewError}
            </Text>
          )}
          {!showComparison && (
            <GenerateAxialCodesPanel
              projectId={projectId}
              projectVersionId={versionId}
              axialCodes={axialCodesForRegenerate ?? undefined}
              onGenerated={handleGenerated}
            />
          )}

          {showSingle && (
            <>
              <Box>
                <SectionHead title="Summary" />
                <SnapshotSummaryCard snapshot={snapshotA} />
              </Box>

              <Box pb="9">
                <SectionHead title="Axial codes" />
                <AxialCodeList snapshot={snapshotA} />
              </Box>
            </>
          )}

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
                comparison={comparison?.result ?? null}
              />

              {comparison && (
                <Box mt="2">
                  <ChangesSection
                    comparison={comparison.result}
                    previousCodes={savedCodes}
                    nextCodes={draftAxialCodes ?? []}
                    colorOf={comparison.colorOf}
                    openCodeTextById={openCodeTextById}
                  />
                </Box>
              )}

              <Box mt="2">
                <SectionHead title="Version summary" />
                <Grid columns="2" gap="4">
                  <SnapshotSummaryCard snapshot={snapshotA} isComparison />
                  <SnapshotSummaryCard snapshot={snapshotB} isB isComparison />
                </Grid>
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
        </>
      )}
    </Flex>
  );
}
