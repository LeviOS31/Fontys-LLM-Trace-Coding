import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { JudgeTemplate } from '../../../../shared/types/judgeTemplate';
import { JudgeTemplateList } from '../JudgeTemplateList/JudgeTemplateList';

const templates: JudgeTemplate[] = [
  {
    id: 'template-1',
    axialCodeId: 'axial-1',
    name: 'Communication judge',
    description: 'Reviews communication',
    template: 'Judge instructions',
    isDeprecated: false,
  },
];

describe('JudgeTemplateList', () => {
  it('shows the singular count and renders a template with its axial-code label', () => {
    render(
      <JudgeTemplateList
        templates={templates}
        axialCodeById={{ 'template-1': 'Communication' }}
        focusedIndex={0}
        onOpen={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('1 template')).toBeInTheDocument();
    expect(screen.getByText('Communication judge')).toBeInTheDocument();
    expect(screen.getByText('Communication')).toBeInTheDocument();
  });

  it('opens and deletes the matching template through its row', () => {
    const onOpen = vi.fn();
    const onDelete = vi.fn();
    render(
      <JudgeTemplateList
        templates={templates}
        axialCodeById={{}}
        focusedIndex={-1}
        onOpen={onOpen}
        onDelete={onDelete}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Communication judge/ }));
    expect(onOpen).toHaveBeenCalledWith(templates[0]);

    fireEvent.click(screen.getByRole('button', { name: 'Delete template' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledWith('template-1');
  });

  it('shows a plural count and empty-state message when there are no matches', () => {
    render(
      <JudgeTemplateList
        templates={[]}
        axialCodeById={{}}
        focusedIndex={-1}
        onOpen={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('0 templates')).toBeInTheDocument();
    expect(screen.getByText('No templates match your filters.')).toBeInTheDocument();
  });
});
