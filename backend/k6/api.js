import http from "k6/http";
import { check } from "k6";

const baseUrl = (__ENV.K6_BASE_URL || "http://localhost:8080").replace(
  /\/+$/,
  "",
);
const traceFixture = open(
  "../../frontend/webapp/cypress/testData/opentelemetry_traces_example 3.jsonl",
);
const thresholds = {
  checks: 0.99,
  failedRequests: 0.01,
  p95DurationMs: 500,
};

const apiOperations = [
  {
    id: "projects_list",
    feature: "Projects",
    method: "GET",
    path: "/v1/projects",
    label: "List projects",
  },
  {
    id: "projects_create",
    feature: "Projects",
    method: "POST",
    path: "/v1/projects",
    label: "Create project",
  },
  {
    id: "projects_get",
    feature: "Projects",
    method: "GET",
    path: "/v1/projects/{projectId}",
    label: "Get project",
  },
  {
    id: "projects_edit",
    feature: "Projects",
    method: "PUT",
    path: "/v1/projects/{projectId}",
    label: "Edit project",
  },
  {
    id: "projects_delete",
    feature: "Projects",
    method: "DELETE",
    path: "/v1/projects/{projectId}",
    label: "Delete project",
  },
  {
    id: "versions_create",
    feature: "Versions",
    method: "POST",
    path: "/v1/projects/{projectId}/versions",
    label: "Create version",
  },
  {
    id: "versions_edit",
    feature: "Versions",
    method: "PUT",
    path: "/v1/projects/{projectId}/versions/{versionId}",
    label: "Edit version",
  },
  {
    id: "versions_delete",
    feature: "Versions",
    method: "DELETE",
    path: "/v1/projects/{projectId}/versions/{versionId}",
    label: "Delete version",
  },
  {
    id: "assessment_create",
    feature: "Assessment criteria",
    method: "POST",
    path: "/v1/projects/{projectId}/assessment-criteria",
    label: "Create criterion",
  },
  {
    id: "assessment_delete",
    feature: "Assessment criteria",
    method: "DELETE",
    path: "/v1/projects/{projectId}/assessment-criteria/{criterionId}",
    label: "Delete criterion",
  },
  {
    id: "traces_import",
    feature: "Traces",
    method: "POST",
    path: "/v1/projects/{projectId}/versions/{versionId}/traces",
    label: "Import traces",
  },
  {
    id: "traces_list",
    feature: "Traces",
    method: "GET",
    path: "/v1/projects/{projectId}/versions/{versionId}/traces",
    label: "List trace groups",
  },
  {
    id: "trace_group_get",
    feature: "Traces",
    method: "GET",
    path: "/v1/projects/{projectId}/versions/{versionId}/traceGroup/{traceGroupId}",
    label: "Get trace group",
  },
  {
    id: "trace_get",
    feature: "Traces",
    method: "GET",
    path: "/v1/projects/{projectId}/versions/{versionId}/traces/{traceId}",
    label: "Get trace",
  },
  {
    id: "trace_collections_list",
    feature: "Traces",
    method: "GET",
    path: "/v1/projects/{projectId}/versions/{versionId}/traces/collections",
    label: "List trace collections",
  },
  {
    id: "trace_collection_delete",
    feature: "Traces",
    method: "DELETE",
    path: "/v1/projects/{projectId}/versions/{versionId}/traces/collections/{collectionId}",
    label: "Delete trace collection",
  },
  {
    id: "trace_collection_traces",
    feature: "Traces",
    method: "GET",
    path: "/v1/projects/{projectId}/versions/{versionId}/traces/collections/{collectionId}/traces",
    label: "List collection traces",
  },
  {
    id: "open_codes_list",
    feature: "Traces",
    method: "GET",
    path: "/v1/projects/{projectId}/versions/{versionId}/opencodes",
    label: "List open codes",
  },
  {
    id: "open_code_edit",
    feature: "Traces",
    method: "POST",
    path: "/v1/projects/{projectId}/versions/{versionId}/traces/{traceId}",
    label: "Edit open code",
  },
  {
    id: "trace_collection_edit",
    feature: "Traces",
    method: "PATCH",
    path: "/v1/projects/{projectId}/versions/{versionId}/traces/collections/{collectionId}",
    label: "Rename trace collection",
  },
  {
    id: "raw_output_import",
    feature: "Raw LLM output",
    method: "POST",
    path: "/v1/projects/{projectId}/versions/{versionId}/raw-llm-output",
    label: "Import raw output",
  },
  {
    id: "raw_outputs_list",
    feature: "Raw LLM output",
    method: "GET",
    path: "/v1/projects/{projectId}/versions/{versionId}/raw-llm-output",
    label: "List raw outputs",
  },
  {
    id: "raw_output_get",
    feature: "Raw LLM output",
    method: "GET",
    path: "/v1/projects/{projectId}/versions/{versionId}/raw-llm-output/{rawOutputId}",
    label: "Get raw output",
  },
  {
    id: "raw_output_edit",
    feature: "Raw LLM output",
    method: "PATCH",
    path: "/v1/projects/{projectId}/versions/{versionId}/raw-llm-output/{rawOutputId}",
    label: "Rename raw output",
  },
  {
    id: "raw_output_delete",
    feature: "Raw LLM output",
    method: "DELETE",
    path: "/v1/projects/{projectId}/versions/{versionId}/raw-llm-output/{rawOutputId}",
    label: "Delete raw output",
  },
  {
    id: "axial_codes_generate",
    feature: "Axial codes",
    method: "POST",
    path: "/v1/projects/{projectId}/versions/{versionId}/axial-coding-results/generate",
    label: "Generate axial codes",
  },
  {
    id: "negative_example_generate",
    feature: "Axial codes",
    method: "POST",
    path: "/v1/projects/{projectId}/versions/{versionId}/axial-coding-results/negative-example",
    label: "Generate negative example",
  },
  {
    id: "axial_codes_list",
    feature: "Axial codes",
    method: "GET",
    path: "/v1/projects/{projectId}/versions/{versionId}/axial-coding-results/current",
    label: "Get current axial codes",
  },
  {
    id: "axial_code_get",
    feature: "Axial codes",
    method: "GET",
    path: "/v1/projects/{projectId}/versions/{versionId}/axial-coding-results/current/{axialCodeId}",
    label: "Get axial code",
  },
  {
    id: "axial_codes_save",
    feature: "Axial codes",
    method: "POST",
    path: "/v1/projects/{projectId}/versions/{versionId}/axial-coding-results/{resultId}/save",
    label: "Save axial codes",
  },
  {
    id: "judge_template_create",
    feature: "Judge templates",
    method: "POST",
    path: "/v1/projects/{projectId}/versions/{versionId}/axial-codes/{axialCodeId}/judge-template",
    label: "Create judge template",
  },
  {
    id: "judge_templates_list",
    feature: "Judge templates",
    method: "GET",
    path: "/v1/projects/{projectId}/versions/{versionId}/judge-templates",
    label: "List judge templates",
  },
  {
    id: "judge_template_edit",
    feature: "Judge templates",
    method: "PUT",
    path: "/v1/projects/{projectId}/versions/{versionId}/judge-templates/{templateId}",
    label: "Edit judge template",
  },
  {
    id: "judge_template_versions_list",
    feature: "Judge templates",
    method: "GET",
    path: "/v1/projects/{projectId}/versions/{versionId}/judge-templates/{templateId}/versions",
    label: "List template versions",
  },
  {
    id: "judge_template_restore",
    feature: "Judge templates",
    method: "POST",
    path: "/v1/projects/{projectId}/versions/{versionId}/judge-templates/{templateId}/versions/{versionNumber}/restore",
    label: "Restore template version",
  },
  {
    id: "judge_template_version_delete",
    feature: "Judge templates",
    method: "DELETE",
    path: "/v1/projects/{projectId}/versions/{versionId}/judge-templates/{templateId}/versions/{versionNumber}",
    label: "Delete template version",
  },
  {
    id: "judge_template_delete",
    feature: "Judge templates",
    method: "DELETE",
    path: "/v1/projects/{projectId}/versions/{versionId}/judge-templates/{templateId}",
    label: "Delete judge template",
  },
  {
    id: "judge_run_create",
    feature: "Judge",
    method: "POST",
    path: "/v1/projects/{projectId}/versions/{versionId}/judge",
    label: "Run judge",
  },
  {
    id: "judge_collections_list",
    feature: "Judge",
    method: "GET",
    path: "/v1/projects/{projectId}/versions/{versionId}/judgecollection",
    label: "List judge collections",
  },
  {
    id: "judge_collection_get",
    feature: "Judge",
    method: "GET",
    path: "/v1/projects/{projectId}/versions/{versionId}/judgecollection/{collectionId}",
    label: "Get judge collection",
  },
  {
    id: "judge_runs_list",
    feature: "Judge",
    method: "GET",
    path: "/v1/projects/{projectId}/versions/{versionId}/judgecollections/{collectionId}/judge-runs",
    label: "List judge runs",
  },
  {
    id: "judge_run_get",
    feature: "Judge",
    method: "GET",
    path: "/v1/projects/{projectId}/versions/{versionId}/judgecollection/{collectionId}/judge-runs/{runId}",
    label: "Get judge run",
  },
  {
    id: "judge_collection_edit",
    feature: "Judge",
    method: "PUT",
    path: "/v1/projects/{projectId}/versions/{versionId}/judgecollection/{collectionId}",
    label: "Rename judge collection",
  },
  {
    id: "judge_run_feedback",
    feature: "Judge",
    method: "PUT",
    path: "/v1/projects/{projectId}/versions/{versionId}/judgecollection/{collectionId}/judge-runs/{runId}/feedback",
    label: "Update judge feedback",
  },
  {
    id: "judge_run_delete",
    feature: "Judge",
    method: "DELETE",
    path: "/v1/projects/{projectId}/versions/{versionId}/judgecollection/{collectionId}/judge-runs/{runId}",
    label: "Delete judge run",
  },
  {
    id: "judge_collection_delete",
    feature: "Judge",
    method: "DELETE",
    path: "/v1/projects/{projectId}/versions/{versionId}/judgecollection/{collectionId}",
    label: "Delete judge collection",
  },
  {
    id: "project_statistics_get",
    feature: "Statistics",
    method: "GET",
    path: "/v1/projects/{projectId}/statistics",
    label: "Get project statistics",
  },
  {
    id: "version_statistics_get",
    feature: "Statistics",
    method: "GET",
    path: "/v1/projects/{projectId}/versions/{versionId}/statistics",
    label: "Get version statistics",
  },
  {
    id: "settings_status_get",
    feature: "Settings",
    method: "GET",
    path: "/v1/settings/llm/status",
    label: "Get LLM status",
  },
  {
    id: "settings_default_get",
    feature: "Settings",
    method: "GET",
    path: "/v1/settings/llm/default-config",
    label: "Get default LLM config",
  },
  {
    id: "settings_config_update",
    feature: "Settings",
    method: "PUT",
    path: "/v1/settings/llm/config",
    label: "Update LLM config",
    optional: true,
  },
];

