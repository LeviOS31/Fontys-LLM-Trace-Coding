import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTrace } from '../../traceGroup/trace/tests/traceFixtures';
import OpenCodePanel from '../OpenCodePanel';

const { mutate } = vi.hoisted(() => ({ mutate: vi.fn() }));

vi.mock('../../hooks/useAddOpencode.ts', () => ({
  useAddOpencode: () => ({ mutate, isPending: false }),
}));

function renderPanel(openCode = '') {
  const trace = createTrace([], { openCode });
  const router = createMemoryRouter(
    [
      {
        path: '/projects/:id/versions/:versionId/open-code/:traceGroupId',
        element: (
          <OpenCodePanel selectedTrace={trace} projectId="project-1" versionId="version-1" />
        ),
      },
    ],
    { initialEntries: ['/projects/project-1/versions/version-1/open-code/group-1'] }
  );
  return render(<RouterProvider router={router} />);
}

describe('OpenCodePanel', () => {
  beforeEach(() => {
    mutate.mockReset();
    mutate.mockImplementation((_variables, callbacks) => callbacks?.onSuccess?.());
  });

  it('shows an empty state when no trace is selected', () => {
    const router = createMemoryRouter([
      {
        path: '/',
        element: <OpenCodePanel projectId="project-1" versionId="version-1" />,
      },
    ]);
    render(<RouterProvider router={router} />);

    expect(screen.getByText('Select a trace to open code')).toBeInTheDocument();
  });

  it('saves a new open-code note from the editor', () => {
    renderPanel();
    fireEvent.change(screen.getByPlaceholderText('Add open code for this trace…'), {
      target: { value: 'A useful observation' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(mutate).toHaveBeenCalledWith(
      { traceId: 'trace-1', openCode: 'A useful observation' },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });

  it('does not save blank notes and cancels unsaved text', () => {
    renderPanel();
    const editor = screen.getByPlaceholderText('Add open code for this trace…');
    fireEvent.change(editor, { target: { value: '  ' } });
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
    expect(mutate).not.toHaveBeenCalled();

    fireEvent.change(editor, { target: { value: 'Draft note' } });
    fireEvent.click(screen.getByRole('button', { name: /Cancel/ }));
    expect(screen.getByPlaceholderText('Add open code for this trace…')).toHaveValue('');
  });

  it('edits existing notes and restores the saved value on Escape', () => {
    renderPanel('Saved note');
    fireEvent.click(screen.getByRole('button', { name: /Edit/ }));
    const editor = screen.getByPlaceholderText('Add open code for this trace…');
    expect(editor).toHaveValue('Saved note');

    fireEvent.change(editor, { target: { value: 'Changed draft' } });
    fireEvent.keyDown(editor, { key: 'Escape' });

    expect(screen.getByText('Saved note')).toBeInTheDocument();
    expect(screen.queryByText('Editing')).not.toBeInTheDocument();
  });

  it('saves edited notes with Enter and deletes the note after confirmation', () => {
    renderPanel('Saved note');
    fireEvent.click(screen.getByRole('button', { name: /Edit/ }));
    const editor = screen.getByPlaceholderText('Add open code for this trace…');
    fireEvent.change(editor, { target: { value: 'Updated note' } });
    fireEvent.keyDown(editor, { key: 'Enter' });
    expect(mutate).toHaveBeenCalledWith(
      { traceId: 'trace-1', openCode: 'Updated note' },
      expect.any(Object)
    );

    fireEvent.click(screen.getByRole('button', { name: /^Delete/ }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    const deleteButtons = screen.getAllByRole('button', { name: /^Delete/ });
    fireEvent.click(deleteButtons[deleteButtons.length - 1]!);
    expect(mutate).toHaveBeenLastCalledWith(
      { traceId: 'trace-1', openCode: '' },
      expect.any(Object)
    );
  });
});
