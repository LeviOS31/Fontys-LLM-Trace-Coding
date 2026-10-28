import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DeleteCollectionAlert } from '../DeleteCollectionAlert';

describe('DeleteCollectionAlert', () => {
  it('requires an exact trimmed collection name before deletion', () => {
    const onDelete = vi.fn();
    render(
      <DeleteCollectionAlert
        collectionName="  Interview traces "
        onDelete={onDelete}
        isPending={false}
        isError={false}
        isOpen
        setIsOpen={vi.fn()}
      />
    );

    expect(screen.getByLabelText(/Type Interview traces to confirm/)).toBeInTheDocument();
    const confirm = screen.getByRole('button', { name: 'Delete Collection' });
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText('Collection name'), {
      target: { value: 'Interview' },
    });
    expect(screen.getByText('Collection name does not match.')).toBeInTheDocument();
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText('Collection name'), {
      target: { value: ' Interview traces ' },
    });
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('shows pending and error states and resets confirmation when closed', () => {
    const setIsOpen = vi.fn();
    const { rerender } = render(
      <DeleteCollectionAlert
        collectionName="Interview traces"
        onDelete={vi.fn()}
        isPending
        isError
        isOpen
        setIsOpen={setIsOpen}
      />
    );

    expect(screen.getByText(/Deletion in progress/)).toBeInTheDocument();
    expect(screen.getByText(/Deleting the Collection failed/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete Collection' })).toBeDisabled();

    rerender(
      <DeleteCollectionAlert
        collectionName="Interview traces"
        onDelete={vi.fn()}
        isPending={false}
        isError={false}
        isOpen
        setIsOpen={setIsOpen}
      />
    );
    fireEvent.change(screen.getByPlaceholderText('Collection name'), {
      target: { value: 'Interview traces' },
    });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(setIsOpen).toHaveBeenCalledWith(false);
  });
});
