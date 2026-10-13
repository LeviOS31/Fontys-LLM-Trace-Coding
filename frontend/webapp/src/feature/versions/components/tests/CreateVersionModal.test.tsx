import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateVersionModal } from '../CreateVersionModal';

const { mutate, reset, navigate, isPending, isError, error } = vi.hoisted(() => ({
  mutate: vi.fn(),
  reset: vi.fn(),
  navigate: vi.fn(),
  isPending: { value: false },
  isError: { value: false },
  error: { value: undefined as { status: number } | undefined },
}));
vi.mock('../../hooks/useCreateVersion.ts', () => ({
  useCreateVersion: () => ({
    mutate,
    reset,
    get isPending() {
      return isPending.value;
    },
    get isError() {
      return isError.value;
    },
    get error() {
      return error.value;
    },
  }),
}));
vi.mock('../../../../shared/components/Modal', () => ({
  default: ({
    open,
    title,
    children,
    onKeyDown,
  }: React.PropsWithChildren<{
    open: boolean;
    title: string;
    onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
  }>) =>
    open ? (
      <div role="dialog" aria-label={title} onKeyDown={onKeyDown}>
        {children}
      </div>
    ) : null,
}));
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => navigate,
}));
vi.mock('radix-ui', () => ({
  Dialog: { Close: ({ children }: React.PropsWithChildren<{ asChild?: boolean }>) => children },
}));
vi.mock('@radix-ui/themes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@radix-ui/themes')>();
  return { ...actual, Tooltip: ({ children }: React.PropsWithChildren) => children };
});

describe('CreateVersionModal', () => {
  beforeEach(() => {
    mutate.mockReset();
    reset.mockReset();
    navigate.mockReset();
    isPending.value = false;
    isError.value = false;
    error.value = undefined;
  });

  it('validates required fields, trims values, and navigates after success', () => {
    const onOpenChange = vi.fn();
    render(
      <MemoryRouter>
        <CreateVersionModal projectId="project-1" isOpen onOpenChange={onOpenChange} />
      </MemoryRouter>
    );

    const create = screen.getByRole('button', { name: 'Create version' });
    expect(create).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Version name/), { target: { value: ' V1 ' } });
    expect(create).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Description/), {
      target: { value: ' Initial analysis ' },
    });
    expect(create).toBeEnabled();
    fireEvent.click(create);

    expect(mutate).toHaveBeenCalledWith(
      { projectId: 'project-1', name: 'V1', description: 'Initial analysis' },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
    mutate.mock.calls[0][1].onSuccess({
      projectId: 'project-1',
      versionId: 'version-1',
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(navigate).toHaveBeenCalledWith('/projects/project-1/versions/version-1/overview');
  });

  it('shows duplicate-name and generic errors and disables submission while pending', () => {
    isError.value = true;
    error.value = { status: 409 };
    const { unmount: unmountConflict } = render(
      <MemoryRouter>
        <CreateVersionModal projectId="project-1" isOpen onOpenChange={vi.fn()} />
      </MemoryRouter>
    );
    expect(
      screen.getByText(/There already exists a version with this name/)
    ).toBeInTheDocument();
    unmountConflict();

    error.value = { status: 500 };
    isPending.value = true;
    const { unmount } = render(
      <MemoryRouter>
        <CreateVersionModal projectId="project-1" isOpen onOpenChange={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /Creating/ })).toBeDisabled();
    expect(screen.getByPlaceholderText('e.g. v1.2.3')).toBeDisabled();
    unmount();

    isPending.value = false;
    error.value = { status: 500 };
    render(
      <MemoryRouter>
        <CreateVersionModal projectId="project-1" isOpen onOpenChange={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
  });
});
