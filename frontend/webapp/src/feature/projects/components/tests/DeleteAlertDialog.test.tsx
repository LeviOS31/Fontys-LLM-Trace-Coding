import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DeleteAlertDialog } from '../DeleteAlertDialog';

describe('DeleteAlertDialog', () => {
  it('requires the exact project name to enable deletion', () => {
    const onDelete = vi.fn();
    render(
      <DeleteAlertDialog
        projectName="  Research project "
        onDelete={onDelete}
        isPending={false}
        isError={false}
        isOpen
        setIsOpen={vi.fn()}
      />
    );

    const confirm = screen.getByRole('button', { name: 'Delete project' });
    expect(screen.getByLabelText(/Type Research project to confirm/)).toBeInTheDocument();
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText('Project name'), {
      target: { value: 'Wrong name' },
    });
    expect(screen.getByText('Project name does not match.')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Project name'), {
      target: { value: ' Research project ' },
    });
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('disables controls during deletion and shows pending and error feedback', () => {
    render(
      <DeleteAlertDialog
        projectName="Research project"
        onDelete={vi.fn()}
        isPending
        isError
        isOpen
        setIsOpen={vi.fn()}
      />
    );

    expect(screen.getByText(/Deletion in progress/)).toBeInTheDocument();
    expect(screen.getByText(/Deleting the project failed/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Project name')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete project' })).toBeDisabled();
  });
});