const operationById = Object.fromEntries(
  apiOperations.map((operation) => [operation.id, operation]),
);
const endpointMetrics = {};

for (const operation of apiOperations) {
  endpointMetrics[operation.id] = {
    requests: new Counter(`endpoint_${operation.id}_requests`),
    duration: new Trend(`endpoint_${operation.id}_duration`, true),
  };
}

const coverageVus = Number(__ENV.K6_COVERAGE_VUS || 1);
const loadVus = Number(__ENV.K6_LOAD_VUS || 10);
const loadDuration = __ENV.K6_LOAD_DURATION || "1m";
const settingsWriteEnabled = __ENV.K6_TEST_SETTINGS_WRITE === "true";
const requestTimeout = __ENV.K6_REQUEST_TIMEOUT || "15m";

export const options = {
  scenarios: {
    feature_coverage: {
      executor: "per-vu-iterations",
      vus: coverageVus,
      iterations: 1,
      maxDuration: __ENV.K6_COVERAGE_MAX_DURATION || "25m",
      exec: "runFeatureCoverage",
    },
    project_list_load: {
      executor: "constant-vus",
      vus: loadVus,
      duration: loadDuration,
      exec: "runProjectListLoad",
    },
  },
  thresholds: {
    checks: [`rate>${thresholds.checks}`],
    http_req_failed: [`rate<${thresholds.failedRequests}`],
    "http_req_duration{scenario:project_list_load}": [
      `p(95)<${thresholds.p95DurationMs}`,
    ],
  },
};

