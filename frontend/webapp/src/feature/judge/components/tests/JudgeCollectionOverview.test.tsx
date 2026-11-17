import '@testing-library/jest-dom/vitest';
import { Theme } from '@radix-ui/themes';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { JudgeCollection } from '../../hooks/judgeUtils';
import JudgeCollectionOverview from '../JudgeCollectionOverview';

afterEach(cleanup);

const collection: JudgeCollection = {
  judgeCollectionId: 'collection-1',
  name: 'Judge Collection 1',
  versionId: 'version-1',
  createdAt: '2025-01-15T12:00:00Z',
};

function renderOverview(collections: JudgeCollection[] = [collection], loading = false) {
  const onSelect = vi.fn();
  render(
    <Theme>
      <JudgeCollectionOverview collections={collections} loading={loading} onSelect={onSelect} />
    </Theme>
  );
  return onSelect;
}

describe('JudgeCollectionOverview', () => {
  it('renders collections and selects the clicked collection', () => {
    const onSelect = renderOverview();
    fireEvent.click(screen.getByRole('button', { name: /Judge Collection 1/ }));
    expect(onSelect).toHaveBeenCalledWith('collection-1');
  });

  it('shows a loading message while collections are being fetched', () => {
    renderOverview([], true);
    expect(screen.getByText('Loading judge collections…')).toBeInTheDocument();
  });

  it('shows an empty state when no collections exist', () => {
    renderOverview([]);
    expect(screen.getByText(/No judge collections yet/)).toBeInTheDocument();
  });
});
