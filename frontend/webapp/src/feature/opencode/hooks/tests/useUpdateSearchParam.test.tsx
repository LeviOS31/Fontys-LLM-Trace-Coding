import '@testing-library/jest-dom/vitest';
import { act, render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { useUpdateSearchParam } from '../useUpdateSearchParam';

describe('useUpdateSearchParam', () => {
  it('updates one parameter while preserving the current nested path and other parameters', async () => {
    let update!: ReturnType<typeof useUpdateSearchParam>;
    const router = createMemoryRouter(
      [
        {
          path: '/projects/:projectId/versions/:versionId/open-code/:traceGroupId',
          element: <Probe onReady={(callback) => (update = callback)} />,
        },
      ],
      { initialEntries: ['/projects/p1/versions/v1/open-code/group-1?traceId=t1&keep=yes'] }
    );

    render(<RouterProvider router={router} />);
    act(() => update('traceId', 't2'));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(router.state.location.pathname).toBe('/projects/p1/versions/v1/open-code/group-1');
    expect(new URLSearchParams(router.state.location.search).get('traceId')).toBe('t2');
    expect(new URLSearchParams(router.state.location.search).get('keep')).toBe('yes');
  });

  it.each([null, '', false])('removes a query parameter when assigned %s', async (value) => {
    let update!: ReturnType<typeof useUpdateSearchParam>;
    const router = createMemoryRouter(
      [
        {
          path: '/projects/:projectId/versions/:versionId/open-code/:traceGroupId',
          element: <Probe onReady={(callback) => (update = callback)} />,
        },
      ],
      { initialEntries: ['/projects/p1/versions/v1/open-code/group-1?q=search'] }
    );

    render(<RouterProvider router={router} />);
    act(() => update('q', value));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(router.state.location.search).toBe('');
  });
});

function Probe({
  onReady,
}: {
  onReady: (callback: ReturnType<typeof useUpdateSearchParam>) => void;
}) {
  const update = useUpdateSearchParam();
  onReady(update);
  return null;
}
