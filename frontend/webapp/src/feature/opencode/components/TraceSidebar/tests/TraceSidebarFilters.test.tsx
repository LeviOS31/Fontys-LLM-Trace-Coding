import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import { describe, expect, it, vi } from 'vitest';
import TraceSidebarFilters from '../TraceSidebarFilters';

const { useGetTraceCollections } = vi.hoisted(() => ({ useGetTraceCollections: vi.fn() }));

vi.mock('../../../hooks/useGetTraceCollections.ts', () => ({ useGetTraceCollections }));

describe('TraceSidebarFilters', () => {
  it('forwards search and no-open-code filter changes', () => {
    useGetTraceCollections.mockReturnValue({
      data: [{ traceCollectionId: 'collection-1', name: 'Collection A' }],
      isLoading: false,
      isError: false,
    });
    const setSearch = vi.fn();
    const setHasNoOpenCode = vi.fn();
    const setSearchParams = vi.fn();
    render(
      <Theme>
        <TraceSidebarFilters
          projectId="project-1"
          versionId="version-1"
          search=""
          setSearch={setSearch}
          collectionFilter="All"
          setCollectionFilter={vi.fn()}
          hasNoOpenCode={false}
          setHasNoOpenCode={setHasNoOpenCode}
          setSearchParams={setSearchParams}
        />
      </Theme>
    );

    fireEvent.change(screen.getByPlaceholderText('Search traces...'), {
      target: { value: 'checkout' },
    });
    expect(setSearch).toHaveBeenCalledWith('checkout');

    fireEvent.click(screen.getByRole('checkbox'));
    expect(setHasNoOpenCode).toHaveBeenCalledWith(true);
    expect(setSearchParams).toHaveBeenCalledWith('hasNoOpenCode', true);
  });

  it('disables collection selection and reports collection load errors', () => {
    useGetTraceCollections.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(
      <Theme>
        <TraceSidebarFilters
          projectId="project-1"
          versionId="version-1"
          search=""
          setSearch={vi.fn()}
          collectionFilter="All"
          setCollectionFilter={vi.fn()}
          hasNoOpenCode={false}
          setHasNoOpenCode={vi.fn()}
          setSearchParams={vi.fn()}
        />
      </Theme>
    );

    expect(screen.getByText('Could not load trace collections.')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeDisabled();
  });
});
