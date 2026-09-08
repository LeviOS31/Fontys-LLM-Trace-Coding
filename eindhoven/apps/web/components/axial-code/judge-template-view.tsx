"use client";

import {
  forwardRef,
  startTransition,
  useActionState,
  useEffect,
  useState,
} from "react";
import {
  CheckCircleIcon,
  CheckIcon,
  EllipsisVertical,
  GavelIcon,
  SparklesIcon,
  XCircleIcon,
} from "lucide-react";

import {
  getJudgePromptTemplate,
  getLLMGeneratedJudgePromptTemplate,
  tryJudgeTestRun,
} from "@/app/[projectId]/[traceListId]/axial-codes/[axialCodeId]/actions";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Props {
  axialCodeId: string;
}

export default function JudgeView({ axialCodeId }: Props) {
  const [prompts, setPrompts] = useState<
    { system: string; user: string } | undefined
  >();
  const [fromScratch, setFromScratch] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [testPrompt, setTestPrompt] = useState<"static" | "llm">();
  const [state, formAction, pending] = useActionState(
    fetchLLMGeneratedJudgePromptTemplate,
    undefined,
  );
  const [runState, runFormAction, runPending] = useActionState(
    fetchTryJudgeTestRun,
    undefined,
  );
  const [editedPrompt, setEditedPrompt] = useState<string>(state ?? "");

  useEffect(() => {
    startTransition(() => setEditedPrompt(state ?? ""));
  }, [state]);

  async function fetchJudgePromptTemplate() {
    const response = await getJudgePromptTemplate(axialCodeId);
    setPrompts(response);
  }

  async function fetchLLMGeneratedJudgePromptTemplate(
    _: string | undefined,
    formData: FormData | undefined,
  ) {
    const response = await getLLMGeneratedJudgePromptTemplate(
      fromScratch,
      axialCodeId,
      formData?.get("feedback")?.toString() ?? "",
      prompts?.system ?? "",
    );
    return response;
  }

  async function fetchTryJudgeTestRun() {
    const targetPrompt =
      testPrompt === "llm" && state ? state : prompts?.system;
    const response = await tryJudgeTestRun(axialCodeId, targetPrompt ?? "");
    return response;
  }

  async function executeRun(type: "static" | "llm") {
    setTestPrompt(type);
    setIsOpen(true);
  }

  useEffect(() => {
    (() => fetchJudgePromptTemplate())();
  }, []);

  return (
    <div className="flex flex-col gap-2 h-full">
      <div
        className={`grid gap-3 h-full ${state || pending ? "grid-cols-[1fr_0.8fr]" : "grid-cols-1"}`}
      >
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex justify-between h-fit">
            <div>
              <h2 className="text-xl font-semibold">Static template</h2>
              <p className="text-sm text-neutral-600">
                Staticly generated LLM-as-a-judge prompt template based on the
                system-wide template.
              </p>
            </div>
            <Button variant="secondary" onClick={() => executeRun("static")}>
              <GavelIcon />
            </Button>
          </div>

          <div className="flex flex-col flex-1 h-full gap-4">
            <div className="h-full flex flex-col flex-1 gap-2">
              <h3 className="text-lg font-semibold">System prompt</h3>
              <TextareaWithCopy
                className={"h-50!"}
                value={prompts?.system ?? ""}
                onChange={(e) =>
                  setPrompts((prev) => ({
                    user: prev?.user ?? "",
                    system: e.currentTarget.value.toString(),
                  }))
                }
                copiedLabel={<CheckIcon size="20" />}
              />
            </div>
            <div className="h-full flex flex-col flex-1 gap-2">
              <h3 className="text-lg font-semibold">User prompt</h3>
              <TextareaWithCopy
                value={prompts?.user ?? ""}
                onChange={(e) =>
                  setPrompts((prev) => ({
                    system: prev?.system ?? "",
                    user: e.currentTarget.value.toString(),
                  }))
                }
                copiedLabel={<CheckIcon size="20" />}
              />
            </div>
          </div>
        </div>

        {(state || pending) && (
          <div className="flex flex-col gap-2 h-full relative">
            <div className="flex justify-between h-fit">
              <div>
                <h2 className="text-xl font-semibold">
                  LLM generated template
                </h2>
                <p className="text-sm text-neutral-600">
                  LLM generated template based on user provided feedback and
                  axial code data.
                </p>
              </div>
              <Button variant="secondary" onClick={() => executeRun("llm")}>
                <GavelIcon />
              </Button>
            </div>

            {pending ? (
              <div className="flex field-sizing-content w-full flex-1 overflow-scroll rounded-md border border-input bg-transparent px-3 py-2 shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:ring-destructive/40">
                <div className="max-h-full w-full">
                  <RandomSkeletonParagraphs
                    lines={20}
                    minWidth={5}
                    maxWidth={95}
                  />
                </div>
              </div>
            ) : (
              <TextareaWithCopy
                value={editedPrompt ?? ""}
                onChange={(e) => setEditedPrompt(e.target.value)}
                copiedLabel={<CheckIcon size="20" />}
              />
            )}
          </div>
        )}
      </div>
      <form className="flex gap-2" action={formAction}>
        <Input
          name="feedback"
          placeholder="Template feedback"
          className="w-full"
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon">
              <EllipsisVertical />
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <PopoverHeader>
              <PopoverTitle>Extra options</PopoverTitle>
              <PopoverDescription>
                Extra settings and options for LLM-as-a-judge prompt generation
              </PopoverDescription>
            </PopoverHeader>

            <div className="grid gap-2 mt-4">
              <Field orientation="horizontal">
                <FieldLabel htmlFor="from-scratch-generation">
                  From scratch
                </FieldLabel>
                <Checkbox
                  id="from-scratch-generation"
                  name="from-scratch-generation"
                  checked={fromScratch}
                  onCheckedChange={(e) => setFromScratch(Boolean(e))}
                />
              </Field>
            </div>
          </PopoverContent>
        </Popover>
        <Button type="submit" disabled={pending}>
          {pending ? <Spinner /> : <SparklesIcon />}
          Generate
        </Button>
      </form>

      <Drawer direction="right" open={isOpen}>
        <DrawerContent className="min-w-1/2">
          <DrawerHeader>
            <DrawerTitle className="flex gap-2">
              <GavelIcon /> Judge test run
            </DrawerTitle>
            <DrawerDescription>
              Test run the LLM-as-a-judge prompt.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 min-w-1/2">
            {runState || pending ? (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableHead>Verdict</TableHead>
                    <TableHead>Trace ID</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Justification</TableHead>
                  </TableHeader>
                  <TableBody>
                    {runPending
                      ? Array.from({ length: 10 }).map((_, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <RandomSkeletonParagraphs
                                lines={1}
                                minWidth={45}
                                maxWidth={95}
                              />
                            </TableCell>
                            <TableCell>
                              <RandomSkeletonParagraphs
                                lines={1}
                                minWidth={45}
                                maxWidth={95}
                              />
                            </TableCell>
                            <TableCell>
                              <RandomSkeletonParagraphs
                                lines={1}
                                minWidth={45}
                                maxWidth={95}
                              />
                            </TableCell>
                            <TableCell>
                              <RandomSkeletonParagraphs
                                lines={1}
                                minWidth={45}
                                maxWidth={95}
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      : runState &&
                        runState.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {Boolean(row.response.verdict) ? (
                                <CheckCircleIcon size="14" color="green" />
                              ) : (
                                <XCircleIcon size="14" color="red" />
                              )}
                            </TableCell>
                            <TableCell>{row.trace.id}</TableCell>
                            <TableCell>{row.response.severity}</TableCell>
                            <TableCell>
                              {row.response.justification.length > 20
                                ? row.response.justification
                                    .toString()
                                    .slice(0, 20) + "..."
                                : row.response.justification}
                            </TableCell>
                          </TableRow>
                        ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <>No run has been done yet, start one to test the prompt!</>
            )}
          </div>
          <DrawerFooter>
            <form action={runFormAction} className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsOpen(false)}
                className="w-1/2"
              >
                Close
              </Button>
              <Button
                id="run-submit"
                type="submit"
                disabled={runPending}
                className="w-1/2"
              >
                {runPending && <Spinner />} Start run
              </Button>
            </form>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

export interface TextareaWithCopyProps extends Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "onCopy"
> {
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onCopy?: (text: string) => void;
  copyLabel?: React.ReactNode;
  copiedLabel?: React.ReactNode;
  copiedDuration?: number;
  containerClassName?: string;
  textareaClassName?: string;
}

const TextareaWithCopy = forwardRef<HTMLTextAreaElement, TextareaWithCopyProps>(
  function TextareaWithCopy(
    {
      value,
      onChange,
      onCopy,
      copyLabel = "Copy",
      copiedLabel = "Copied!",
      copiedDuration = 1500,
      className = "",
      textareaClassName = "resize-none",
      ...textareaProps
    },
    ref,
  ) {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = async (text: string) => {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.style.position = "fixed";
          ta.style.left = "-9999px";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
        }
        setCopied(true);
        onCopy?.(text);
        setTimeout(() => setCopied(false), copiedDuration);
      } catch (err) {
        setCopied(false);
        console.error("Copy failed", err);
      }
    };

    return (
      <div className={`relative h-full ${className}`}>
        <Textarea
          ref={ref}
          value={value}
          onChange={onChange}
          className={`${textareaClassName} h-full pr-14`}
          {...textareaProps}
        />
        <Button
          type="button"
          onClick={() => copyToClipboard(value)}
          className="absolute right-2 bottom-2"
          size="sm"
          aria-label="Copy textarea content"
        >
          {copied ? copiedLabel : copyLabel}
        </Button>
      </div>
    );
  },
);

export function RandomSkeletonParagraphs({
  lines = 4,
  minWidth = 30,
  maxWidth = 100,
  className = "",
}) {
  const [widths] = useState(() =>
    Array.from(
      { length: lines },
      () => Math.floor(Math.random() * (maxWidth - minWidth + 1)) + minWidth,
    ),
  );

  return (
    <div className={`space-y-2 ${className} w-full`}>
      {widths.map((w, i) => (
        <Skeleton key={i} style={{ width: `${w}%` }} className="h-4" />
      ))}
    </div>
  );
}
