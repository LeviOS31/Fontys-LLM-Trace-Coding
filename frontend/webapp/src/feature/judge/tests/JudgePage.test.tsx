import '@testing-library/jest-dom/vitest';
import { Theme } from '@radix-ui/themes';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  JudgeResult,
  JudgeRunSummary,
  JudgeRunTotals,
  JudgeTemplate,
  RunError,
} from '../hooks/judgeUtils';
import JudgePage from '../JudgePage';

vi.mock('../../../shared/api/api', () => ({ BASE_URL: 'http://localhost' }));

vi.mock('../components/JudgeRunPanel.tsx', () => ({
  default: ({
    templates,
    onTemplateChange,
    onRun,
    canRun,
    loading,
    error,
  }: {
    templates: JudgeTemplate[];
    onTemplateChange: (ids: string[]) => void;
    onRun: () => void;
    canRun: boolean;
    loading: boolean;
    error: RunError | null;
  }) => (
    <div>
      <ul aria-label="panel templates">
        {templates.map((t) => (
          <li key={t.id}>{t.name}</li>
        ))}
      </ul>
      <button onClick={() => onTemplateChange(['t1', 't2'])}>Pick templates</button>
      <button onClick={() => onTemplateChange(['t3'])}>Pick deprecated</button>
      <button disabled={!canRun} onClick={onRun}>
        Run
      </button>
      {loading && <span>running</span>}
      {error && <p role="alert">{error.message}</p>}
    </div>
  ),
}));

vi.mock('../components/JudgeOverview.tsx', () => ({
  default: ({
    runs,
    hasMore,
    onLoadMore,
    onSelect,
  }: {
    runs: { judgeRunId: string; templateName: string }[];
    hasMore: boolean;
    onLoadMore: () => void;
    onSelect: (id: string) => void;
  }) => (
    <div data-testid="overview">
      {runs.map((r) => (
        <button key={r.judgeRunId} onClick={() => onSelect(r.judgeRunId)}>
          {`${r.templateName} (${r.judgeRunId})`}
        </button>
      ))}
      {hasMore && <button onClick={onLoadMore}>Load more</button>}
    </div>
  ),
}));

vi.mock('../components/JudgeRunDetails.tsx', () => ({
  default: ({
    run,
    results,
    resultsLoading,
    onBack,
    onDelete,
  }: {
    run: { templateName: string };
    results: JudgeResult[] | null;
    resultsLoading: boolean;
    onBack: () => void;
    onDelete: () => void;
  }) => (
    <div data-testid="details">
      <span>{run.templateName}</span>
      <span>{results ? `${results.length} results` : 'no results'}</span>
      {resultsLoading && <span>loading results</span>}
      <button onClick={onBack}>Back</button>
      <button onClick={onDelete}>Delete</button>
    </div>
  ),
}));

const templates: JudgeTemplate[] = [
  // Deprecated duplicate of a1 listed first: the active template must win.
  { id: 't4', axialCodeId: 'a1', name: 'Reliability (old)', isDeprecated: true },
  { id: 't1', axialCodeId: 'a1', name: 'Reliability', isDeprecated: false },
  { id: 't2', axialCodeId: 'a2', name: 'Latency', isDeprecated: false },
  { id: 't3', axialCodeId: 'a3', name: 'Retired', isDeprecated: true },
];

const makeRun = (id: string, axialCodeId: string): JudgeRunSummary => ({
  judgeRunId: id,
  axialCodeId,
  createdAt: '2025-01-15T12:00:00Z',
  totalCount: 3,
  trueCount: 2,
  falseCount: 1,
  failedCount: 0,
});

const makeTotals = (runs: number): JudgeRunTotals => ({
  runs,
  totalCount: runs * 3,
  trueCount: runs * 2,
  falseCount: runs,
  failedCount: 0,
});

const fetchMock = vi.fn();

type Reply = { status?: number; body?: unknown; reject?: boolean };
let listReply: Reply;
let nextPageReply: Reply;
let postReply: Reply;

function respond({ status = 200, body = {}, reject }: Reply) {
  if (reject) return Promise.reject(new Error('network down'));
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });
}

