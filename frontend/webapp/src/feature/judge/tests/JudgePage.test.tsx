import '@testing-library/jest-dom/vitest';
import { Theme } from '@radix-ui/themes';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  JudgeCollection,
  JudgeRunListItem,
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
    onCollectionChange,
    onRun,
    canRun,
    loading,
    error,
  }: {
    templates: JudgeTemplate[];
    onTemplateChange: (ids: string[]) => void;
    onCollectionChange: (ids: string[]) => void;
    onRun: () => void;
    canRun: boolean;
    loading: boolean;
    error: RunError | null;
  }) => (
    <div>
      <ul aria-label="panel templates">
        {templates.map((template) => (
          <li key={template.id}>{template.name}</li>
        ))}
      </ul>
      <button onClick={() => onTemplateChange(['t1', 't2'])}>Pick templates</button>
      <button onClick={() => onTemplateChange(['t3'])}>Pick deprecated</button>
      <button onClick={() => onCollectionChange(['trace-c1', 'trace-c2'])}>
        Pick trace collections
      </button>
      <button onClick={() => onCollectionChange([])}>Clear trace collections</button>
      <button disabled={!canRun} onClick={onRun}>
        Run
      </button>
      {loading && <span>running</span>}
      {error && <p role="alert">{error.message}</p>}
    </div>
  ),
}));

