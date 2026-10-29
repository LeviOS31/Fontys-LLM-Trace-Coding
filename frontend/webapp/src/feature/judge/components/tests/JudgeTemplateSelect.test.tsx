import '@testing-library/jest-dom/vitest';
import { Theme } from '@radix-ui/themes';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { JudgeTemplate } from '../../hooks/judgeUtils';
import JudgeTemplateSelect from '../JudgeTemplateSelect';

// Radix Popover measures its trigger with ResizeObserver, which jsdom lacks.
beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
});

afterEach(cleanup);

const templates: JudgeTemplate[] = [
  { id: 't1', axialCodeId: 'a1', name: 'Reliability', isDeprecated: false },
  { id: 't2', axialCodeId: 'a2', name: 'Latency', isDeprecated: false },
  { id: 't3', axialCodeId: 'a3', name: 'Relevance', isDeprecated: false },
];

function renderSelect(list: JudgeTemplate[] = templates) {
  const onChange = vi.fn();
  render(
    <Theme>
      <JudgeTemplateSelect templates={list} onChange={onChange} />
    </Theme>
  );
  return onChange;
}

const openDropdown = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Select templates' }));
const checkbox = (name: string) => screen.getByRole('checkbox', { name });
const search = (value: string) =>
  fireEvent.change(screen.getByPlaceholderText('Search templates…'), {
    target: { value },
  });

describe('JudgeTemplateSelect', () => {
  describe('trigger', () => {
    it('shows a placeholder when nothing is selected', () => {
      renderSelect();
      expect(screen.getByRole('button', { name: 'Select templates' })).toBeInTheDocument();
    });

    it('shows the template name when one is selected', () => {
      renderSelect();
      openDropdown();
      fireEvent.click(checkbox('Latency'));
      expect(screen.getByRole('button', { name: 'Latency' })).toBeInTheDocument();
    });

    it('shows a count when several are selected', () => {
      renderSelect();
      openDropdown();
      fireEvent.click(checkbox('Latency'));
      fireEvent.click(checkbox('Reliability'));
      expect(screen.getByRole('button', { name: '2 templates selected' })).toBeInTheDocument();
    });

    it('rotates the chevron while the dropdown is open', () => {
      renderSelect();
      const trigger = screen.getByRole('button', { name: 'Select templates' });
      const chevron = trigger.querySelector('svg');
      expect(chevron).toHaveStyle({ transform: 'rotate(0deg)' });

      fireEvent.click(trigger);
      expect(chevron).toHaveStyle({ transform: 'rotate(180deg)' });

      fireEvent.click(trigger);
      expect(chevron).toHaveStyle({ transform: 'rotate(0deg)' });
    });
  });

  describe('selection', () => {
    it('lists every template once opened', () => {
      renderSelect();
      expect(screen.queryByRole('checkbox', { name: 'Latency' })).not.toBeInTheDocument();
      openDropdown();
      expect(checkbox('Reliability')).toBeInTheDocument();
      expect(checkbox('Latency')).toBeInTheDocument();
      expect(checkbox('Relevance')).toBeInTheDocument();
    });

    it('reports the selected ids as templates are toggled', () => {
      const onChange = renderSelect();
      openDropdown();

      fireEvent.click(checkbox('Latency'));
      expect(onChange).toHaveBeenLastCalledWith(['t2']);

      fireEvent.click(checkbox('Reliability'));
      expect(onChange).toHaveBeenLastCalledWith(['t2', 't1']);

      fireEvent.click(checkbox('Latency'));
      expect(onChange).toHaveBeenLastCalledWith(['t1']);
    });

    it('selects and clears everything with "Select all"', () => {
      const onChange = renderSelect();
      openDropdown();

      fireEvent.click(checkbox('Select all'));
      expect(onChange).toHaveBeenLastCalledWith(['t1', 't2', 't3']);
      expect(checkbox('Select all')).toBeChecked();

      fireEvent.click(checkbox('Select all'));
      expect(onChange).toHaveBeenLastCalledWith([]);
      expect(checkbox('Select all')).not.toBeChecked();
    });

    it('marks "Select all" as indeterminate for a partial selection', () => {
      renderSelect();
      openDropdown();
      fireEvent.click(checkbox('Reliability'));
      expect(checkbox('Select all')).toHaveAttribute('aria-checked', 'mixed');
    });

    it('checks "Select all" once every template is selected individually', () => {
      renderSelect();
      openDropdown();
      fireEvent.click(checkbox('Reliability'));
      fireEvent.click(checkbox('Latency'));
      fireEvent.click(checkbox('Relevance'));
      expect(checkbox('Select all')).toBeChecked();
    });
  });

  describe('search', () => {
    it('filters templates case-insensitively', () => {
      renderSelect();
      openDropdown();
      search('REL');
      expect(checkbox('Reliability')).toBeInTheDocument();
      expect(checkbox('Relevance')).toBeInTheDocument();
      expect(screen.queryByRole('checkbox', { name: 'Latency' })).not.toBeInTheDocument();
    });

    it('shows an empty state and hides "Select all" when nothing matches', () => {
      renderSelect();
      openDropdown();
      search('zzz');
      expect(screen.getByText('No templates match "zzz"')).toBeInTheDocument();
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    it('relabels the bulk checkbox while filtering', () => {
      renderSelect();
      openDropdown();
      expect(checkbox('Select all')).toBeInTheDocument();
      search('rel');
      expect(checkbox('Select all results')).toBeInTheDocument();
    });

    it('applies "Select all results" to the visible templates only', () => {
      const onChange = renderSelect();
      openDropdown();
      search('rel');
      fireEvent.click(checkbox('Select all results'));
      expect(onChange).toHaveBeenLastCalledWith(['t1', 't3']);
    });

    it('keeps selections that are hidden by the search', () => {
      const onChange = renderSelect();
      openDropdown();
      fireEvent.click(checkbox('Latency'));

      search('rel');
      fireEvent.click(checkbox('Select all results'));
      expect(onChange).toHaveBeenLastCalledWith(['t2', 't1', 't3']);

      // Deselecting the visible results leaves the hidden selection alone.
      fireEvent.click(checkbox('Select all results'));
      expect(onChange).toHaveBeenLastCalledWith(['t2']);
    });

    it('clears the search when the dropdown closes', () => {
      renderSelect();
      const trigger = screen.getByRole('button', { name: 'Select templates' });
      fireEvent.click(trigger);
      search('rel');
      fireEvent.click(trigger);
      fireEvent.click(trigger);
      expect(screen.getByPlaceholderText('Search templates…')).toHaveValue('');
      expect(checkbox('Latency')).toBeInTheDocument();
    });
  });

  it('handles an empty template list', () => {
    renderSelect([]);
    openDropdown();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});