function request(operationId, path, body) {
  const operation = operationById[operationId];
  const params = {
    tags: {
      name: `${operation.method} ${operation.path}`,
      feature: operation.feature,
      operation: operation.label,
    },
    timeout: requestTimeout,
  };

  let response;
  if (body && body.multipart) {
    response = http.post(`${baseUrl}${path}`, body.multipart, params);
  } else {
    if (body !== undefined) {
      params.headers = { "Content-Type": "application/json" };
    }
    response = http.request(
      operation.method,
      `${baseUrl}${path}`,
      body === undefined ? null : JSON.stringify(body),
      params,
    );
  }

  endpointMetrics[operationId].requests.add(1);
  endpointMetrics[operationId].duration.add(response.timings.duration);
  check(response, {
    [`${operation.method} ${operation.path} succeeds`]: (result) =>
      result.status >= 200 && result.status < 300,
  });
  return response;
}

function responseJson(response, operationId) {
  if (response.status < 200 || response.status >= 300) {
    return null;
  }
  const result = response.json();
  check(result, {
    [`${operationById[operationId].label} returns JSON`]: (value) =>
      value !== null && typeof value === "object",
  });
  return result;
}

function requiredValue(value, label) {
  check(value, {
    [`${label} is returned`]: (result) =>
      result !== undefined && result !== null && result !== "",
  });
  return value || null;
}

