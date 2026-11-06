import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CreateTemplatePanel } from '../CreateTemplatePanel/CreateTemplatePanel';
import type { AxialCode } from '../../../../shared/types/axialCode';

const axialCodes: AxialCode[] = [
  {
    axialCodeId: 'axial-1',
    label: 'Communication',
    description: 'Communication behaviors',
    traceIds: [],
  },
];

const createAllProps = {
  missingCount: null,
  onCreateAll: vi.fn(),
  isCreatingAll: false,
};

describe('CreateTemplatePanel', () => {
  it('requires a selected axial code before creating a template', () => {
    const onCreate = vi.fn();
    const onScopeChange = vi.fn();
    const props = {
      ...createAllProps,
      axialCodes,
      onScopeChange,
      onCreate,
      isCreating: false,
    };
    const { rerender } = render(<CreateTemplatePanel {...props} scopeAxial="all" />);

    expect(screen.getByRole('button', { name: /Create Template/ })).toBeDisabled();
    expect(screen.getByRole('option', { name: 'Communication' })).toHaveValue('axial-1');

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'axial-1' } });
    expect(onScopeChange).toHaveBeenCalledWith('axial-1');
    rerender(<CreateTemplatePanel {...props} scopeAxial="axial-1" />);
    expect(screen.getByRole('button', { name: /Create Template/ })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: /Create Template/ }));
    expect(onCreate).toHaveBeenCalledOnce();
  });

  it('disables creation and shows progress while creating', () => {
    render(
      <CreateTemplatePanel
        {...createAllProps}
        axialCodes={axialCodes}
        scopeAxial="axial-1"
        onScopeChange={vi.fn()}
        onCreate={vi.fn()}
        isCreating
      />
    );

    expect(screen.getByRole('button', { name: /Creating/ })).toBeDisabled();
  });

  describe('create all', () => {
    const renderPanel = (overrides: Partial<React.ComponentProps<typeof CreateTemplatePanel>>) =>
      render(
        <CreateTemplatePanel
          {...createAllProps}
          axialCodes={axialCodes}
          scopeAxial="axial-1"
          onScopeChange={vi.fn()}
          onCreate={vi.fn()}
          isCreating={false}
          {...overrides}
        />
      );

    it('hides the action until the missing count is known', () => {
      renderPanel({ missingCount: null });

      expect(screen.queryByRole('button', { name: /Create all/ })).not.toBeInTheDocument();
    });

    it('creates all missing templates on click', () => {
      const onCreateAll = vi.fn();
      renderPanel({ missingCount: 3, onCreateAll });

      expect(screen.getByTestId('missing-templates-count')).toHaveTextContent(
        '3 axial codes have no judge template yet.'
      );
      fireEvent.click(screen.getByRole('button', { name: /Create all templates/ }));
      expect(onCreateAll).toHaveBeenCalledOnce();
    });

    it('disables the action when every axial code has a template', () => {
      renderPanel({ missingCount: 0 });

      expect(screen.getByTestId('missing-templates-count')).toHaveTextContent(
        'Every axial code has a judge template.'
      );
      expect(screen.getByRole('button', { name: /Create all templates/ })).toBeDisabled();
    });

    it('blocks both create actions while creating all', () => {
      renderPanel({ missingCount: 3, isCreatingAll: true });

      expect(screen.getByRole('button', { name: /Creating all/ })).toBeDisabled();
      expect(screen.getByRole('button', { name: /Create Template/ })).toBeDisabled();
    });

    it('blocks creating all while a single template is being created', () => {
      renderPanel({ missingCount: 3, isCreating: true });

      expect(screen.getByRole('button', { name: /Create all templates/ })).toBeDisabled();
    });

    it('names the axial codes that failed', () => {
      renderPanel({
        missingCount: 1,
        createAllResult: { createdCount: 2, failedLabels: ['Communication'] },
      });

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Created 2 of 3 templates. Could not create: Communication.'
      );
    });

    it('shows no error when every template was created', () => {
      renderPanel({ missingCount: 0, createAllResult: { createdCount: 3, failedLabels: [] } });

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
