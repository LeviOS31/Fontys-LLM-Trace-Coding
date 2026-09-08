"use server";

import { client } from "@/lib/utils";

export async function getJudgePromptTemplate(axialCodeId: string) {
  const { data, error } = await client.judge({ axialCodeId }).get();

  if (error) {
    console.error(error);
    throw new Error(error.value.message);
  }

  return data;
}

export async function getLLMGeneratedJudgePromptTemplate(
  fromScratch: boolean,
  axialCodeId: string,
  feedback: string,
  prompt?: string,
) {
  const { data, error } = await client
    .judge({ axialCodeId })
    .generate.post({ feedback, scratch: fromScratch, prompt });

  if (error) {
    console.error(error);
    throw new Error(error.value.message);
  }

  return data;
}

export async function tryJudgeTestRun(axialCodeId: string, prompt: string) {
  const { data, error } = await client
    .judge({ axialCodeId })
    .test.post({ prompt });

  if (error) {
    console.error(error);
    throw new Error(error.value.message);
  }

  return data;
}
