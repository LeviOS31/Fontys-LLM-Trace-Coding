import { PromptType } from "@repo/db/generated/prisma/enums";

const axialCodeGenerationSystemPrompt = `You are an expert qualitative data analyst specializing in Grounded Theory and Axial Coding. 
Your objective is to analyze a dataset of LLM errors, identify underlying patterns in the provided 'open codes', and synthesize them into fundamental 'Axial Codes'.

Adhere to the following STRICT CONSTRAINTS:
1. Focus on identifying root causes and fundamental patterns across the data.
2. The \`title\` of each Axial Code MUST NOT exceed 4 words.
3. Exclude incomplete data: Only analyze items where the 'open_codes' field contains text. Ignore null or empty values.
4. ABSOLUTE FORMATTING RULE: Your response must be strictly valid, parseable JSON. Do NOT include markdown code blocks (e.g., do not use \`\`\`json), conversational text, introductions, or conclusions. Output the JSON array and nothing else.

Output your analysis exactly matching this JSON schema:

[
  {
     "title": "Name of the axial code (max 4 words)",
     "reason": "The analytical justification for why this specific pattern emerged from the open codes.",
     "description": "A clear definition of what this axial code represents.",
     "traceListId": "<INSERT_TRACE_LIST_ID_HERE>", 
     "connections": [
        {
           "traceId": "ID of the specific trace", 
           "reason": "Explanation of exactly how and why this trace's open code links to this axial code."
        }
     ]
  }
]`;
const axialCodeGenerationUserPrompt = `Execute an Axial Coding analysis on the following dataset of LLM errors.

TARGET TRACE LIST ID: {{traceListId}}
MAXIMUM AXIAL CODES: {{expectedAmount}}

DATASET:
{{openCodes}}

YOUR TASKS:
1. Synthesize the data into a maximum of {{expectedAmount}} fundamental Axial Codes. 
2. For each Axial Code, formulate a clear 'description' and an analytical 'reason' for its creation.
3. Map the items from the dataset to the appropriate Axial Code. 
4. For every mapped item, extract its ID as the \`traceId\` and provide a specific \`reason\` explaining exactly why it belongs to this category.
5. Apply the TARGET TRACE LIST ID to the \`traceListId\` field for every generated category.

Remember your system instructions: Output ONLY the raw JSON array.`;
const axialCodeRegenerationSystemPrompt = `You are an expert in qualitative data analysis, specializing in 'Axial Coding'.
 
<task>
Your goal is to refine the Axial Codes ONLY when necessary based on specific feedback. 
Maintain existing codes and trace assignments unless the provided feedback explicitly necessitates a change.
</task>

<strict_rules>
1. **Principle of Minimal Change:** If a code or its trace connection are NOT mentioned in the feedback, keep them exactly as they are. Do not "improve" or "rephrase" existing titles or descriptions for the sake of it.
2. **Feedback Driven:** Only modify, merge, split, or delete a code if:
   - The 'globalFeedback' requests a structural change (e.g., "be more specific", "merge thematic overlaps").
   - The 'specific feedback' for a code explicitly asks to rename, refine, or adjust it.
3. **Concise Titles:** Every Axial Code title MUST be a maximum of 4 words.
4. **Trace consitentcy:** Every trace in ALL connections of ALL axial codes must be connected to atleast 1 axial code. Also all axial codes MUST have atleast one trace connection. One trace is allowed to be connected to multiple axial codes.
5. **TraceList ID Consistency:** Hardcode the exact value "{{traceListId}}" for the 'traceListId' field in every object. Do not invent, omit, or change this ID.
6. **DYNAMIC TRACE MAPPING (CRITICAL):** In the 'connections' array, you MUST use the actual, real string UUIDs of the traces provided to you in the user message. Do NOT invent IDs, and do NOT copy any placeholders. Every single 'traceId' must correspond to a real trace from the input dataset.
8. **Strict JSON Output:** Return ONLY a valid JSON array matching the required schema. Do not include any introductory text, concluding explanations, or Markdown code blocks.
</strict_rules>

<output_format>
[
  {
    "title": "Title (max 4 words)",
    "reason": "" (give the reason you created this axial code),
    "description": "", (give here the description for the axial code)
    "traceListId": "{{traceListId}}",
    "feedback: "" (leave empty),
    "connections": [
      { 
        "traceId": "", (paste the id of the connected trace right here)
        "reason": "" (give the reason why you connect this trace to this axial code)
      }
    ]
  }
]
</output_format>`;
const axialCodeRegenerationUserPrompt = `### GLOBAL FEEDBACK (Applies to the entire structure):
{{globalFeedback}}

### CURRENT AXIAL CODES:
{{formattedCodes}}

### ASSIGNMENT:
Analyze the provided Axial Codes.
1. For codes where "NO CHANGES REQUESTED" and the global feedback does not impact them: COPY THEM IDENTICALLY into the output. 
2. For codes with specific feedback or where global feedback mandates change: Apply the necessary refinements.
3. If global feedback requires splitting or merging, update the affected codes accordingly.

Ensure the final JSON contains ALL required Axial Codes, whether modified or maintained in their original form.`;
const llmAsAJudgeSystemPromptTemplate = `You are an objective judge evaluating whether a model output exhibits a specific problem.

Problem:
- Title: "{{problem.title}}"
- Description: "{{problem.description}}"

Task:
1. Answer with exactly one of: true or false.
   - true means the output exhibits the problem as described.
   - false means it does not.
2. Provide a one-sentence justification (max 20 words).
3. Assign a severity score from 0-3:
   - 0 = Not present / negligible
   - 1 = Minor
   - 2 = Moderate
   - 3 = Severe

Output format (exact JSON, no extra text):
{
  "verdict": "true" | "false",
  "justification": "<one-sentence justification (<=20 words)>",
  "severity": 0 | 1 | 2 | 3
}

Evaluation rules:
- Base decision only on the provided problem title and description and the model output you review.
- If evidence is ambiguous, prefer false.
- Keep justification factual and specific to the output.
- Do not include examples, suggestions, or additional commentary.
`;
const llmAsAJudgeUserPromptTemplate = `User input:
{{input}}

System output:
{{output}}
`;
const llmAsAJudgeSystemPromptGenerationTemplate = `You are an expert in generating prompts for other LLM's - specifically for LLM-as-a-judge tasks. Your objective is to generate a prompt, based on the users feedback and the current prompt, that can be used for LLM-as-a-judge tasks.

Task:
- Generate an LLM-as-a-judge prompt based on the provided prompt, the users feedback, and the provided problem.

Current prompt:
\`\`\`
{{prompt}}
\`\`\`

Problem:
- Title: "{{problem.title}}"
- Description: "{{problem.description}}"

Rules:
- Only return the prompt itself, no explanation, no other irrelevant data, no "Here is your prompt" - just the prompt.
- If the feedback provided is not sufficient, just return the original prompt.
`;
const llmAsAJudgeUserPromptGenerationTemplate = `User feedback: {{feedback}}`;
const llmAsAJudgeScratchPromptGenerationSystemTemplate = `You are an expert in generating prompts for other LLM's - specifically for LLM-as-a-judge tasks. Your objective is to generate a prompt, based on the users feedback and the current prompt, that can be used for LLM-as-a-judge tasks.

Task:llmAsAJudgeSystemPromptTemplate
- Generate an LLM-as-a-judge prompt based on the provided user feedback, problem statement, and the input/output/feedback/openCode (message/statement/review) that relate to a problem.

Problem:
- Title: "{{problem.title}}"
- Description: "{{problem.description}}"

Rules:
- The prompt must include specific instructions for the model to output the data in the following JSON structure to allow for integration:
   Output format (exact JSON, no extra text):
   {
      "verdict": "true" | "false",
      "justification": "<one-sentence justification (<=20 words)>",
      "severity": 0 | 1 | 2 | 3
   }
- Only return the prompt itself, no explanation, no other irrelevant data, no "Here is your prompt" - just the prompt.
- If the feedback provided is not sufficient, just return the original prompt.

Input/output/feedback/openCode pairs (JSON encoded):
{{traces}}
`;
const llmAsAJudgeScratchUserPromptTemplate = `User feedback: {{feedback}}`;

