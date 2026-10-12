import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Project } from '../../../../shared/types/project';
import EditProjectModal from '../EditProjectModal';

const { mutate, deleteProjectMutate, reset, resetDelete, navigate, isPending, isError } = vi.hoisted(
  () => ({
    mutate: vi.fn(),
    deleteProjectMutate: vi.fn(),
    reset: vi.fn(),
    resetDelete: vi.fn(),
    navigate: vi.fn(),
    isPending: { value: false },
    isError: { value: false },
  })
);
vi.mock('../../hooks/useEditProject.ts', () => ({
  useEditProject: () => ({
    mutate,
    reset,
    get isPending() {
      return isPending.value;
    },
    get isError() {
      return isError.value;
    },
  }),
}));
vi.mock('../../hooks/useDeleteProject.ts', () => ({
  useDeleteProject: () => ({
    mutate: deleteProjectMutate,
    reset: resetDelete,
    isPending: false,
    isError: false,
  }),
}));
vi.mock('../../../../shared/components/Modal.tsx', () => ({
  default: ({ open, title, children, onKeyDown }: React.PropsWithChildren<{
    open: boolean;
    title: string;
    onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
  }>) => (open ? <div onKeyDown={onKeyDown} role="dialog" aria-label={title}>{children}</div> : null),
}));
vi.mock('../DeleteAlertDialog.tsx', () => ({
  DeleteAlertDialog: ({ onDelete }: { onDelete: () => void }) => (
    <button onClick={onDelete}>Confirm project removal</button>
  ),
}));
vi.mock('@radix-ui/themes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@radix-ui/themes')>();
  return {
    ...actual,
    Dialog: { ...actual.Dialog, Close: ({ children }: React.PropsWithChildren) => children },
    Tooltip: ({ children }: React.PropsWithChildren) => children,
  };
});
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => navigate,
}));

const project: Omit<Project, 'versions'> = {
  projectId: 'project-1',
  userId: 'user-1',
  name: 'Research project',
  description: 'Original description',
  assessmentCriteria: [],
};

describe('EditProjectModal', () => {
  beforeEach(() => {
    mutate.mockReset();
    deleteProjectMutate.mockReset();
    reset.mockReset();
    resetDelete.mockReset();
    navigate.mockReset();
    isPending.value = false;
    isError.value = false;
  });

  it('loads project values and submits edited fields trimmed', () => {
    render(
      <MemoryRouter>
        <EditProjectModal project={project} open onOpenChange={vi.fn()} />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Project name/), {
      target: { value: ' Updated project ' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: ' Updated description ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save project' }));

    expect(mutate).toHaveBeenCalledWith(
      {
        projectId: 'project-1',
        name: 'Updated project',
        description: 'Updated description',
      },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });

  it('returns nothing when project is absent and deletes a project on success', () => {
    const { rerender } = render(
      <MemoryRouter>
        <EditProjectModal open onOpenChange={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const onOpenChange = vi.fn();
    rerender(
      <MemoryRouter>
        <EditProjectModal project={project} open onOpenChange={onOpenChange} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Confirm project removal' }));
    expect(deleteProjectMutate).toHaveBeenCalledWith(
      'project-1',
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
    deleteProjectMutate.mock.calls[0][1].onSuccess();
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(navigate).toHaveBeenCalledWith('/');
  });
});
