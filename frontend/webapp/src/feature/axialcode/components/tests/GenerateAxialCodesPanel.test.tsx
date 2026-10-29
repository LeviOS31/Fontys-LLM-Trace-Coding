import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AxialCode } from '../../../../shared/types/axialCode';
import { GenerateAxialCodesPanel } from '../GenerateAxailCodesPanal/GenerateAxialCodesPanel';

const { mutate, useGenerate, useOpenCodes } = vi.hoisted(() => ({
  mutate: vi.fn(),
  useGenerate: vi.fn(),
  useOpenCodes: vi.fn(),
}));

vi.mock('../../hooks/useGenerateAxialCodingResult.ts', () => ({
  useGenerateAxialCodingResults: useGenerate,
}));
vi.mock('../../hooks/useGetOpenCodesByVersion.ts', () => ({
  useGetOpenCodesByVersion: useOpenCodes,
}));

const currentCode: AxialCode = {
  label: 'Reliability',
  description: 'Failure patterns',
  traceIds: ['trace-1'],
};

const generatedCode: AxialCode = {
  label: 'Clarity',
  description: 'Unclear responses',
  traceIds: ['trace-2'],
};

function mockHooks(pending = false, axialCodes: AxialCode[] = [generatedCode]) {
  mutate.mockReset();
  mutate.mockImplementation((_payload, callbacks) => {
    callbacks?.onSuccess?.({
      axialCodingResultId: 'result-1',
      axialCodes,
    });
  });
  useGenerate.mockReturnValue({ mutate, isPending: pending });
  useOpenCodes.mockReturnValue({ data: [{ traceId: 'trace-1' }, { traceId: 'trace-2' }] });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GenerateAxialCodesPanel', () => {
  it('generates the first axial code set and reports the result', () => {
    mockHooks();
    const onGenerated = vi.fn();
    render(
      <GenerateAxialCodesPanel
        projectId="project-1"
        projectVersionId="version-1"
        onGenerated={onGenerated}
      />
    );

    expect(screen.getByText('Generate axial codes based on 2 open codes')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Generate Axial Codes/ }));

    expect(mutate).toHaveBeenCalledWith(
      { feedback: null, axialCodes: null },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
    expect(onGenerated).toHaveBeenCalledWith({
      axialCodingResultId: 'result-1',
      axialCodes: [generatedCode],
      feedback: null,
    });
  });

  it('opens the feedback modal for regeneration and forwards current codes and feedback', () => {
    mockHooks();
    const onGenerated = vi.fn();
    render(
      <GenerateAxialCodesPanel
        projectId="project-1"
        projectVersionId="version-1"
        axialCodes={[currentCode]}
        onGenerated={onGenerated}
      />
    );

    expect(screen.getByText('Regenerate based on 2 open codes')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^Regenerate/ }));
    const feedback = screen.getByPlaceholderText(/Split the largest category/);
    fireEvent.change(feedback, { target: { value: 'Keep the categories distinct' } });
    fireEvent.click(screen.getByRole('button', { name: 'Regenerate' }));

    expect(mutate).toHaveBeenCalledWith(
      { feedback: 'Keep the categories distinct', axialCodes: [currentCode] },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
    expect(onGenerated).toHaveBeenCalledWith({
      axialCodingResultId: 'result-1',
      axialCodes: [generatedCode],
      feedback: 'Keep the categories distinct',
    });
  });

  it('does not report an unusable (empty) generate response', () => {
    mockHooks(false, []);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onGenerated = vi.fn();
    render(
      <GenerateAxialCodesPanel
        projectId="project-1"
        projectVersionId="version-1"
        onGenerated={onGenerated}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Generate Axial Codes/ }));

    expect(mutate).toHaveBeenCalled();
    expect(onGenerated).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith(
      'Unusable generate response',
      expect.objectContaining({ count: 0 })
    );
  });

  it('disables generation while a request is pending', () => {
    mockHooks(true);
    render(<GenerateAxialCodesPanel projectId="project-1" projectVersionId="version-1" />);

    expect(screen.getByRole('button', { name: /Working/ })).toBeDisabled();
    expect(mutate).not.toHaveBeenCalled();
  });
});
