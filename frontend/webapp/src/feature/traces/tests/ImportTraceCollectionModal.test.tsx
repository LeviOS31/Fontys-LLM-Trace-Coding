import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TRACE_COLLECTION_NAME_MIN_LENGTH } from '../../../shared/types/trace';
import ImportTraceCollectionModal from '../components/ImportTraceCollectionModal';

const { mutate, reset, isPending, isError } = vi.hoisted(() => ({
  mutate: vi.fn(),
  reset: vi.fn(),
  isPending: { value: false },
  isError: { value: false },
}));
vi.mock('../hooks/useImportTraceCollection.ts', () => ({
  useImportTraceCollection: () => ({
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
vi.mock('../../../shared/components/Modal.tsx', () => ({
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
vi.mock('@radix-ui/themes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@radix-ui/themes')>();
  return {
    ...actual,
    Dialog: { ...actual.Dialog, Close: ({ children }: React.PropsWithChildren) => children },
    Tooltip: ({ children }: React.PropsWithChildren) => children,
  };
});

describe('ImportTraceCollectionModal', () => {
  beforeEach(() => {
    mutate.mockReset();
    reset.mockReset();
    isPending.value = false;
    isError.value = false;
  });

  it('requires a valid name and file, then imports trimmed name and selected file', () => {
    const onOpenChange = vi.fn();
    render(
      <ImportTraceCollectionModal
        open
        onOpenChange={onOpenChange}
        projectId="project-1"
        projectVersionId="version-1"
      />
    );

    const submit = screen.getByRole('button', { name: 'Import trace collection' });
    expect(submit).toBeDisabled();
    const nameInput = screen.getByLabelText(/Name/);
    fireEvent.change(nameInput, { target: { value: 'x'.repeat(TRACE_COLLECTION_NAME_MIN_LENGTH - 1) } });
    expect(submit).toBeDisabled();

    const file = new File(['{"trace":1}'], 'traces.jsonl', { type: 'application/json' });
    fireEvent.change(screen.getByLabelText(/File/), { target: { files: [file] } });
    expect(screen.getByLabelText(/Name/)).toHaveValue('x'.repeat(TRACE_COLLECTION_NAME_MIN_LENGTH - 1));
    fireEvent.change(nameInput, { target: { value: '  Interview traces  ' } });
    expect(submit).toBeEnabled();
    fireEvent.click(submit);

    expect(mutate).toHaveBeenCalledWith(
      {
        projectId: 'project-1',
        projectVersionId: 'version-1',
        name: 'Interview traces',
        file,
      },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
    mutate.mock.calls[0][1].onSuccess();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('uses the file name as the default collection name', () => {
    render(
      <ImportTraceCollectionModal
        open
        onOpenChange={vi.fn()}
        projectId="project-1"
        projectVersionId="version-1"
      />
    );
    const file = new File(['{}'], 'support-traces.jsonl', { type: 'application/json' });
    fireEvent.change(screen.getByLabelText(/File/), { target: { files: [file] } });

    expect(screen.getByLabelText(/Name/)).toHaveValue('support-traces');
    expect(screen.getByText('support-traces.jsonl')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import trace collection' })).toBeEnabled();
  });

  it('rejects files larger than 500 MB', () => {
    render(
      <ImportTraceCollectionModal
        open
        onOpenChange={vi.fn()}
        projectId="project-1"
        projectVersionId="version-1"
      />
    );
    const oversizedFile = new File(['{}'], 'large.jsonl', { type: 'application/json' });
    Object.defineProperty(oversizedFile, 'size', { value: 500 * 1024 * 1024 + 1 });
    fireEvent.change(screen.getByLabelText(/File/), {
      target: { files: [oversizedFile] },
    });

    expect(screen.getByText(/File is too large/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import trace collection' })).toBeDisabled();
  });

  it('shows the error state and disables fields during import', () => {
    isError.value = true;
    isPending.value = true;
    render(
      <ImportTraceCollectionModal
        open
        onOpenChange={vi.fn()}
        projectId="project-1"
        projectVersionId="version-1"
      />
    );

    expect(screen.getByText('Import failed. Please try again.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Importing/ })).toBeDisabled();
    expect(screen.getByLabelText(/Name/)).toBeDisabled();
    expect(screen.getByLabelText(/File/)).toBeDisabled();
  });
});