function formFile(contents, filename, contentType) {
  return {
    multipart: {
      Name: filename.replace(/\.[^.]+$/, ""),
      File: http.file(contents, filename, contentType),
    },
  };
}

export function runProjectListLoad() {
  request("projects_list", "/v1/projects");
}

export function runFeatureCoverage() {
  let projectId = null;
  let versionId = null;
  let versionDeleted = false;
  const runName = `k6-${Date.now()}-vu${__VU}`;

  try {
    if (settingsWriteEnabled) {
      const defaultConfig = responseJson(
        request("settings_default_get", "/v1/settings/llm/default-config"),
        "settings_default_get",
      );
      if (defaultConfig) {
        request("settings_config_update", "/v1/settings/llm/config", {
          providerName: __ENV.K6_LLM_PROVIDER || defaultConfig.providerName,
          endpoint: __ENV.K6_LLM_ENDPOINT || defaultConfig.endpoint,
          modelName: __ENV.K6_LLM_MODEL || defaultConfig.modelName,
          apiKey: __ENV.K6_LLM_API_KEY || null,
        });
      }
    }

    const project = responseJson(
      request("projects_create", "/v1/projects", {
        name: `k6 feature coverage ${runName}`,
        description:
          "Disposable project created by the backend k6 feature-coverage test.",
      }),
      "projects_create",
    );
    projectId = requiredValue(project && project.projectId, "Project ID");
    if (!projectId) {
      return;
    }

    request("projects_list", "/v1/projects");
    request("projects_get", `/v1/projects/${projectId}`);
    request("projects_edit", `/v1/projects/${projectId}`, {
      name: `k6 feature coverage edited ${runName}`,
      description: "Edited by the backend k6 feature-coverage test.",
    });

    const version = responseJson(
      request("versions_create", `/v1/projects/${projectId}/versions`, {
        name: `k6-version-${__VU}`,
        description:
          "Disposable version created by the backend k6 feature-coverage test.",
      }),
      "versions_create",
    );
    versionId = requiredValue(
      version && version.versionId,
      "Project version ID",
    );
    if (!versionId) {
      return;
    }

    request(
      "versions_edit",
      `/v1/projects/${projectId}/versions/${versionId}`,
      {
        name: `k6-version-edited-${__VU}`,
        description: "Edited by the backend k6 feature-coverage test.",
      },
    );

    const criterion = responseJson(
      request(
        "assessment_create",
        `/v1/projects/${projectId}/assessment-criteria`,
        {
          criteria: "The response is relevant to the user request.",
        },
      ),
      "assessment_create",
    );
    const criterionId = requiredValue(
      criterion && criterion.criteriaId,
      "Assessment criterion ID",
    );
    if (criterionId) {
      request(
        "assessment_delete",
        `/v1/projects/${projectId}/assessment-criteria/${criterionId}`,
      );
    }

    const traceImport = responseJson(
      request(
        "traces_import",
        `/v1/projects/${projectId}/versions/${versionId}/traces`,
        formFile(traceFixture, "k6-traces.jsonl", "application/json"),
      ),
      "traces_import",
    );
    const traceCollectionId = requiredValue(
      traceImport && traceImport.traceCollectionId,
      "Trace collection ID",
    );
    if (!traceCollectionId) {
      return;
    }

    request(
      "trace_collections_list",
      `/v1/projects/${projectId}/versions/${versionId}/traces/collections`,
    );
    const traceGroups = responseJson(
      request(
        "traces_list",
        `/v1/projects/${projectId}/versions/${versionId}/traces?page=1&pageSize=20`,
      ),
      "traces_list",
    );
    const traceGroupId = requiredValue(
      traceGroups &&
        traceGroups.items &&
        traceGroups.items[0] &&
        traceGroups.items[0].traceGroupId,
      "Trace group ID",
    );
    if (!traceGroupId) {
      return;
    }

    const traceGroup = responseJson(
      request(
        "trace_group_get",
        `/v1/projects/${projectId}/versions/${versionId}/traceGroup/${traceGroupId}`,
      ),
      "trace_group_get",
    );
    const traceId = requiredValue(
      traceGroup &&
        traceGroup.traces &&
        traceGroup.traces[0] &&
        traceGroup.traces[0].traceId,
      "Trace ID",
    );
    if (!traceId) {
      return;
    }

    request(
      "trace_get",
      `/v1/projects/${projectId}/versions/${versionId}/traces/${traceId}`,
    );
    request(
      "trace_collection_traces",
      `/v1/projects/${projectId}/versions/${versionId}/traces/collections/${traceCollectionId}/traces`,
    );
    request(
      "open_code_edit",
      `/v1/projects/${projectId}/versions/${versionId}/traces/${traceId}`,
      {
        openCode:
          "The assistant responds to the user with a concise explanation.",
      },
    );
    request(
      "open_codes_list",
      `/v1/projects/${projectId}/versions/${versionId}/opencodes`,
    );
    request(
      "trace_collection_edit",
      `/v1/projects/${projectId}/versions/${versionId}/traces/collections/${traceCollectionId}`,
      { name: `k6 traces edited ${runName}` },
    );

    const rawOutput = responseJson(
      request(
        "raw_output_import",
        `/v1/projects/${projectId}/versions/${versionId}/raw-llm-output`,
        formFile(
          JSON.stringify({
            input: "Explain what a trace collection is.",
            output: "A trace collection groups related execution traces.",
          }),
          "k6-raw-output.json",
          "application/json",
        ),
      ),
      "raw_output_import",
    );
    const rawOutputId = requiredValue(
      rawOutput && rawOutput.rawLLMOutputId,
      "Raw LLM output ID",
    );
    if (!rawOutputId) {
      return;
    }

    request(
      "raw_outputs_list",
      `/v1/projects/${projectId}/versions/${versionId}/raw-llm-output`,
    );
    request(
      "raw_output_get",
      `/v1/projects/${projectId}/versions/${versionId}/raw-llm-output/${rawOutputId}`,
    );
    request(
      "raw_output_edit",
      `/v1/projects/${projectId}/versions/${versionId}/raw-llm-output/${rawOutputId}`,
      { name: `k6 raw output edited ${runName}` },
    );

    const axialResult = responseJson(
      request(
        "axial_codes_generate",
        `/v1/projects/${projectId}/versions/${versionId}/axial-coding-results/generate`,
        { feedback: null, axialCodes: null },
      ),
      "axial_codes_generate",
    );
    const axialCodingResultId = requiredValue(
      axialResult && axialResult.axialCodingResultId,
      "Axial coding result ID",
    );
    const axialCodes = axialResult && axialResult.axialCodes;
    const axialCodeId = requiredValue(
      axialCodes && axialCodes[0] && axialCodes[0].axialCodeId,
      "Axial code ID",
    );
    if (!axialCodingResultId || !axialCodeId) {
      return;
    }

    request(
      "negative_example_generate",
      `/v1/projects/${projectId}/versions/${versionId}/axial-coding-results/negative-example`,
      {
        label: axialCodes[0].label,
        description: axialCodes[0].description,
        judgeGuidelines:
          axialCodes[0].judgeGuidelines || axialCodes[0].description,
        positiveExampleTrace:
          "The assistant responds with a concise explanation.",
      },
    );
    request(
      "axial_codes_save",
      `/v1/projects/${projectId}/versions/${versionId}/axial-coding-results/${axialCodingResultId}/save`,
      {
        negativeExamples: axialCodes.map((code) => ({
          axialCodeId: code.axialCodeId,
          trace: "The assistant does not provide a relevant explanation.",
          reasoning:
            "The response does not exhibit the behavior described by this code.",
        })),
      },
    );
    request(
      "axial_codes_list",
      `/v1/projects/${projectId}/versions/${versionId}/axial-coding-results/current`,
    );
    request(
      "axial_code_get",
      `/v1/projects/${projectId}/versions/${versionId}/axial-coding-results/current/${axialCodeId}`,
    );

    const judgeTemplate = responseJson(
      request(
        "judge_template_create",
        `/v1/projects/${projectId}/versions/${versionId}/axial-codes/${axialCodeId}/judge-template`,
        {
          name: `k6 judge template ${runName}`,
          description: "Disposable k6 test template.",
        },
      ),
      "judge_template_create",
    );
    const judgeTemplateId = requiredValue(
      judgeTemplate && judgeTemplate.judgeTemplateId,
      "Judge template ID",
    );
    if (!judgeTemplateId) {
      return;
    }

    request(
      "judge_templates_list",
      `/v1/projects/${projectId}/versions/${versionId}/judge-templates`,
    );

    const judgeRunResult = responseJson(
      request(
        "judge_run_create",
        `/v1/projects/${projectId}/versions/${versionId}/judge`,
        {
          judgeTemplateIds: [judgeTemplateId],
          traceCollectionIds: [traceCollectionId],
          rawLLMOutputIds: [rawOutputId],
          isEvaluation: true,
        },
      ),
      "judge_run_create",
    );
    const judgeResults = judgeRunResult && judgeRunResult.results;
    check(judgeResults, {
      "Judge run returns successful results": (results) =>
        Array.isArray(results) &&
        results.length > 0 &&
        results.every(
          (group) =>
            Array.isArray(group) &&
            group.every((result) => result.status === "Success"),
        ),
    });
    const judgeCollectionId = requiredValue(
      judgeRunResult && judgeRunResult.judgeCollectionId,
      "Judge collection ID",
    );
    if (!judgeCollectionId) {
      return;
    }

    request(
      "judge_collections_list",
      `/v1/projects/${projectId}/versions/${versionId}/judgecollection?isEvaluation=true`,
    );
    request(
      "judge_collection_get",
      `/v1/projects/${projectId}/versions/${versionId}/judgecollection/${judgeCollectionId}`,
    );

    const judgeRuns = responseJson(
      request(
        "judge_runs_list",
        `/v1/projects/${projectId}/versions/${versionId}/judgecollections/${judgeCollectionId}/judge-runs?limit=20&offset=0`,
      ),
      "judge_runs_list",
    );
    const judgeRunId = requiredValue(
      judgeRuns &&
        judgeRuns.judgeRuns &&
        judgeRuns.judgeRuns[0] &&
        judgeRuns.judgeRuns[0].judgeRunId,
      "Judge run ID",
    );
    if (!judgeRunId) {
      return;
    }

    request(
      "judge_run_get",
      `/v1/projects/${projectId}/versions/${versionId}/judgecollection/${judgeCollectionId}/judge-runs/${judgeRunId}`,
    );
    request(
      "judge_collection_edit",
      `/v1/projects/${projectId}/versions/${versionId}/judgecollection/${judgeCollectionId}`,
      { name: `k6 judge collection edited ${runName}` },
    );
    request(
      "judge_run_feedback",
      `/v1/projects/${projectId}/versions/${versionId}/judgecollection/${judgeCollectionId}/judge-runs/${judgeRunId}/feedback`,
      {
        feedback: "Feedback recorded by the backend k6 feature-coverage test.",
      },
    );
    request(
      "judge_run_delete",
      `/v1/projects/${projectId}/versions/${versionId}/judgecollection/${judgeCollectionId}/judge-runs/${judgeRunId}`,
    );
    request(
      "judge_collection_delete",
      `/v1/projects/${projectId}/versions/${versionId}/judgecollection/${judgeCollectionId}`,
    );

    request(
      "judge_template_edit",
      `/v1/projects/${projectId}/versions/${versionId}/judge-templates/${judgeTemplateId}`,
      {
        content:
          "Evaluate {{axial_code_name}} using {{axial_code_judge_guidelines}}. " +
          "Positive example: {{example_positive_trace}}. Negative example: {{example_negative_trace}}.",
      },
    );
    request(
      "judge_template_versions_list",
      `/v1/projects/${projectId}/versions/${versionId}/judge-templates/${judgeTemplateId}/versions`,
    );
    request(
      "judge_template_restore",
      `/v1/projects/${projectId}/versions/${versionId}/judge-templates/${judgeTemplateId}/versions/1/restore`,
    );
    request(
      "judge_template_version_delete",
      `/v1/projects/${projectId}/versions/${versionId}/judge-templates/${judgeTemplateId}/versions/2`,
    );
    request(
      "judge_template_delete",
      `/v1/projects/${projectId}/versions/${versionId}/judge-templates/${judgeTemplateId}`,
    );

    request(
      "raw_output_delete",
      `/v1/projects/${projectId}/versions/${versionId}/raw-llm-output/${rawOutputId}`,
    );
    request(
      "trace_collection_delete",
      `/v1/projects/${projectId}/versions/${versionId}/traces/collections/${traceCollectionId}`,
    );
    request("project_statistics_get", `/v1/projects/${projectId}/statistics`);
    request(
      "version_statistics_get",
      `/v1/projects/${projectId}/versions/${versionId}/statistics`,
    );
    const llmStatus = responseJson(
      request("settings_status_get", "/v1/settings/llm/status"),
      "settings_status_get",
    );
    check(llmStatus, {
      "Configured LLM is connected": (status) =>
        status && status.isConnected === true,
    });
    request("settings_default_get", "/v1/settings/llm/default-config");

    request(
      "versions_delete",
      `/v1/projects/${projectId}/versions/${versionId}`,
    );
    versionDeleted = true;
  } finally {
    if (projectId) {
      if (versionId && !versionDeleted) {
        request(
          "versions_delete",
          `/v1/projects/${projectId}/versions/${versionId}`,
        );
      }
      request("projects_delete", `/v1/projects/${projectId}`);
    }
  }
}

