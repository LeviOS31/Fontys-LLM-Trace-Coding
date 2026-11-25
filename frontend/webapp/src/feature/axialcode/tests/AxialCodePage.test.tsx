import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CurrentAxialCodesResponse } from '../../../shared/api/axialCode';
import { QUERY_KEYS } from '../../../shared/api/queryKeys';
import type { AxialCode } from '../../../shared/types/axialCode';
import AxialCodePage from '../AxialCodePage';

const { useCurrentCodes, useOpenCodes, useSaveCodes, codes } = vi.hoisted(() => ({
  useCurrentCodes: vi.fn(),
  useOpenCodes: vi.fn(),
  useSaveCodes: vi.fn(),
  codes: [
    {
      axialCodeId: 'code-1',
      label: 'Reliability',
      description: 'Failures',
      traceIds: ['trace-1'],
      negativeExampleTrace: 'User: Test\nAssistant: Does not fit.',
      negativeExampleReasoning: 'The response does not show the behavior.',
    },
  ],
}));

vi.mock('../hooks/useGetCurrentAxialCodesOfVersion.ts', () => ({
  useGetCurrentAxialCodesOfVersion: useCurrentCodes,
}));
vi.mock('../hooks/useGetOpenCodesByVersion.ts', () => ({
  useGetOpenCodesByVersion: useOpenCodes,
}));
vi.mock('../hooks/useSaveAxialCodingResults.ts', () => ({
  useSaveAxialCodingResults: useSaveCodes,
}));
vi.mock('../components/GenerateAxailCodesPanal/GenerateAxialCodesPanel.tsx', () => ({
  GenerateAxialCodesPanel: ({
    onGenerated,
  }: {
    onGenerated: (result: {
      axialCodingResultId: string;
      axialCodes: AxialCode[];
      feedback: string | null;
    }) => void;
  }) => (
    <button
      onClick={() =>
        onGenerated({
          axialCodingResultId: 'result-1',
          axialCodes: codes,
          feedback: null,
        })
      }
    >
      Generate test result
    </button>
  ),
}));
vi.mock('../components/SnapshotSummaryCard.tsx', () => ({
  default: ({ snapshot }: { snapshot: { label: string } }) => (
    <div data-testid="snapshot-summary">{snapshot.label}</div>
  ),
}));
vi.mock('../../../shared/components/SnapshotTreemap.tsx', () => ({
  default: () => <div data-testid="snapshot-treemap" />,
}));
vi.mock('../components/AxialCodeList.tsx', () => ({
  default: ({ snapshot }: { snapshot: { label: string } }) => (
    <div data-testid="axial-code-list">{snapshot.label}</div>
  ),
}));
vi.mock('../components/InterpretationPanel/InterpretationPanel.tsx', () => ({
  default: () => <div data-testid="interpretation-panel" />,
}));
vi.mock('../components/NegativeExampleReview.tsx', () => ({
  default: ({
    axialCodes,
    onComplete,
  }: {
    axialCodes: AxialCode[];
    onComplete: (codes: AxialCode[]) => void;
  }) => (
    <button type="button" onClick={() => onComplete(axialCodes)}>
      Finish negative review
    </button>
  ),
}));
vi.mock('../components/ChangesSection/ChangesSection.tsx', () => ({
  default: () => <div data-testid="changes-section" />,
}));

function renderPage(path: string) {
  const client = new QueryClient();
  const router = createMemoryRouter(
    [
      { path: '/404', element: <div>Not found</div> },
      { path: '/axial-code', element: <AxialCodePage /> },
      { path: '/projects/:id/versions/:versionId/axial-code', element: <AxialCodePage /> },
    ],
    { initialEntries: [path] }
  );
  const view = render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
  return { ...view, client };
}

beforeEach(() => {
  useCurrentCodes.mockReturnValue({ data: undefined });
  useOpenCodes.mockReturnValue({ data: [] });
  useSaveCodes.mockReturnValue({ mutate: vi.fn(), isPending: false });
});

describe('AxialCodePage', () => {
  it('redirects to not-found if the project/version route parameters are absent', () => {
    renderPage('/axial-code');
    expect(screen.getByText('Not found')).toBeInTheDocument();
  });

  it('requires negative-example review before saving the first generated result', () => {
    useCurrentCodes.mockReturnValue({ data: undefined });
    useOpenCodes.mockReturnValue({ data: [{ traceId: 'trace-1', openCode: 'A failure' }] });
    const save = vi.fn((_request, callbacks) => callbacks.onSuccess());
    useSaveCodes.mockReturnValue({ mutate: save, isPending: false });

    const { client } = renderPage('/projects/project-1/versions/version-1/axial-code');
    fireEvent.click(screen.getByRole('button', { name: 'Generate test result' }));

    expect(screen.getByRole('button', { name: 'Finish negative review' })).toBeInTheDocument();
    expect(save).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Finish negative review' }));

    expect(save).toHaveBeenCalledWith(
      {
        axialCodingResultId: 'result-1',
        negativeExamples: [
          {
            axialCodeId: 'code-1',
            trace: 'User: Test\nAssistant: Does not fit.',
            reasoning: 'The response does not show the behavior.',
          },
        ],
      },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
    expect(
      client.getQueryData<CurrentAxialCodesResponse>(
        QUERY_KEYS.axialCoding.currentAxialCodesOfVersion('version-1')
      )?.axialCodes
    ).toEqual(codes);
  });
});