vi.mock('../components/JudgeCollectionOverview.tsx', () => ({
  default: ({
    collections,
    loading,
    onSelect,
    onRename,
    onDelete,
  }: {
    collections: JudgeCollection[];
    loading: boolean;
    onSelect: (id: string) => void;
    onRename: (id: string, name: string) => Promise<boolean>;
    onDelete: (id: string) => Promise<boolean>;
  }) => (
    <div data-testid="collections">
      {loading && <span>Loading collections</span>}
      {collections.map((collection) => (
        <div key={collection.judgeCollectionId}>
          <button onClick={() => onSelect(collection.judgeCollectionId)}>{collection.name}</button>
          <button onClick={() => void onRename(collection.judgeCollectionId, 'Renamed collection')}>
            Rename {collection.name}
          </button>
          <button onClick={() => void onDelete(collection.judgeCollectionId)}>
            Delete {collection.name}
          </button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock('../components/JudgeOverview.tsx', () => ({
  default: ({
    collectionName,
    runs,
    hasMore,
    onBack,
    onLoadMore,
    onSelect,
    onDelete,
  }: {
    collectionName: string;
    runs: JudgeRunListItem[];
    hasMore: boolean;
    onBack: () => void;
    onLoadMore: () => void;
    onSelect: (id: string) => void;
    onDelete: (id: string) => Promise<boolean>;
  }) => (
    <div data-testid="overview">
      <h2>{collectionName}</h2>
      {runs.map((run) => (
        <div key={run.judgeRunId}>
          <button onClick={() => onSelect(run.judgeRunId)}>
            {`${run.name ?? 'Judge run'} (${run.judgeRunId})`}
          </button>
          <button onClick={() => void onDelete(run.judgeRunId)}>
            {`Delete ${run.name ?? 'Judge run'} (${run.judgeRunId})`}
          </button>
        </div>
      ))}
      {hasMore && <button onClick={onLoadMore}>Load more</button>}
      <button onClick={onBack}>All judge collections</button>
    </div>
  ),
}));

vi.mock('../components/JudgeRunDetails.tsx', () => ({
  default: ({
    run,
    results,
    resultsLoading,
    onBack,
  }: {
    run: { judgeRunId: string };
    results: JudgeResult[] | null;
    resultsLoading: boolean;
    onBack: () => void;
  }) => (
    <div data-testid="details">
      <span>{run.judgeRunId}</span>
      <span>{results ? `${results.length} results` : 'no results'}</span>
      {resultsLoading && <span>loading results</span>}
      <button onClick={onBack}>Back to runs</button>
    </div>
  ),
}));

const templates: JudgeTemplate[] = [
  { id: 't4', axialCodeId: 'a1', name: 'Reliability (old)', isDeprecated: true },
  { id: 't1', axialCodeId: 'a1', name: 'Reliability', isDeprecated: false },
  { id: 't2', axialCodeId: 'a2', name: 'Latency', isDeprecated: false },
  { id: 't3', axialCodeId: 'a3', name: 'Retired', isDeprecated: true },
];

const makeCollection = (id: string, name: string): JudgeCollection => ({
  judgeCollectionId: id,
  name,
  versionId: 'v1',
  createdAt: '2025-01-15T12:00:00Z',
  runCount: 1,
  traceCount: 2,
  succesCount: 3,
  failCount: 4
});

const makeRun = (id: string): JudgeRunSummary => ({
  judgeRunId: id,
  judgeTemplateId: id === 'run-1' ? 't1' : 't2',
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
let collectionReply: Reply;
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
  collectionReply = {
    body: { judgeCollections: [makeCollection('collection-1', 'Judge Collection 1')] },
  };
  listReply = { body: { judgeRuns: [makeRun('run-1')], totals: makeTotals(1) } };
  nextPageReply = { body: { judgeRuns: [], totals: makeTotals(1) } };
  postReply = { body: { judgeCollectionId: 'collection-2', results: [] } };

  fetchMock.mockReset();
  fetchMock.mockImplementation((input: unknown, init?: RequestInit) => {
    const url = new URL(String(input));
    const method = init?.method ?? 'GET';

    if (url.pathname.endsWith('/judge-templates')) {
      return respond({ body: { judgeTemplates: templates } });
    }
    if (url.pathname.endsWith('/judgecollection') && method === 'GET') {
      return respond(collectionReply);
    }
    if (/\/judgecollection\/[^/]+$/.test(url.pathname) && method === 'PUT') {
      return respond({ body: {} });
    }
    if (/\/judgecollection\/[^/]+$/.test(url.pathname) && method === 'DELETE') {
      return respond({ body: {} });
    }
    if (url.pathname.endsWith('/judge') && method === 'POST') return respond(postReply);
    if (/\/judgecollection\/[^/]+\/judge-runs\/[^/]+$/.test(url.pathname)) {
      return respond({ body: method === 'DELETE' ? {} : { results: [] } });
    }
    if (/\/judgecollections\/[^/]+\/judge-runs$/.test(url.pathname)) {
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

const pickSelection = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Pick templates' }));
  fireEvent.click(screen.getByRole('button', { name: 'Pick trace collections' }));
};

describe('JudgePage', () => {
  it('redirects to not-found if the project/version route parameters are absent', () => {
    renderPage('/judge');
    expect(screen.getByText('Not found')).toBeInTheDocument();
  });

  it('starts with judge collections and loads runs after selecting a collection', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Judge Collection 1' }));

    expect(await screen.findByTestId('overview')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Judge Collection 1' })).toBeInTheDocument();
    expect(
      calls().some(([input]) =>
        String(input).includes('/judgecollections/collection-1/judge-runs?limit=20&offset=0')
      )
    ).toBe(true);
  });

  it('saves a renamed collection and updates its displayed name', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Rename Judge Collection 1' }));

    expect(await screen.findByRole('button', { name: 'Renamed collection' })).toBeInTheDocument();
    const [[url, init]] = callsWithMethod('PUT');
    expect(String(url)).toBe(
      'http://localhost/v1/projects/p1/versions/v1/judgecollection/collection-1'
    );
    expect(JSON.parse(String(init?.body))).toEqual({ name: 'Renamed collection' });
  });

  it('deletes a judge collection and removes it from the list', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Delete Judge Collection 1' }));

    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Judge Collection 1' })).not.toBeInTheDocument()
    );
    const [[url, init]] = callsWithMethod('DELETE');
    expect(String(url)).toBe(
      'http://localhost/v1/projects/p1/versions/v1/judgecollection/collection-1'
    );
    expect(init?.method).toBe('DELETE');
  });

  it('only offers active templates to the panel', async () => {
    renderPage();
    await screen.findByRole('button', { name: 'Judge Collection 1' });
    const list = screen.getByRole('list', { name: 'panel templates' });
    expect(list).toHaveTextContent('Reliability');
    expect(list).toHaveTextContent('Latency');
    expect(list).not.toHaveTextContent('Retired');
    expect(list).not.toHaveTextContent('(old)');
  });

  it('posts the selected IDs and opens the new collection after the judge completes', async () => {
    renderPage();
    await screen.findByRole('button', { name: 'Judge Collection 1' });
    pickSelection();

    collectionReply = {
      body: {
        judgeCollections: [
          makeCollection('collection-2', 'Judge Collection 2'),
          makeCollection('collection-1', 'Judge Collection 1'),
        ],
      },
    };
    listReply = { body: { judgeRuns: [makeRun('run-2')], totals: makeTotals(1) } };
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));

    expect(await screen.findByTestId('overview')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Judge Collection 2' })).toBeInTheDocument();

    const [[postUrl, postInit]] = callsWithMethod('POST');
    expect(String(postUrl)).toBe('http://localhost/v1/projects/p1/versions/v1/judge');
    expect(postInit?.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(String(postInit?.body))).toEqual({
      judgeTemplateIds: ['t1', 't2'],
      traceCollectionIds: ['trace-c1', 'trace-c2'],
    });
  });

  it('navigates from collections to runs to judged traces and back', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Judge Collection 1' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Reliability (run-1)' }));

    expect(await screen.findByTestId('details')).toBeInTheDocument();
    expect(await screen.findByText('0 results')).toBeInTheDocument();
    expect(
      calls().some(([input]) =>
        String(input).endsWith('/judgecollection/collection-1/judge-runs/run-1')
      )
    ).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Back to runs' }));
    expect(screen.getByTestId('overview')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'All judge collections' }));
    expect(screen.getByTestId('collections')).toBeInTheDocument();
  });

  it('loads the next run page for the selected collection', async () => {
    listReply = { body: { judgeRuns: [makeRun('run-1')], totals: makeTotals(2) } };
    nextPageReply = { body: { judgeRuns: [makeRun('run-2')], totals: makeTotals(2) } };
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Judge Collection 1' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Load more' }));

    expect(await screen.findByRole('button', { name: 'Latency (run-2)' })).toBeInTheDocument();
    expect(
      calls().some(([input]) =>
        String(input).endsWith('/judgecollections/collection-1/judge-runs?limit=20&offset=1')
      )
    ).toBe(true);
  });

  it('deletes a run from its card and refreshes the collection', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Judge Collection 1' }));
    listReply = { body: { judgeRuns: [], totals: makeTotals(0) } };
    fireEvent.click(await screen.findByRole('button', { name: 'Delete Reliability (run-1)' }));

    await waitFor(() => expect(screen.queryByRole('button', { name: 'Reliability (run-1)' })).not.toBeInTheDocument());
    expect(screen.getByTestId('overview')).toBeInTheDocument();
    const [[deleteUrl]] = callsWithMethod('DELETE');
    expect(String(deleteUrl)).toBe(
      'http://localhost/v1/projects/p1/versions/v1/judgecollection/collection-1/judge-runs/run-1'
    );
    expect(screen.queryByRole('button', { name: 'Reliability (run-1)' })).not.toBeInTheDocument();
  });

  it('shows an error when the judge request fails', async () => {
    postReply = { status: 500, body: { detail: 'boom' } };
    renderPage();
    await screen.findByRole('button', { name: 'Judge Collection 1' });
    pickSelection();
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Request failed (500).');
  });
});
