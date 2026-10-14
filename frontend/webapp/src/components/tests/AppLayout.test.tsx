import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../Sidebar.tsx', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar mock</div>,
}));

import { AppLayout } from '../AppLayout.tsx';

describe('AppLayout', () => {
  it('renders the sidebar and outlet in the default layout', () => {
    render(
      <MemoryRouter initialEntries={['/projects/project-1/versions/version-1/overview']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/projects/:id/versions/:versionId/overview" element={<div>Overview page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByText('Overview page')).toBeInTheDocument();
  });

  it('uses full-bleed styling for the open-code route', () => {
    render(
      <MemoryRouter initialEntries={['/projects/project-1/versions/version-1/open-code/trace']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/projects/:id/versions/:versionId/open-code/*" element={<div>Open code page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    const content = screen.getByText('Open code page').parentElement as HTMLElement;
    const style = content?.getAttribute('style') ?? '';
    expect(style).toContain('height: 100vh');
    expect(style).toContain('overflow: hidden');
  });
});
