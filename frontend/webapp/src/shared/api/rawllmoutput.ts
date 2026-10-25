import { BASE_URL } from './api.ts';
import type { ImportRawLLMOutputDto } from '../types/rawllmoutput.dto.ts';
import type { RawLLMOutput } from '../types/RawLLMOutput.ts';

export async function ImportRawLLMOutput(payload: ImportRawLLMOutputDto): Promise<void> {
    const url = new URL(
        `/v1/projects/${payload.projectId}/versions/${payload.projectVersionId}/raw-llm-output`,
        BASE_URL
    );
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('file', payload.file);

    const response = await fetch(url, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error('Failed to import raw LLM output');
    }
}

export async function getRawLLMOutputs(projectId: string, projectVersionId: string): Promise<RawLLMOutput[]> {
    const url = new URL(
        `/v1/projects/${projectId}/versions/${projectVersionId}/raw-llm-output`,
        BASE_URL
    );

    const response = await fetch(url, {
        method: 'GET',
    });

    if (!response.ok) {
        throw new Error('Failed to fetch raw LLM outputs');
    }

    const data = await response.json();
    return data.rawLLMOutputs;
}

export async function getRawLLMOutputById(projectId: string, projectVersionId: string, rawLLMOutputId: string): Promise<RawLLMOutput> {
    const url = new URL(
        `/v1/projects/${projectId}/versions/${projectVersionId}/raw-llm-output/${rawLLMOutputId}`,
        BASE_URL
    );

    const response = await fetch(url, {
        method: 'GET',
    });

    if (!response.ok) {
        throw new Error('Failed to fetch raw LLM output by ID');
    }
    const data = await response.json();
    return data;
}

export async function editRawLLMOutput(projectId: string, projectVersionId: string, rawLLMOutputId: string, payload: string): Promise<void> {
    const url = new URL(
        `/v1/projects/${projectId}/versions/${projectVersionId}/raw-llm-output/${rawLLMOutputId}`,
        BASE_URL
    );

    const response = await fetch(url, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: payload,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to edit raw LLM output');
    }
}

export async function deleteRawLLMOutput(projectId: string, projectVersionId: string, rawLLMOutputId: string): Promise<void> {
    const url = new URL(
        `/v1/projects/${projectId}/versions/${projectVersionId}/raw-llm-output/${rawLLMOutputId}`,
        BASE_URL
    );

    const response = await fetch(url, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error('Failed to delete raw LLM output');
    }
}