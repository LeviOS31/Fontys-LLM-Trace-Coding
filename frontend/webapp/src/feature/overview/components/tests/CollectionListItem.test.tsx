import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CollectionListItem from '../CollectionListItem';
import type { TraceCollectionOverview } from '../../../../shared/types/trace';

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => navigate,
}));
vi.mock('../EditTraceCollectionModal.tsx', () => ({
  EditTraceCollectionModal: ({ open }: { open: boolean }) =>
    open ? <div role="dialog">Edit collection dialog</div> : null,
}));

const collection: TraceCollectionOverview = {
  traceCollectionId: 'collection-1',
  name: 'Interview traces',
  tracersCount: 4,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('CollectionListItem', () => {
  beforeEach(() => navigate.mockReset());

  it('navigates to OpenCode when the collection row is clicked', () => {
    render(
      <CollectionListItem
        collection={collection}
        showDivider
        versionId="version-1"
        projectId="project-1"
      />
    );

    fireEvent.click(screen.getByText('Interview traces'));
    expect(navigate).toHaveBeenCalledWith(
      '/projects/project-1/versions/version-1/open-code?traceCollection=collection-1'
    );
    expect(screen.getByText('4 traces')).toBeInTheDocument();
  });

  it('opens edit without triggering row navigation', () => {
    render(
      <CollectionListItem
        collection={collection}
        showDivider={false}
        versionId="version-1"
        projectId="project-1"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit trace collection' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });
});
