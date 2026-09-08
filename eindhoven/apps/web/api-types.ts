export type T0 = {
  input: string;
  output: string;
  openCode: string | null;
  context: string | null;
  children: T0[];
};

export type T1 = {
  id: string;
  input: string;
  output: string;
  openCode: string | null;
  feedback: "positive" | "negative" | null;
  isFlagged: boolean;
  context?: string | null;
  children?: T1[];
};

export type POST_files_202 = {
  result: {
    input: string;
    output: string;
    openCode: string | null;
    context: string | null;
    children: T0[];
  }[];
  traces: number;
};

export type POST_files_500 = {
  message: string;
  status: number;
};

export type GET_traces__traceId_200 = {
  id: string;
  input: string;
  output: string;
  openCode: string | null;
  feedback: "positive" | "negative" | null;
  isFlagged: boolean;
  context?: string | null;
  children?: T1[];
};

export type GET_traces__traceId_404 = {
  message: string;
  status: number;
};

export type GET_traces__traceId_422 = {
  type: "validation";
  on: string;
  summary?: string;
  message?: string;
  found?: unknown;
  property?: string;
  expected?: string;
};

export type GET_traces__traceId_500 = {
  message: string;
  status: number;
};

export type POST_traces__traceId__review_422 = {
  type: "validation";
  on: string;
  summary?: string;
  message?: string;
  found?: unknown;
  property?: string;
  expected?: string;
};

export type POST_traces__traceId__review_500 = {
  message: string;
  status: number;
};

export type POST_traces__traceId__flag_422 = {
  type: "validation";
  on: string;
  summary?: string;
  message?: string;
  found?: unknown;
  property?: string;
  expected?: string;
};

export type POST_traces__traceId__flag_500 = {
  message: string;
  status: number;
};

export type GET_lists__traceListId_200 = {
  id: string;
  feedback: "positive" | "negative" | null;
  isFlagged: boolean;
  hasOpenCode: boolean;
  input_preview: string;
}[];

export type GET_lists__traceListId_422 = {
  type: "validation";
  on: string;
  summary?: string;
  message?: string;
  found?: unknown;
  property?: string;
  expected?: string;
};

export type GET_lists__traceListId_500 = {
  message: string;
  status: number;
};

export type GET_lists__traceListId__info_200 = {
  id: string;
  createdAt: unknown | string | string | number;
  completedAt: unknown | string | string | number | null;
  name: string;
  status: {
    pending: number;
    finished: number;
    flagged: number;
  };
};

export type GET_lists__traceListId__info_422 = {
  type: "validation";
  on: string;
  summary?: string;
  message?: string;
  found?: unknown;
  property?: string;
  expected?: string;
};

export type GET_lists__traceListId__info_500 = {
  message: string;
  status: number;
};

export type POST_axial__traceListId_200 = {
  id: string;
  title: string;
  description: string;
  traceListId: string | null;
  traces?: {
    id: string;
    input: string;
    output: string;
    openCode: string | null;
    feedback: "positive" | "negative" | null;
    isFlagged: boolean;
    context?: string | null;
    children?: T1[];
  }[];
}[];

export type POST_axial__traceListId_422 = {
  type: "validation";
  on: string;
  summary?: string;
  message?: string;
  found?: unknown;
  property?: string;
  expected?: string;
};

export type POST_axial__traceListId_500 = {
  message: string;
  status: number;
};

export type GET_axial__traceListId_200 = {
  id: string;
  title: string;
  description: string;
  traceListId: string | null;
  traces?: {
    id: string;
    input: string;
    output: string;
    openCode: string | null;
    feedback: "positive" | "negative" | null;
    isFlagged: boolean;
    context?: string | null;
    children?: T1[];
  }[];
}[];

export type GET_axial__traceListId_404 = {
  message: string;
  status: number;
};

export type GET_axial__traceListId_422 = {
  type: "validation";
  on: string;
  summary?: string;
  message?: string;
  found?: unknown;
  property?: string;
  expected?: string;
};

export type GET_axial__traceListId_500 = {
  message: string;
  status: number;
};

export type PATCH_axial__traceListId___axialCodeId_404 = {
  message: string;
  status: number;
};

export type PATCH_axial__traceListId___axialCodeId_422 = {
  type: "validation";
  on: string;
  summary?: string;
  message?: string;
  found?: unknown;
  property?: string;
  expected?: string;
};

export type PATCH_axial__traceListId___axialCodeId_500 = {
  message: string;
  status: number;
};

export type GET_projects_200 = {
  id: string;
  name: string;
  description: string;
  createdAt: unknown | string | string | number;
}[];

export type GET_projects_422 = {
  type: "validation";
  on: string;
  summary?: string;
  message?: string;
  found?: unknown;
  property?: string;
  expected?: string;
};

export type GET_projects_500 = {
  message: string;
  status: number;
};

export type POST_projects_200 =
  | {
      message: string;
      status: number;
    }
  | {
      id: string;
      name: string;
      createdAt: unknown;
      description: string;
    };

export type POST_projects_201 = {
  id: string;
  name: string;
  description: string;
  createdAt: unknown | string | string | number;
};

export type POST_projects_409 = {
  message: string;
  status: number;
};

export type POST_projects_422 = {
  type: "validation";
  on: string;
  summary?: string;
  message?: string;
  found?: unknown;
  property?: string;
  expected?: string;
};

export type POST_projects_500 = {
  message: string;
  status: number;
};

export type GET_projects__id__tracelists_200 = {
  id: string;
  createdAt: unknown | string | string | number;
  completedAt: unknown | string | string | number | null;
  name: string;
  status: {
    pending: number;
    finished: number;
    flagged: number;
  };
}[];

export type GET_projects__id__tracelists_422 = {
  type: "validation";
  on: string;
  summary?: string;
  message?: string;
  found?: unknown;
  property?: string;
  expected?: string;
};

export type GET_projects__id__tracelists_500 = {
  message: string;
  status: number;
};

export type GET_projects__id_200 = {
  id: string;
  name: string;
  description: string;
  createdAt: unknown | string | string | number;
};

export type GET_projects__id_404 = {
  message: string;
  status: number;
};

export type GET_projects__id_422 = {
  type: "validation";
  on: string;
  summary?: string;
  message?: string;
  found?: unknown;
  property?: string;
  expected?: string;
};

export type PATCH_projects__id_200 = {
  id: string;
  name: string;
  description: string;
  createdAt: unknown | string | string | number;
};

export type PATCH_projects__id_404 = {
  message: string;
  status: number;
};

export type PATCH_projects__id_409 = {
  message: string;
  status: number;
};

export type PATCH_projects__id_422 = {
  type: "validation";
  on: string;
  summary?: string;
  message?: string;
  found?: unknown;
  property?: string;
  expected?: string;
};

export type PATCH_projects__id_500 = {
  message: string;
  status: number;
};

export type DELETE_projects__id_422 = {
  type: "validation";
  on: string;
  summary?: string;
  message?: string;
  found?: unknown;
  property?: string;
  expected?: string;
};

export type DELETE_projects__id_500 = {
  message: string;
  status: number;
};
