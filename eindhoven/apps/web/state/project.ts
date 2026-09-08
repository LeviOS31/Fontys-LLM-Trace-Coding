import { Project } from "@/lib/types";
import { create } from "zustand";

interface ProjectState {
  project: Project | null;
  setProject: (project: Project | null) => void;
}

export const useProjectStore = create<ProjectState>()((set) => ({
  project: null,
  setProject: (project) => set(() => ({ project })),
}));
