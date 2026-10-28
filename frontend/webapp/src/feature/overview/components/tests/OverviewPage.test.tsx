import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import OverviewPage from '../../OverviewPage';

vi.mock('../../../opencode/hooks/useGetTraceCollections.ts', () => ({
  useGetTraceCollections: () => ({ data: [], isLoading: false }),
}));
vi.mock('../../hooks/useGetRawLLMOutputs.ts', () => ({
  useGetRawLLMOutputs: () => ({ data: [], isLoading: false }),
}));
vi.mock('../CollectionList.tsx', () => ({
  default: () => <div>Collections content</div>,
}));
vi.mock('../DetailsOverviewCard.tsx', () => ({
  default: () => <div>Details content</div>,
}));
vi.mock('../StatisticsOverviewCard.tsx', () => ({
  default: () => <div>Statistics content</div>,
}));
vi.mock('../../../versions/components/VersionPageHeader.tsx', () => ({
  VersionPageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

describe('OverviewPage', () => {
  it('renders overview sections for a valid project version', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/projects/project-1/versions/version-1/overview']}>
          <Routes>
            <Route
              path="/projects/:id/versions/:versionId/overview"
              element={<OverviewPage />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByText('Details content')).toBeInTheDocument();
    expect(screen.getByText('Statistics content')).toBeInTheDocument();
    expect(screen.getByText('Collections content')).toBeInTheDocument();
  });

  it('redirects to not found when route parameters are missing', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/projects/project-1/overview']}>
          <Routes>
            <Route path="/projects/:id/overview" element={<OverviewPage />} />
            <Route path="/404" element={<div>Not found</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Not found')).toBeInTheDocument();
  });
});
