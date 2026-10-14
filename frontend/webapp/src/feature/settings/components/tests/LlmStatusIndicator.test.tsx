import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LlmStatusIndicator } from '../LlmStatusIndicator';

const { useGetLlmStatus } = vi.hoisted(() => ({ useGetLlmStatus: vi.fn() }));
vi.mock('../../hooks/useGetLlmStatus.ts', () => ({ useGetLlmStatus }));
vi.mock('../LlmConfigModal.tsx', () => ({
  LlmConfigModal: ({
    open,
    status,
  }: {
    open: boolean;
    status?: { providerName?: string };
  }) => (open ? <div role="dialog">Configure {status?.providerName}</div> : null),
}));
vi.mock('@radix-ui/themes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@radix-ui/themes')>();
  return {
    ...actual,
    Tooltip: ({ children }: React.PropsWithChildren) => children,
  };
});

describe('LlmStatusIndicator', () => {
  it('shows connected provider and model and opens configuration', () => {
    useGetLlmStatus.mockReturnValue({
      data: { providerName: 'OpenAI', modelName: 'gpt-test', isConnected: true },
      isLoading: false,
      isError: false,
    });
    render(<LlmStatusIndicator />);

    expect(screen.getByText('OpenAI')).toBeInTheDocument();
    expect(screen.getByText('gpt-test')).toBeInTheDocument();
    expect(screen.getByText('online')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Configure LLM' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Configure OpenAI');
  });

  it('shows offline when the query fails and supports the collapsed layout', () => {
    useGetLlmStatus.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    const { rerender } = render(<LlmStatusIndicator />);
    expect(screen.getByText('offline')).toBeInTheDocument();

    useGetLlmStatus.mockReturnValue({
      data: { providerName: 'Local', modelName: 'small', isConnected: false },
      isLoading: false,
      isError: false,
    });
    rerender(<LlmStatusIndicator collapsed />);
    fireEvent.click(screen.getByRole('button', { name: 'Configure LLM' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Configure Local');
  });
});