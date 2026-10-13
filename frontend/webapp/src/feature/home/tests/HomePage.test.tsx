import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import HomePage from '../HomePage';

describe('HomePage', () => {
  it('prompts the user to select a project', () => {
    render(<HomePage />);

    expect(screen.getByRole('heading', { name: 'SELECT A PROJECT' })).toBeInTheDocument();
  });
});