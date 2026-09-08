import type { Project } from '../types/project.ts';
import type { CreateProjectDto, EditProjectDto } from '../types/project.dto.ts';
import { BASE_URL } from './api.ts';
import type { Projects } from '../types/projects.ts';
import { ApiError } from '../types/ApiError.ts';

export async function createProject(payload: CreateProjectDto): Promise<Project> {
  const url = new URL('/v1/projects', BASE_URL);
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to create project');
  }

  return response.json();
}

export async function editProject(payload: EditProjectDto): Promise<Project> {
  const url = new URL(`/v1/projects/${payload.projectId}`, BASE_URL);
  const response = await fetch(url.toString(), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to edit project');
  }

  return response.json();
}

export async function getProject(id: string): Promise<Project> {
  const url = new URL(`/v1/projects/${id}`, BASE_URL);

  const response = await fetch(url.toString(), {
    method: 'GET',
  });

  if (!response.ok) {
    throw new ApiError(`Failed to fetch project with id: ${id}`, response.status);
  }

  return response.json();
}
export async function getAllProjects(): Promise<Projects> {
  const url = new URL('/v1/projects', BASE_URL);

  const response = await fetch(url.toString(), {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch projects');
  }

  return response.json();
}

export async function deleteProject(projectId: string): Promise<void> {
  const url = new URL(`/v1/projects/${projectId}`, BASE_URL);
  const response = await fetch(url.toString(), {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete project');
  }
}
