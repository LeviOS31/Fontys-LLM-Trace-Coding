import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EditTraceCollectionModal } from '../EditTraceCollectionModal';

const { editCollection, deleteCollection, resetEdit, isEditPending, isEditError, isDeletePending, isDeleteError } =
  vi.hoisted(() => ({
    editCollection: vi.fn(),
    deleteCollection: vi.fn(),
    resetEdit: vi.fn(),
    isEditPending: { value: false },
    isEditError: { value: false },
    isDeletePending: { value: false },
    isDeleteError: { value: false },
  }));

vi.mock('../../hooks/useEditTraceCollection.ts', () => ({
  useEditTraceCollection: () => ({
    mutate: editCollection,
    get isPending() {
      return isEditPending.value;
    },
    get isError() {
      return isEditError.value;
    },
    reset: resetEdit,
  }),
}));
vi.mock('../../hooks/useDeleteCollection.ts', () => ({
  useDeleteCollection: () => ({
    mutate: deleteCollection,
    get isPending() {
      return isDeletePending.value;
    },
    get isError() {
      return isDeleteError.value;
    },
  }),
}));

describe('EditTraceCollectionModal', () => {
  beforeEach(() => {
    editCollection.mockReset();
    deleteCollection.mockReset();
    resetEdit.mockReset();
    isEditPending.value = false;
    isEditError.value = false;
    isDeletePending.value = false;
    isDeleteError.value = false;
  });

  it('enables save after a changed non-empty name and saves the trimmed value', () => {
    const onOpenChange = vi.fn();
    render(
      <EditTraceCollectionModal
        open
        onOpenChange={onOpenChange}
        projectId="project-1"
        projectVersionId="version-1"
        collectionId="collection-1"
        collectionName="Interview traces"
      />
    );

    const save = screen.getByRole('button', { name: 'Save' });
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Collection name'), {
      target: { value: '  Updated name  ' },
    });
    expect(save).toBeEnabled();
    fireEvent.click(save);

    expect(editCollection).toHaveBeenCalledWith(
      {
        projectId: 'project-1',
        projectVersionId: 'version-1',
        collectionId: 'collection-1',
        name: 'Updated name',
      },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
    editCollection.mock.calls[0][1].onSuccess();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows edit errors and resets draft when closed', () => {
    isEditError.value = true;
    const onOpenChange = vi.fn();
    render(
      <EditTraceCollectionModal
        open
        onOpenChange={onOpenChange}
        projectId="project-1"
        projectVersionId="version-1"
        collectionId="collection-1"
        collectionName="Interview traces"
      />
    );

    expect(screen.getByText(/Updating the collection failed/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(resetEdit).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
