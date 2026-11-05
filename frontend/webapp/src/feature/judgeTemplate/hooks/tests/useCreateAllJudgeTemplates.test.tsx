import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createJudgeTemplate } from '../../../../shared/api/judgeTemplates';
import { QUERY_KEYS } from '../../../../shared/api/queryKeys';
import type { AxialCode } from '../../../../shared/types/axialCode';
import type { JudgeTemplate } from '../../../../shared/types/judgeTemplate';
import {
  getAxialCodesWithoutTemplate,
  useCreateAllJudgeTemplates,
  type SavedAxialCode,
} from '../useCreateAllJudgeTemplates';

vi.mock('../../../../shared/api/judgeTemplates.ts', () => ({
  createJudgeTemplate: vi.fn(),
}));

const axialCode = (id: string): SavedAxialCode => ({
  axialCodeId: id,
  label: `Label ${id}`,
  description: `Description ${id}`,
  traceIds: [],
});

const template = (axialCodeId: string, isDeprecated = false): JudgeTemplate => ({
  id: `template-${axialCodeId}`,
  axialCodeId,
  name: 'Template',
  description: '',
  template: '',
  isDeprecated,
});

describe('getAxialCodesWithoutTemplate', () => {
  it('returns only the axial codes with no template', () => {
    const result = getAxialCodesWithoutTemplate(
      [axialCode('a'), axialCode('b'), axialCode('c')],
      [template('b')]
    );

    expect(result.map((a) => a.axialCodeId)).toEqual(['a', 'c']);
  });

  it('treats a deprecated template as missing', () => {
    const result = getAxialCodesWithoutTemplate([axialCode('a')], [template('a', true)]);

    expect(result.map((a) => a.axialCodeId)).toEqual(['a']);
  });

  it('skips axial codes that are not saved yet', () => {
    const unsaved: AxialCode = { label: 'Draft', description: 'Draft', traceIds: [] };

    expect(getAxialCodesWithoutTemplate([unsaved], [])).toEqual([]);
  });
});

describe('useCreateAllJudgeTemplates', () => {
  beforeEach(() => {
    vi.mocked(createJudgeTemplate).mockReset();
  });

  const renderCreateAll = () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const invalidate = vi.spyOn(client, 'invalidateQueries').mockResolvedValue(undefined);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useCreateAllJudgeTemplates('project-1', 'version-1'), {
      wrapper,
    });
    return { result, invalidate };
  };

  it('creates one template per axial code with the same payload as a single create', async () => {
    vi.mocked(createJudgeTemplate).mockResolvedValue({ judgeTemplateId: 'template' });
    const { result, invalidate } = renderCreateAll();

    let outcome;
    await act(async () => {
      outcome = await result.current.mutateAsync([axialCode('a'), axialCode('b')]);
    });

    expect(createJudgeTemplate).toHaveBeenCalledTimes(2);
    expect(createJudgeTemplate).toHaveBeenCalledWith('project-1', 'version-1', 'a', {
      name: 'Judge template - Label a',
      description: 'Description a',
    });
    expect(outcome).toEqual({ createdCount: 2, failedLabels: [] });
    expect(invalidate).toHaveBeenCalledOnce();
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: QUERY_KEYS.judgeTemplates.byVersion('version-1'),
    });
  });

  it('keeps the created templates and reports the ones that failed', async () => {
    vi.mocked(createJudgeTemplate)
      .mockResolvedValueOnce({ judgeTemplateId: 'template' })
      .mockRejectedValueOnce(new Error('Failed to create judge template'))
      .mockResolvedValueOnce({ judgeTemplateId: 'template' });
    const { result, invalidate } = renderCreateAll();

    let outcome;
    await act(async () => {
      outcome = await result.current.mutateAsync([axialCode('a'), axialCode('b'), axialCode('c')]);
    });

    expect(outcome).toEqual({ createdCount: 2, failedLabels: ['Label b'] });
    expect(invalidate).toHaveBeenCalledOnce();
  });
});