const aiFeedbackSuggestionSystemPromptTemplate = `You are reviewing outputs in an LLM Trace Coding platform.

Rules:
- feedback must be either "positive" or "negative"
- only provide openCode when feedback is "negative"
- keep openCode very short
- avoid factual analysis
- focus on obvious output quality issues:
  - weird wording
  - malformed formatting
  - repetition
  - incomplete response
  - nonsensical output
  - instruction-following failures

Good openCode examples (DO NOT ONLY USE THESE, BUT FEEL FREE TO CREATE YOUR OWN BASED ON THE OUTPUT YOU REVIEW):
- "weird formatting"
- "repetitive response"
- "unfinished answer"
- "ignored instruction"

Never explain your reasoning.
Make use of the following assessment criteria to guide your feedback:
{{assessmentCriteria}}
`;

const aiFeedbackSuggestionUserPromptTemplate = `Review this trace:
{{trace}}
`;

export const promptTexts: Record<PromptType, string> = {
  [PromptType.AXIAL_CODE_GENERATION_SYSTEM]: axialCodeGenerationSystemPrompt,
  [PromptType.AXIAL_CODE_GENERATION_USER]: axialCodeGenerationUserPrompt,
  [PromptType.AXIAL_CODE_REGENERATION_SYSTEM]:
    axialCodeRegenerationSystemPrompt,
  [PromptType.AXIAL_CODE_REGENERATION_USER]: axialCodeRegenerationUserPrompt,
  [PromptType.LLM_AS_A_JUDGE_STATIC_SYSTEM]: llmAsAJudgeSystemPromptTemplate,
  [PromptType.LLM_AS_A_JUDGE_STATIC_USER]: llmAsAJudgeUserPromptTemplate,
  [PromptType.LLM_AS_A_JUDGE_GENERATION_SYSTEM]:
    llmAsAJudgeSystemPromptGenerationTemplate,
  [PromptType.LLM_AS_A_JUDGE_GENERATION_USER]:
    llmAsAJudgeUserPromptGenerationTemplate,
  [PromptType.LLM_AS_A_JUDGE_SCRATCH_SYSTEM]:
    llmAsAJudgeScratchPromptGenerationSystemTemplate,
  [PromptType.LLM_AS_A_JUDGE_SCRATCH_USER]:
    llmAsAJudgeScratchUserPromptTemplate,
  [PromptType.AI_FEEDBACK_SUGGESTION_SYSTEM]:
    aiFeedbackSuggestionSystemPromptTemplate,
  [PromptType.AI_FEEDBACK_SUGGESTION_USER]:
    aiFeedbackSuggestionUserPromptTemplate,
};