function metricValue(data, metricName, valueName) {
  const metric = data.metrics[metricName];
  const values = metric ? metric.values || metric : {};
  const value = values[valueName];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatNumber(value, digits = 2) {
  return value === null ? "N/A" : value.toFixed(digits);
}

function formatDuration(value) {
  return value === null ? "N/A" : `${formatNumber(value)} ms`;
}

function formatPercent(value) {
  return value === null ? "N/A" : `${formatNumber(value * 100)}%`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function buildReport(data) {
  const checksRate = metricValue(data, "checks", "rate");
  const failedRate = metricValue(data, "http_req_failed", "rate");
  const p95Duration = metricValue(
    data,
    "http_req_duration{scenario:project_list_load}",
    "p(95)",
  );
  const averageDuration = metricValue(data, "http_req_duration", "avg");
  const requests = metricValue(data, "http_reqs", "count");
  const requestsPerSecond = metricValue(data, "http_reqs", "rate");
  const virtualUsers =
    metricValue(data, "vus_max", "value") ?? metricValue(data, "vus", "max");
  const endpoints = apiOperations.map((operation) => {
    return {
      ...operation,
      requests: metricValue(data, `endpoint_${operation.id}_requests`, "count"),
      fastest: metricValue(data, `endpoint_${operation.id}_duration`, "min"),
      average: metricValue(data, `endpoint_${operation.id}_duration`, "avg"),
      p95: metricValue(data, `endpoint_${operation.id}_duration`, "p(95)"),
      slowest: metricValue(data, `endpoint_${operation.id}_duration`, "max"),
    };
  });
  const requiredEndpoints = endpoints.filter(
    (endpoint) => !endpoint.optional || settingsWriteEnabled,
  );
  const coveredEndpoints = requiredEndpoints.filter(
    (endpoint) => endpoint.requests !== null && endpoint.requests > 0,
  ).length;
  const rows = [
    {
      metric: "API operations covered",
      value: `${coveredEndpoints}/${requiredEndpoints.length}`,
      target: "All enabled operations",
      passed: coveredEndpoints === requiredEndpoints.length,
    },
    {
      metric: "HTTP checks passed",
      value: formatPercent(checksRate),
      target: `>${formatPercent(thresholds.checks)}`,
      passed: checksRate !== null && checksRate > thresholds.checks,
    },
    {
      metric: "Failed requests",
      value: formatPercent(failedRate),
      target: `<${formatPercent(thresholds.failedRequests)}`,
      passed: failedRate !== null && failedRate < thresholds.failedRequests,
    },
    {
      metric: "Projects-list load p95",
      value: p95Duration === null ? "N/A" : `${formatNumber(p95Duration)} ms`,
      target: `<${thresholds.p95DurationMs} ms`,
      passed: p95Duration !== null && p95Duration < thresholds.p95DurationMs,
    },
  ];

  return {
    rows,
    checksRate,
    failedRate,
    p95Duration,
    averageDuration,
    requests,
    requestsPerSecond,
    virtualUsers,
    passed: rows.every((row) => row.passed),
  };
}

function groupEndpoints(endpoints) {
  return endpoints.reduce((groups, endpoint) => {
    if (!groups[endpoint.feature]) {
      groups[endpoint.feature] = [];
    }
    groups[endpoint.feature].push(endpoint);
    return groups;
  }, {});
}

function endpointRowsMarkdown(report) {
  return Object.entries(groupEndpoints(report.endpoints))
    .map(([feature, endpoints]) => {
      const rows = endpoints
        .map((endpoint) => {
          const count =
            endpoint.requests === null
              ? "Skipped"
              : formatNumber(endpoint.requests, 0);
          return (
            `| ${endpoint.method} \`${endpoint.path}\` | ${endpoint.label} | ${count} | ` +
            `${formatDuration(endpoint.fastest)} | ${formatDuration(endpoint.average)} | ` +
            `${formatDuration(endpoint.p95)} | ${formatDuration(endpoint.slowest)} |`
          );
        })
        .join("\n");
      return [
        `#### ${feature}`,
        "",
        "| Endpoint | Feature operation | Requests | Fastest | Average | p95 | Slowest |",
        "| --- | --- | ---: | ---: | ---: | ---: | ---: |",
        rows,
      ].join("\n");
    })
    .join("\n\n");
}

function toMarkdown(report) {
  const status = report.passed ? "PASS" : "FAIL";
  const thresholdRows = report.rows
    .map(
      (row) =>
        `| ${row.metric} | ${row.value} | ${row.target} | ${row.passed ? "PASS" : "FAIL"} |`,
    )
    .join("\n");

  return [
    `## Backend k6 feature coverage and load test: ${status}`,
    "",
    "Feature coverage runs one disposable CRUD/API journey; projects-list load traffic runs separately.",
    "",
    "### Response time by backend feature and endpoint",
    "",
    endpointRowsMarkdown(report),
    "",
    "### Thresholds",
    "",
    "| Metric | Result | Target | Status |",
    "| --- | ---: | ---: | :---: |",
    thresholdRows,
    "",
    `Total requests: ${formatNumber(report.requests, 0)} (${formatNumber(report.requestsPerSecond)} req/s) · ` +
      `Average HTTP response time: ${formatDuration(report.averageDuration)} · ` +
      `Peak virtual users: ${formatNumber(report.virtualUsers, 0)}`,
    "",
  ].join("\n");
}

function endpointRowsHtml(report) {
  return Object.entries(groupEndpoints(report.endpoints))
    .map(([feature, endpoints]) => {
      const rows = endpoints
        .map((endpoint) => {
          const count =
            endpoint.requests === null
              ? "Skipped"
              : formatNumber(endpoint.requests, 0);
          return (
            `<tr><td>${escapeHtml(endpoint.method)} <code>${escapeHtml(endpoint.path)}</code></td>` +
            `<td>${escapeHtml(endpoint.label)}</td><td>${count}</td>` +
            `<td>${formatDuration(endpoint.fastest)}</td><td>${formatDuration(endpoint.average)}</td>` +
            `<td>${formatDuration(endpoint.p95)}</td><td>${formatDuration(endpoint.slowest)}</td></tr>`
          );
        })
        .join("");
      return `<tr class="feature"><th colspan="7">${escapeHtml(feature)}</th></tr>${rows}`;
    })
    .join("");
}

function toHtml(report) {
  const status = report.passed ? "Passed" : "Failed";
  const thresholdRows = report.rows
    .map(
      (row) =>
        `<tr><th scope="row">${escapeHtml(row.metric)}</th><td>${escapeHtml(row.value)}</td>` +
        `<td>${escapeHtml(row.target)}</td><td class="${row.passed ? "passed" : "failed"}">` +
        `${row.passed ? "Pass" : "Fail"}</td></tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Backend k6 feature coverage and load test</title>
  <style>
    :root { color-scheme: light; font-family: system-ui, sans-serif; color: #172033; background: #f4f6fa; }
    body { max-width: 1300px; margin: 40px auto; padding: 0 20px; }
    header, section { background: white; border: 1px solid #dfe4ec; border-radius: 12px; padding: 24px; margin-bottom: 20px; }
    h1 { margin: 0 0 8px; font-size: 1.6rem; }
    .status { font-weight: 700; color: ${report.passed ? "#16794b" : "#b42318"}; }
    .stats { display: flex; flex-wrap: wrap; gap: 24px; margin-top: 20px; }
    .stat strong { display: block; font-size: 1.35rem; }
    .stat span { color: #596579; font-size: .9rem; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th, td { padding: 10px; border-bottom: 1px solid #e8ebf0; vertical-align: top; }
    code { white-space: normal; overflow-wrap: anywhere; }
    td:last-child { font-weight: 600; }
    .feature th { background: #f1f4f9; padding-top: 16px; }
    .passed { color: #16794b; } .failed { color: #b42318; }
    footer { color: #596579; font-size: .9rem; margin: 16px 4px; }
  </style>
</head>
<body>
  <header>
    <h1>Backend k6 feature coverage and load test</h1>
    <div>One disposable API journey plus projects-list load · <span class="status">${status}</span></div>
    <div class="stats">
      <div class="stat"><strong>${formatNumber(report.requests, 0)}</strong><span>Requests</span></div>
      <div class="stat"><strong>${formatNumber(report.requestsPerSecond)}</strong><span>Requests / second</span></div>
      <div class="stat"><strong>${report.p95Duration === null ? "N/A" : `${formatNumber(report.p95Duration)} ms`}</strong><span>Projects-list load p95</span></div>
      <div class="stat"><strong>${formatNumber(report.virtualUsers, 0)}</strong><span>Peak virtual users</span></div>
    </div>
  </header>
  <section>
    <h2>Response time by backend feature and endpoint</h2>
    <table>
      <thead><tr><th scope="col">Endpoint</th><th scope="col">Feature operation</th><th scope="col">Requests</th><th scope="col">Fastest</th><th scope="col">Average</th><th scope="col">p95</th><th scope="col">Slowest</th></tr></thead>
      <tbody>${endpointRowsHtml(report)}</tbody>
    </table>
  </section>
  <section>
    <h2>Thresholds</h2>
    <table>
      <thead><tr><th scope="col">Metric</th><th scope="col">Result</th><th scope="col">Target</th><th scope="col">Status</th></tr></thead>
      <tbody>${thresholdRows}</tbody>
    </table>
  </section>
  <footer>Average HTTP response time across all requests: ${formatDuration(report.averageDuration)}. Generated by k6.</footer>
</body>
</html>`;
}

export function handleSummary(data) {
  const report = buildReport(data);
  return {
    "backend/k6/summary.html": toHtml(report),
    "backend/k6/summary.md": toMarkdown(report),
  };
}
