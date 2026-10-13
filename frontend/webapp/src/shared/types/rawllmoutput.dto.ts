import type { RawLLMOutput } from './RawLLMOutput.ts';

export interface ImportRawLLMOutputDto {
    projectId: string;
    projectVersionId: string;
    name: string;
    file: File;
}

export interface EditRawLLMOutputDto {
    rawLLMOutputId: string;
    name: string;
}