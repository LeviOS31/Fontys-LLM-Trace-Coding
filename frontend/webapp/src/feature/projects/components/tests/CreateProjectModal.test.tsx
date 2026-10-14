import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CreateProjectModal from '../CreateProjectModal';

const { mutate, reset, navigate, isPending, isError } = vi.hoisted(() => ({
  mutate: vi.fn(),
  reset: vi.fn(),
  navigate: vi.fn(),
  isPending: { value: false },
  isError: { value: false },
}));
vi.mock('../../hooks/useCreateProject.ts', () => ({
  useCreateProject: () => ({
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
vi.mock('../../../../shared/components/Modal.tsx', () => ({
  default: ({ open, title, children, onKeyDown }: React.PropsWithChildren<{
    open: boolean;
    title: string;
    onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
  }>) => (open ? <div onKeyDown={onKeyDown} role="dialog" aria-label={title}>{children}</div> : null),
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

describe('CreateProjectModal', () => {
  beforeEach(() => {
    mutate.mockReset();
    reset.mockReset();
    navigate.mockReset();
    isPending.value = false;
    isError.value = false;
  });

  it('validates project name, trims submitted fields, and navigates after success', () => {
    const onOpenChange = vi.fn();
    render(
      <MemoryRouter>
        <CreateProjectModal open onOpenChange={onOpenChange} />
      </MemoryRouter>
    );

    const create = screen.getByRole('button', { name: 'Create project' });
    expect(create).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Project name/), { target: { value: '  ' } });
    expect(create).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Project name/), {
      target: { value: '  Study  ' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: '  Research notes  ' },
    });
    expect(create).toBeEnabled();
    fireEvent.click(create);

    expect(mutate).toHaveBeenCalledWith(
      { name: 'Study', description: 'Research notes' },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
    mutate.mock.calls[0][1].onSuccess({ projectId: 'project-1' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(navigate).toHaveBeenCalledWith('/projects/project-1');
  });

  it('shows mutation errors and disables submission while pending', () => {
    isError.value = true;
    isPending.value = true;
    render(
      <MemoryRouter>
        <CreateProjectModal open onOpenChange={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Creating/ })).toBeDisabled();
    expect(screen.getByLabelText(/Project name/)).toBeDisabled();
  });
});
