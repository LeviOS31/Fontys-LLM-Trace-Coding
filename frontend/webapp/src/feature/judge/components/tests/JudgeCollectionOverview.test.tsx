import '@testing-library/jest-dom/vitest';
import { Theme } from '@radix-ui/themes';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  const onRename = vi.fn().mockResolvedValue(true);
  const onDelete = vi.fn().mockResolvedValue(true);
  render(
    <Theme>
      <JudgeCollectionOverview
        collections={collections}
        loading={loading}
        onSelect={onSelect}
        onRename={onRename}
        onDelete={onDelete}
      />
    </Theme>
  );
  return { onSelect, onRename, onDelete };
}

describe('JudgeCollectionOverview', () => {
  it('renders collections and selects the clicked collection', () => {
    const { onSelect } = renderOverview();
    fireEvent.click(screen.getByRole('button', { name: 'Open Judge Collection 1' }));
    expect(onSelect).toHaveBeenCalledWith('collection-1');
  });

  it('renames a collection from the inline editor', async () => {
    const { onRename } = renderOverview();
    fireEvent.click(screen.getByRole('button', { name: 'Edit Judge Collection 1' }));

    const input = screen.getByRole('textbox', { name: 'Collection name' });
    fireEvent.change(input, { target: { value: '  Regression checks  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onRename).toHaveBeenCalledWith('collection-1', 'Regression checks'));
    expect(screen.queryByRole('textbox', { name: 'Collection name' })).not.toBeInTheDocument();
  });

  it('deletes a collection after confirmation', async () => {
    const { onDelete } = renderOverview();
    fireEvent.click(screen.getByRole('button', { name: 'Delete Judge Collection 1' }));
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText(/all of its judge runs/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Delete collection' }));

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith('collection-1'));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  });

  it('does not delete a collection when confirmation is cancelled', async () => {
    const { onDelete } = renderOverview();
    fireEvent.click(screen.getByRole('button', { name: 'Delete Judge Collection 1' }));
    await screen.findByRole('alertdialog');

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('does not save a blank collection name', () => {
    const { onRename } = renderOverview();
    fireEvent.click(screen.getByRole('button', { name: 'Edit Judge Collection 1' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Collection name' }), {
      target: { value: '   ' },
    });

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(onRename).not.toHaveBeenCalled();
  });

  it('cancels editing without renaming the collection', () => {
    const { onRename } = renderOverview();
    fireEvent.click(screen.getByRole('button', { name: 'Edit Judge Collection 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onRename).not.toHaveBeenCalled();
    expect(screen.queryByRole('textbox', { name: 'Collection name' })).not.toBeInTheDocument();
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