beforeEach(() => {
  listReply = { body: { judgeRuns: [makeRun('run-1', 'a1')], totals: makeTotals(1) } };
  nextPageReply = { body: { judgeRuns: [], totals: makeTotals(1) } };
  postReply = { body: { judgeRunId: 'run-2', results: [] } };

  fetchMock.mockReset();
  fetchMock.mockImplementation((input: unknown, init?: RequestInit) => {
    const url = new URL(String(input));
    const method = init?.method ?? 'GET';

    if (url.pathname.endsWith('/judge-templates')) {
      return respond({ body: { judgeTemplates: templates } });
    }
    if (url.pathname.endsWith('/judge') && method === 'POST') return respond(postReply);
    if (/\/judge-runs\/[^/]+$/.test(url.pathname)) {
      return respond({ body: method === 'DELETE' ? {} : { results: [] } });
    }
    if (url.pathname.endsWith('/judge-runs')) {
      return respond(url.searchParams.get('offset') === '0' ? listReply : nextPageReply);
    }
    return respond({ status: 404 });
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderPage(path = '/projects/p1/versions/v1/judge') {
  const router = createMemoryRouter(
    [
      { path: '/404', element: <div>Not found</div> },
      { path: '/judge', element: <JudgePage /> },
      { path: '/projects/:id/versions/:versionId/judge', element: <JudgePage /> },
    ],
    { initialEntries: [path] }
  );
  return render(
    <Theme>
      <RouterProvider router={router} />
    </Theme>
  );
}

const calls = () => fetchMock.mock.calls as [unknown, RequestInit | undefined][];
const callsWithMethod = (method: string) => calls().filter(([, init]) => init?.method === method);

describe('JudgePage', () => {
  it('redirects to not-found if the project/version route parameters are absent', () => {
    renderPage('/judge');
    expect(screen.getByText('Not found')).toBeInTheDocument();
  });

  it('only offers active templates to the panel', async () => {
    renderPage();
    await screen.findByRole('button', { name: 'Reliability (run-1)' });
    const list = screen.getByRole('list', { name: 'panel templates' });
    expect(list).toHaveTextContent('Reliability');
    expect(list).toHaveTextContent('Latency');
    expect(list).not.toHaveTextContent('Retired');
    expect(list).not.toHaveTextContent('(old)');
  });

  it('requests the first page of runs with the page size', async () => {
    renderPage();
    await screen.findByTestId('overview');
    const listCall = calls().find(([url]) => String(url).endsWith('judge-runs?limit=20&offset=0'));
    expect(listCall).toBeDefined();
  });

  describe('template names', () => {
    it('prefers the active template for an axial code', async () => {
      renderPage();
      expect(
        await screen.findByRole('button', { name: 'Reliability (run-1)' })
      ).toBeInTheDocument();
    });

    it('falls back to a deprecated template when no active one exists', async () => {
      listReply = { body: { judgeRuns: [makeRun('run-1', 'a3')], totals: makeTotals(1) } };
      renderPage();
      expect(await screen.findByRole('button', { name: 'Retired (run-1)' })).toBeInTheDocument();
    });

    it('shows "Unknown template" when nothing matches', async () => {
      listReply = { body: { judgeRuns: [makeRun('run-1', 'zzz')], totals: makeTotals(1) } };
      renderPage();
      expect(
        await screen.findByRole('button', { name: 'Unknown template (run-1)' })
      ).toBeInTheDocument();
    });
  });

  describe('running the judge', () => {
    it('cannot run until an active template is selected', async () => {
      renderPage();
      await screen.findByTestId('overview');
      const run = screen.getByRole('button', { name: 'Run' });
      expect(run).toBeDisabled();

      // A deprecated template is not selectable, so it does not enable running.
      fireEvent.click(screen.getByRole('button', { name: 'Pick deprecated' }));
      expect(run).toBeDisabled();

      fireEvent.click(screen.getByRole('button', { name: 'Pick templates' }));
      expect(run).toBeEnabled();
    });

    it('posts the axial code ids, reloads the list and opens the new run', async () => {
      renderPage();
      await screen.findByTestId('overview');
      fireEvent.click(screen.getByRole('button', { name: 'Pick templates' }));

      postReply = { body: { judgeRunId: 'run-2', results: [] } };
      listReply = {
        body: {
          judgeRuns: [makeRun('run-2', 'a2'), makeRun('run-1', 'a1')],
          totals: makeTotals(2),
        },
      };
      fireEvent.click(screen.getByRole('button', { name: 'Run' }));

      const details = await screen.findByTestId('details');
      expect(within(details).getByText('Latency')).toBeInTheDocument();
      expect(await within(details).findByText('0 results')).toBeInTheDocument();

      const [[postUrl, postInit]] = callsWithMethod('POST');
      expect(String(postUrl)).toBe('http://localhost/v1/projects/p1/versions/v1/judge');
      expect(postInit?.headers).toEqual({ 'Content-Type': 'application/json' });
      expect(JSON.parse(String(postInit?.body))).toEqual({ axialCodeIds: ['a1', 'a2'] });
    });

    it('shows the status code when the request fails', async () => {
      postReply = { status: 500, body: { detail: 'boom' } };
      renderPage();
      await screen.findByTestId('overview');
      fireEvent.click(screen.getByRole('button', { name: 'Pick templates' }));
      fireEvent.click(screen.getByRole('button', { name: 'Run' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('Request failed (500).');
      expect(screen.queryByTestId('details')).not.toBeInTheDocument();
      expect(screen.queryByText('running')).not.toBeInTheDocument();
    });

    it('reports an unexpected response shape', async () => {
      postReply = { body: { unexpected: true } };
      renderPage();
      await screen.findByTestId('overview');
      fireEvent.click(screen.getByRole('button', { name: 'Pick templates' }));
      fireEvent.click(screen.getByRole('button', { name: 'Run' }));

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'The judge returned an unexpected response.'
      );
    });

    it('reports a network failure', async () => {
      postReply = { reject: true };
      renderPage();
      await screen.findByTestId('overview');
      fireEvent.click(screen.getByRole('button', { name: 'Pick templates' }));
      fireEvent.click(screen.getByRole('button', { name: 'Run' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('Request failed.');
    });
  });

  describe('run list', () => {
    it('shows an error when the runs cannot be loaded', async () => {
      listReply = { status: 500 };
      renderPage();
      expect(await screen.findByRole('alert')).toHaveTextContent('Could not load judge runs.');
    });

    it('appends the next page when loading more', async () => {
      listReply = { body: { judgeRuns: [makeRun('run-1', 'a1')], totals: makeTotals(2) } };
      nextPageReply = { body: { judgeRuns: [makeRun('run-2', 'a2')], totals: makeTotals(2) } };
      renderPage();

      fireEvent.click(await screen.findByRole('button', { name: 'Load more' }));

      expect(await screen.findByRole('button', { name: 'Latency (run-2)' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reliability (run-1)' })).toBeInTheDocument();
      expect(calls().some(([url]) => String(url).endsWith('judge-runs?limit=20&offset=1'))).toBe(
        true
      );
      // Everything is loaded now, so the button disappears.
      expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
    });

    it('does not offer more when every run is loaded', async () => {
      renderPage();
      await screen.findByTestId('overview');
      expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
    });
  });

  describe('run details', () => {
    it('opens a run, loads its results and returns to the overview', async () => {
      renderPage();
      fireEvent.click(await screen.findByRole('button', { name: 'Reliability (run-1)' }));

      expect(await screen.findByTestId('details')).toBeInTheDocument();
      expect(await screen.findByText('0 results')).toBeInTheDocument();
      expect(calls().some(([url]) => String(url).endsWith('/judge-runs/run-1'))).toBe(true);

      fireEvent.click(screen.getByRole('button', { name: 'Back' }));
      expect(screen.getByTestId('overview')).toBeInTheDocument();
      expect(screen.queryByTestId('details')).not.toBeInTheDocument();
    });

    it('deletes the run and returns to the refreshed overview', async () => {
      renderPage();
      fireEvent.click(await screen.findByRole('button', { name: 'Reliability (run-1)' }));
      await screen.findByTestId('details');

      listReply = { body: { judgeRuns: [], totals: makeTotals(0) } };
      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

      await waitFor(() => expect(screen.getByTestId('overview')).toBeInTheDocument());
      const [[deleteUrl]] = callsWithMethod('DELETE');
      expect(String(deleteUrl)).toBe(
        'http://localhost/v1/projects/p1/versions/v1/judge-runs/run-1'
      );
      expect(screen.queryByRole('button', { name: 'Reliability (run-1)' })).not.toBeInTheDocument();
    });
  });
});
