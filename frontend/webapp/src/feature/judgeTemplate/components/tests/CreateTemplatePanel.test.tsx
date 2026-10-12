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

describe('CreateTemplatePanel', () => {
  it('requires a selected axial code before creating a template', () => {
    const onCreate = vi.fn();
    const onScopeChange = vi.fn();
    const props = {
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
        axialCodes={axialCodes}
        scopeAxial="axial-1"
        onScopeChange={vi.fn()}
        onCreate={vi.fn()}
        isCreating
      />
    );

    expect(screen.getByRole('button', { name: /Creating/ })).toBeDisabled();
  });
});