import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import TemplatePreviewList from '../TemplatePreviewList';
import type { JudgeTemplate } from '../../hooks/judgeUtils';

const templates: JudgeTemplate[] = [
  {
    id: 't1',
    axialCodeId: 'a1',
    name: 'Correctness of refusal',
    description: 'd1',
    template: 'Does the answer refuse correctly?',
    isDeprecated: false,
  },
  {
    id: 't2',
    axialCodeId: 'a2',
    name: 'Tone',
    description: 'd2',
    template: 'Is the tone polite?',
    isDeprecated: false,
  },
];

function setup() {
  const onEdit = vi.fn();
  render(
    <Theme>
      <TemplatePreviewList templates={templates} onEdit={onEdit} />
    </Theme>
  );
  return { onEdit };
}

describe('TemplatePreviewList', () => {
  it('lists every template by name with the prompt hidden', () => {
    setup();
    expect(screen.getByText('Correctness of refusal')).toBeTruthy();
    expect(screen.getByText('Tone')).toBeTruthy();
    expect(screen.queryByText('Does the answer refuse correctly?')).toBeNull();
  });

  it('shows the prompt when a template is expanded and hides it again', () => {
    setup();
    fireEvent.click(screen.getByText('Correctness of refusal'));
    expect(screen.getByText('Does the answer refuse correctly?')).toBeTruthy();

    fireEvent.click(screen.getByText('Correctness of refusal'));
    expect(screen.queryByText('Does the answer refuse correctly?')).toBeNull();
  });

  it('only keeps one template open at a time', () => {
    setup();
    fireEvent.click(screen.getByText('Correctness of refusal'));
    fireEvent.click(screen.getByText('Tone'));
    expect(screen.queryByText('Does the answer refuse correctly?')).toBeNull();
    expect(screen.getByText('Is the tone polite?')).toBeTruthy();
  });

  it('calls onEdit with the id of the clicked template', () => {
    const { onEdit } = setup();
    fireEvent.click(screen.getAllByRole('button', { name: /edit/i })[1]);
    expect(onEdit).toHaveBeenCalledWith('t2');
  });
});