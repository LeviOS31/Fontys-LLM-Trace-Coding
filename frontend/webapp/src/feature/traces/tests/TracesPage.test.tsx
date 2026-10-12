import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import TracesPage from '../TracesPage';

describe('TracesPage', () => {
  it('renders the fixed version heading', () => {
    render(<TracesPage />);

    expect(screen.getByRole('heading', { name: 'Version 1' })).toBeInTheDocument();
  });
});