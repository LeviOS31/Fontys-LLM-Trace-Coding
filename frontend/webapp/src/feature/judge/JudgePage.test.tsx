import '@testing-library/jest-dom/vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import JudgePage from './JudgePage';

const templates = [
  { id: 'tmpl-1', axialCodeId: 'axial-1', name: 'Reliability judge', isDeprecated: false },
  { id: 'tmpl-2', axialCodeId: 'axial-2', name: 'Retired judge', isDeprecated: true },
];

const judgeResponse = {
  judgeRunId: 'run-1',
  results: [
    {
      traceId: 'trace-1',
      status: 'Success',
      verdict: 'True',
      reasoning: 'Matches the axial code.',
      error: null,
    },
  ],
};

function jsonResponse(body: unknown, ok = true) {
  return Promise.resolve({ ok, json: () => Promise.resolve(body) } as Response);
}

function renderPage(path = '/projects/project-1/versions/version-1/judge') {
  const router = createMemoryRouter(
    [{ path: '/projects/:id/versions/:versionId/judge', element: <JudgePage /> }],
    { initialEntries: [path] }
  );
  return render(<RouterProvider router={router} />);
}

async function selectTemplateAndRun() {
  await waitFor(() => screen.getByRole('option', { name: 'Reliability judge' }));
  fireEvent.change(screen.getByLabelText('Judge template'), { target: { value: 'tmpl-1' } });
  fireEvent.click(screen.getByRole('button', { name: 'Run judge' }));
}

describe('JudgePage', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string | URL) =>
        String(url).includes('/judge-templates')
          ? jsonResponse({ judgeTemplates: templates })
          : jsonResponse(judgeResponse)
      )
    );
  });

  it('loads judge templates and filters out deprecated ones', async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Reliability judge' })).toBeInTheDocument()
    );
    expect(screen.queryByRole('option', { name: 'Retired judge' })).not.toBeInTheDocument();
  });

  it('keeps the run button disabled until a template is selected', async () => {
    renderPage();
    await waitFor(() => screen.getByRole('option', { name: 'Reliability judge' }));
    expect(screen.getByRole('button', { name: 'Run judge' })).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Judge template'), { target: { value: 'tmpl-1' } });
    expect(screen.getByRole('button', { name: 'Run judge' })).toBeEnabled();
  });

  it("runs the judge against the selected template's axial code and renders formatted results", async () => {
    renderPage();
    await selectTemplateAndRun();

    await waitFor(() => expect(screen.getByText('run-1')).toBeInTheDocument());

    expect(fetch).toHaveBeenLastCalledWith(
      expect.stringContaining('/axial-codes/axial-1/judge'),
      { method: 'POST' }
    );
    expect(screen.getByText('1 result')).toBeInTheDocument();
    expect(screen.getByText('Matches the axial code.')).toBeInTheDocument();
  });

  it('shows a loading state while the request is in flight', async () => {
    let resolveFetch: () => void = () => {};
    (fetch as unknown as ReturnType<typeof vi.fn>).mockImplementation((url: string | URL) => {
      if (String(url).includes('/judge-templates')) return jsonResponse({ judgeTemplates: templates });
      return new Promise((resolve) => {
        resolveFetch = () => resolve({ ok: true, json: () => Promise.resolve(judgeResponse) } as Response);
      });
    });

    renderPage();
    await selectTemplateAndRun();

    expect(screen.getByRole('button', { name: /Running judge/ })).toBeDisabled();

    await act(async () => resolveFetch());
    await waitFor(() => expect(screen.getByText('run-1')).toBeInTheDocument());
  });

  it('falls back to the raw JSON view on request failure', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockImplementation((url: string | URL) =>
      String(url).includes('/judge-templates')
        ? jsonResponse({ judgeTemplates: templates })
        : jsonResponse({ error: 'boom' }, false)
    );

    renderPage();
    await selectTemplateAndRun();

    await waitFor(() => expect(screen.getByText('Request failed')).toBeInTheDocument());
    expect(screen.getByText(/"error": "boom"/)).toBeInTheDocument();
  });

  it('toggles between formatted and raw views', async () => {
    renderPage();
    await selectTemplateAndRun();
    await waitFor(() => screen.getByText('run-1'));

    fireEvent.click(screen.getByRole('button', { name: 'JSON' }));
    expect(screen.getByText(/"judgeRunId": "run-1"/)).toBeInTheDocument();
  });

  it('copies the raw response to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    renderPage();
    await selectTemplateAndRun();
    await waitFor(() => screen.getByText('run-1'));

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(expect.stringContaining('run-1')));
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
  });
});