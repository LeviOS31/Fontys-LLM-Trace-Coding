import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DeleteVersionAlertDialog } from '../DeleteVersionAlertDialog';

describe('DeleteVersionAlertDialog', () => {
  it('requires the exact trimmed version name before deletion', () => {
    const onDelete = vi.fn();
    render(
      <DeleteVersionAlertDialog
        versionName="  Version 1 "
        onDelete={onDelete}
        isPending={false}
        isError={false}
        isOpen
        setIsOpen={vi.fn()}
      />
    );

    const confirm = screen.getByRole('button', { name: 'Delete version' });
    expect(screen.getByLabelText(/Type Version 1 to confirm/)).toBeInTheDocument();
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText('Version name'), {
      target: { value: 'Version' },
    });
    expect(screen.getByText('Version name does not match.')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Version name'), {
      target: { value: ' Version 1 ' },
    });
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('shows deletion progress and error and disables controls while pending', () => {
    render(
      <DeleteVersionAlertDialog
        versionName="Version 1"
        onDelete={vi.fn()}
        isPending
        isError
        isOpen
        setIsOpen={vi.fn()}
      />
    );

    expect(screen.getByText(/Deletion in progress/)).toBeInTheDocument();
    expect(screen.getByText(/Deleting the version failed/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Version name')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete version' })).toBeDisabled();
  });
});
