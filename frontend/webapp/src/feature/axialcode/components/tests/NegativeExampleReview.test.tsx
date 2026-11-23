import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AxialCode } from '../../../../shared/types/axialCode';
import { generateNegativeExampleDraft } from '../../../../shared/api/axialCode';
import NegativeExampleReview from '../NegativeExampleReview';

vi.mock('../../../../shared/api/axialCode', () => ({
  generateNegativeExampleDraft: vi.fn(),
}));

const realCandidate: AxialCode = {
  axialCodeId: 'code-1',
  label: 'Clear formatting',
  description: 'Organizes an answer with headings or bullets.',
  judgeGuidelines: 'Mark false when the response is unstructured.',
  positiveExampleTrace: 'User: Explain it\nAssistant: ## Plan\n- Step 1',
  negativeExampleTrace: 'User: Explain it\nAssistant: **Here is a short answer.**',
  traceIds: ['trace-1'],
};

describe('NegativeExampleReview', () => {
  beforeEach(() => {
    vi.mocked(generateNegativeExampleDraft).mockReset();
  });

  it('generates a replacement immediately when the user rejects a real trace', async () => {
    vi.mocked(generateNegativeExampleDraft).mockResolvedValue({
      trace: 'User: Explain it\nAssistant: Here is one vague sentence.',
      reasoning: 'The answer is relevant but lacks the requested structure.',
    });
    const onComplete = vi.fn();
    render(
      <NegativeExampleReview
        projectId="project-1"
        projectVersionId="version-1"
        axialCodes={[realCandidate]}
        isSaving={false}
        onComplete={onComplete}
      />
    );

    expect(screen.getByRole('heading', { name: 'Approve a negative example' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Plan' })).toBeInTheDocument();
    expect(
      screen.queryByText('Mark false when the response is unstructured.')
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reject trace and generate replacement' }));

    expect(await screen.findByText('Generated example draft')).toBeInTheDocument();
    expect(generateNegativeExampleDraft).toHaveBeenCalledOnce();
    fireEvent.change(screen.getByRole('textbox', { name: 'Negative example reasoning' }), {
      target: { value: 'The answer is relevant, but it does not use headings or bullets.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Approve example and finish' }));

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith([
        expect.objectContaining({
          negativeExampleTrace: 'User: Explain it\nAssistant: Here is one vague sentence.',
          negativeExampleReasoning:
            'The answer is relevant, but it does not use headings or bullets.',
        }),
      ]);
    });
  });

  it('automatically generates a draft if no real trace candidate exists', async () => {
    vi.mocked(generateNegativeExampleDraft).mockResolvedValue({
      trace: 'User: Explain it\nAssistant: I do not know.',
      reasoning: 'The assistant gives no structured explanation.',
    });
    render(
      <NegativeExampleReview
        projectId="project-1"
        projectVersionId="version-1"
        axialCodes={[{ ...realCandidate, negativeExampleTrace: null }]}
        isSaving={false}
        onComplete={vi.fn()}
      />
    );

    expect(await screen.findByText('Generated example draft')).toBeInTheDocument();
    expect(generateNegativeExampleDraft).toHaveBeenCalledOnce();
  });

  it('requires an approved example for each code before completing the review', async () => {
    const secondCode: AxialCode = {
      ...realCandidate,
      axialCodeId: 'code-2',
      label: 'Concise answers',
      negativeExampleTrace: 'User: Explain it\nAssistant: A very long response.',
    };
    const onComplete = vi.fn();
    render(
      <NegativeExampleReview
        projectId="project-1"
        projectVersionId="version-1"
        axialCodes={[realCandidate, secondCode]}
        isSaving={false}
        onComplete={onComplete}
      />
    );

    fireEvent.change(screen.getByRole('textbox', { name: 'Negative example reasoning' }), {
      target: { value: 'This is a relevant but unstructured response.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Approve example and continue' }));

    expect(await screen.findByRole('heading', { name: 'Concise answers' })).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();

    fireEvent.change(screen.getByRole('textbox', { name: 'Negative example reasoning' }), {
      target: { value: 'The answer is not concise.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Approve example and finish' }));

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith([
        expect.objectContaining({
          negativeExampleReasoning: 'This is a relevant but unstructured response.',
        }),
        expect.objectContaining({ negativeExampleReasoning: 'The answer is not concise.' }),
      ]);
    });
  });
});
