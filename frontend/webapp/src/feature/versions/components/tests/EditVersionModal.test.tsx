import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Version } from '../../../../shared/types/version';
import { EditVersionModal } from '../EditVersionModal';

const { mutate, deleteVersionMutate, reset, resetDelete, navigate, isPending, isError } = vi.hoisted(
  () => ({
    mutate: vi.fn(),
    deleteVersionMutate: vi.fn(),
    reset: vi.fn(),
    resetDelete: vi.fn(),
    navigate: vi.fn(),
    isPending: { value: false },
    isError: { value: false },
  })
);
vi.mock('../../hooks/useEditVersion.ts', () => ({
  useEditVersion: () => ({
    mutate,
    reset,
    get isPending() {
      return isPending.value;
    },
    get isError() {
      return isError.value;
    },
    error: undefined,
  }),
}));
vi.mock('../../hooks/useDeleteVersion.ts', () => ({
  useDeleteVersion: () => ({
    mutate: deleteVersionMutate,
    reset: resetDelete,
    isPending: false,
    isError: false,
  }),
}));
vi.mock('../../../../shared/components/Modal.tsx', () => ({
  default: ({
    open,
    title,
    children,
  }: React.PropsWithChildren<{ open: boolean; title: string }>) =>
    open ? <div role="dialog" aria-label={title}>{children}</div> : null,
}));
vi.mock('../DeleteVersionAlertDialog.tsx', () => ({
  DeleteVersionAlertDialog: ({ onDelete }: { onDelete: () => void }) => (
    <button onClick={onDelete}>Confirm version deletion</button>
  ),
}));
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => navigate,
}));
vi.mock('@radix-ui/themes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@radix-ui/themes')>();
  return {
    ...actual,
    Dialog: { ...actual.Dialog, Close: ({ children }: React.PropsWithChildren) => children },
    Tooltip: ({ children }: React.PropsWithChildren) => children,
  };
});

const version: Version = {
  projectId: 'project-1',
  versionId: 'version-1',
  name: 'Version 1',
  description: 'Initial analysis',
};

describe('EditVersionModal', () => {
  beforeEach(() => {
    mutate.mockReset();
    deleteVersionMutate.mockReset();
    reset.mockReset();
    resetDelete.mockReset();
    navigate.mockReset();
    isPending.value = false;
    isError.value = false;
  });

  it('returns null without a version and saves trimmed edited values', () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <MemoryRouter>
        <EditVersionModal open onOpenChange={onOpenChange} />
      </MemoryRouter>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <EditVersionModal version={version} open onOpenChange={onOpenChange} />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText(/Version name/), {
      target: { value: ' Updated version ' },
    });
    fireEvent.change(screen.getByLabelText(/Description/), {
      target: { value: ' Updated description ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save version' }));

    expect(mutate).toHaveBeenCalledWith(
      {
        projectId: 'project-1',
        versionId: 'version-1',
        name: 'Updated version',
        description: 'Updated description',
      },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
    mutate.mock.calls[0][1].onSuccess();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('deletes the version and returns to its project after success', () => {
    const onOpenChange = vi.fn();
    render(
      <MemoryRouter>
        <EditVersionModal version={version} open onOpenChange={onOpenChange} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Confirm version deletion' }));
    expect(deleteVersionMutate).toHaveBeenCalledWith(
      { projectId: 'project-1', versionId: 'version-1' },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
    deleteVersionMutate.mock.calls[0][1].onSuccess();
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(navigate).toHaveBeenCalledWith('/projects/project-1');
  });
});
