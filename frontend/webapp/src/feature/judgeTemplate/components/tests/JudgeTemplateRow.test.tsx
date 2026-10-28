import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { JudgeTemplate } from '../../../../shared/types/judgeTemplate';
import { JudgeTemplateRow } from '../JudgeTemplateRow';

const template: JudgeTemplate = {
  id: 'template-1',
  axialCodeId: 'axial-1',
  name: 'Communication judge',
  description: 'Reviews communication behaviors',
  template: 'Evaluate communication.',
  isDeprecated: true,
  currentVersionNumber: 2,
};

describe('JudgeTemplateRow', () => {
  it('opens the selected template on click and Enter', () => {
    const onOpen = vi.fn();
    render(
      <JudgeTemplateRow
        template={template}
        axialCodeLabel="Communication"
        onOpen={onOpen}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Communication judge')).toBeInTheDocument();
    expect(screen.getByText('Communication')).toBeInTheDocument();
    expect(screen.getByText('Not synced')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Communication judge/ }));
    fireEvent.keyDown(screen.getByRole('button', { name: /Communication judge/ }), {
      key: 'Enter',
    });

    expect(onOpen).toHaveBeenCalledTimes(2);
    expect(onOpen).toHaveBeenCalledWith(template);
  });

  it('asks for confirmation before deleting the template', () => {
    const onDelete = vi.fn();
    render(
      <JudgeTemplateRow
        template={template}
        onOpen={vi.fn()}
        onDelete={onDelete}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete template' }));
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onDelete).toHaveBeenCalledWith('template-1');
  });
});