import type { Project } from './project.ts';

export interface Projects {
  projects: Omit<Project, 'versions'>[];
}
