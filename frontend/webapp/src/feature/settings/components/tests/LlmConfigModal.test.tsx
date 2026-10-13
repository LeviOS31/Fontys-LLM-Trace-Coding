import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LlmStatus } from '../../../../shared/types/settings';
import { LlmConfigModal } from '../LlmConfigModal';

const { mutate, reset, isPending, isError, defaultConfig, isResetting } = vi.hoisted(() => ({
  mutate: vi.fn(),
  reset: vi.fn(),
  isPending: { value: false },
  isError: { value: false },
  defaultConfig: { value: undefined as LlmStatus | undefined },
  isResetting: { value: false },
}));
vi.mock('../../hooks/useSetLlmConfig.ts', () => ({
  useSetLlmConfig: () => ({
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
vi.mock('../../hooks/useGetDefaultLlmConfig.ts', () => ({
  useGetDefaultLlmConfig: () => ({
    get data() {
      return defaultConfig.value;
    },
    get isFetching() {
      return isResetting.value;
    },
  }),
}));
vi.mock('../../../../shared/components/Modal.tsx', () => ({
  default: ({
    open,
    title,
    children,
  }: React.PropsWithChildren<{ open: boolean; title: string }>) =>
    open ? <div role="dialog" aria-label={title}>{children}</div> : null,
}));
vi.mock('@radix-ui/themes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@radix-ui/themes')>();
  return {
    ...actual,
    Dialog: { ...actual.Dialog, Close: ({ children }: React.PropsWithChildren) => children },
    Tooltip: ({ children }: React.PropsWithChildren) => children,
  };
});

describe('LlmConfigModal', () => {
  beforeEach(() => {
    mutate.mockReset();
    reset.mockReset();
    isPending.value = false;
    isError.value = false;
    defaultConfig.value = undefined;
    isResetting.value = false;
  });

  it('requires all three fields and a valid endpoint, then saves trimmed configuration', () => {
    const onOpenChange = vi.fn();
    render(
      <LlmConfigModal
        open
        onOpenChange={onOpenChange}
        status={{
          providerName: 'Provider',
          endpoint: 'https://api.example.com',
          modelName: 'model-1',
        }}
      />
    );

    const save = screen.getByRole('button', { name: 'Save' });
    expect(save).toBeEnabled();
    fireEvent.change(screen.getByLabelText('Endpoint'), { target: { value: 'not a url' } });
    expect(save).toBeDisabled();
    expect(screen.getByText(/Endpoint must be a valid URL/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Endpoint'), {
      target: { value: ' https://api.example.com/v1 ' },
    });
    fireEvent.change(screen.getByLabelText('Provider name'), {
      target: { value: ' Provider X ' },
    });
    fireEvent.change(screen.getByLabelText('Model name'), { target: { value: ' model-x ' } });
    fireEvent.click(save);

    expect(mutate).toHaveBeenCalledWith(
      {
        providerName: 'Provider X',
        endpoint: 'https://api.example.com/v1',
        modelName: 'model-x',
      },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
    mutate.mock.calls[0][1].onSuccess();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('allows clearing all fields but rejects partially completed configuration', () => {
    render(
      <LlmConfigModal
        open
        onOpenChange={vi.fn()}
        status={{
          providerName: 'Provider',
          endpoint: 'https://api.example.com',
          modelName: 'model-1',
        }}
      />
    );
    const save = screen.getByRole('button', { name: 'Save' });
    fireEvent.change(screen.getByLabelText('Endpoint'), { target: { value: '' } });
    expect(save).toBeDisabled();
    expect(
      screen.getByText(/Provide a provider, endpoint, and model, or clear all fields/)
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Provider name'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Model name'), { target: { value: '' } });
    expect(save).toBeEnabled();
    fireEvent.click(save);
    expect(mutate).toHaveBeenCalledWith(
      { providerName: null, endpoint: null, modelName: null },
      expect.any(Object)
    );
  });

  it('loads defaults, reports missing defaults, and shows update errors', () => {
    isError.value = true;
    defaultConfig.value = {
      providerName: 'Default provider',
      endpoint: 'https://default.example.com',
      modelName: 'default-model',
    };
    render(<LlmConfigModal open onOpenChange={vi.fn()} />);

    expect(screen.getByText(/Failed to update configuration/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset to default' }));
    expect(screen.getByLabelText('Provider name')).toHaveValue('Default provider');
    expect(screen.getByLabelText('Endpoint')).toHaveValue('https://default.example.com');
    expect(screen.getByLabelText('Model name')).toHaveValue('default-model');
  });

  it('reports when defaults have not loaded and disables controls while saving', () => {
    const props = { open: true, onOpenChange: vi.fn() };
    const { rerender } = render(<LlmConfigModal {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Reset to default' }));
    expect(screen.getByText(/Failed to load default configuration/)).toBeInTheDocument();

    isPending.value = true;
    rerender(<LlmConfigModal {...props} />);
    expect(screen.getByLabelText('Provider name')).toBeDisabled();
  });
});
