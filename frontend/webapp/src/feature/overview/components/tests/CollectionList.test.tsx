import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CollectionList from '../CollectionList';

vi.mock('../CollectionListItem.tsx', () => ({
  default: ({
    collection,
    showDivider,
  }: {
    collection: { name: string };
    showDivider: boolean;
  }) => (
    <div data-testid="collection-list-item" data-divider={showDivider}>
      {collection.name}
    </div>
  ),
}));
vi.mock('../../../traces/components/ImportTraceCollectionModal.tsx', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div role="dialog">Import collection</div> : null,
}));

describe('CollectionList', () => {
  it('shows loading placeholders and disables import while loading', () => {
    render(
      <CollectionList
        collections={undefined}
        isLoading
        projectId="project-1"
        projectVersionId="version-1"
      />
    );

    expect(screen.getByText('Collections')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Import trace collection/ })).toBeDisabled();
    expect(screen.queryAllByTestId('collection-list-item')).toHaveLength(0);
  });

  it('renders collections with dividers except after the final item', () => {
    render(
      <CollectionList
        collections={[
          {
            traceCollectionId: 'collection-1',
            name: 'First collection',
            tracersCount: 2,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
          {
            traceCollectionId: 'collection-2',
            name: 'Second collection',
            tracersCount: 1,
            createdAt: '2026-01-02T00:00:00.000Z',
          },
        ]}
        isLoading={false}
        projectId="project-1"
        projectVersionId="version-1"
      />
    );

    const items = screen.getAllByTestId('collection-list-item');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveAttribute('data-divider', 'true');
    expect(items[1]).toHaveAttribute('data-divider', 'false');
  });

  it('opens the import modal from the button', () => {
    render(
      <CollectionList
        collections={[]}
        isLoading={false}
        projectId="project-1"
        projectVersionId="version-1"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Import trace collection/ }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Import collection');
  });

  it('opens the import modal with the I keyboard shortcut', () => {
    render(
      <CollectionList
        collections={[]}
        isLoading={false}
        projectId="project-1"
        projectVersionId="version-1"
      />
    );

    fireEvent.keyDown(window, { key: 'i' });
    expect(screen.getByRole('dialog')).toHaveTextContent('Import collection');
  });

  it('shows an empty state and keeps import available for an empty result', () => {
    render(
      <CollectionList
        collections={[]}
        isLoading={false}
        projectId="project-1"
        projectVersionId="version-1"
      />
    );

    expect(screen.getByText('No collections imported yet.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Import trace collection/ })).toBeEnabled();
  });
});