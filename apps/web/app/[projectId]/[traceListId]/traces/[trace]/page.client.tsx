"use client";
import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Check,
  Flag,
  LoaderCircle,
  ThumbsDown,
  ThumbsUp,
  TriangleAlert,
  Sparkles,
  X,
  DownloadIcon,
} from "lucide-react";
import { toast } from "sonner";
import Markdown from "react-markdown";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

import TraceTreeView from "@/components/traces/trace-tree-view";

import { saveTrace, toggleAiSuggestions } from "./actions";
import {
  TraceShortcutsDialog,
  useTraceShortcutSettings,
  useTraceShortcuts,
} from "./trace-shortcuts";
import { HeaderActions } from "@/components/header-actions";
import TraceIcon from "@/components/traces/trace-icon";
import { Trace } from "@/lib/types";
import { useTraceStore } from "@/state/trace";
import { useProjectStore } from "@/state/project";
import { Toggle } from "@/components/ui/toggle";
import { Spinner } from "@/components/ui/spinner";
import TracelistExport from "@/components/tracelist/list/tracelist-export";

import { useAiSuggestion } from "./ai-suggestions";
import {
  AttachmentMimes,
  extractAttachments,
  filterAttachments,
} from "@/lib/attachments";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function AttachmentDialog({ attachments }: { attachments: string[] }) {
  if (attachments.length === 0) {
    return null;
  }
  return (
    <div className={"w-max flex flex-col"}>
      <p className={"text-xs text-muted-foreground mb-2"}>
        {attachments.length} attachment(s)
      </p>
      <div className={`flex overflow-auto flex-row gap-2 items-start mb-4`}>
        {attachments.map((item, i) => (
          <Dialog key={i}>
            <DialogTrigger asChild>
              <img
                alt={"attachment"}
                className={
                  "hover:opacity-80 cursor-pointer shadow rounded-xl overflow-clip min-h-40 max-h-40 object-cover"
                }
                src={item}
              />
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Attachment</DialogTitle>
              <img
                alt={"attachment"}
                className={
                  "w-full overflow-clip h-full object-contain object-center"
                }
                src={item}
              />
              <DialogFooter>
                <Button
                  onClick={() => {
                    const link = document.createElement("a");
                    const mime = item.substring(
                      item.indexOf(":") + 1,
                      item.indexOf(";"),
                    );
                    const ext =
                      mime in AttachmentMimes
                        ? AttachmentMimes[mime]
                        : "unknown";
                    link.href = item;
                    link.download = `attachment.${ext}`;
                    link.click();
                  }}
                  className={"w-max ml-auto"}
                  variant={"outline"}
                >
                  <DownloadIcon />
                  Download
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </div>
  );
}
function FeedbackButton({
  variant,
  selected,
  onClick,
  suggested,
}: {
  variant: "positive" | "negative";
  selected: boolean;
  onClick: () => void;
  suggested: boolean;
}) {
  const baseClasses =
    "flex-1 h-12 rounded-md border-3 border-transparent hover:bg-opacity-100 transition-colors duration-200";

  const extraClasses = {
    positive: {
      base: "bg-green-200 hover:bg-green-400",
      selected: "bg-green-500 hover:bg-green-500",
      suggested:
        "bg-green-200 border-green-500 text-green-500 hover:text-background hover:bg-green-500",
    },
    negative: {
      base: "bg-red-200 hover:bg-red-400",
      selected: "bg-red-500 hover:bg-red-500",
      suggested:
        "bg-red-200 border-red-500 text-red-500 hover:text-background hover:bg-red-500",
    },
  };

  return (
    <Button
      onClick={onClick}
      size="icon-lg"
      className={`${baseClasses} ${extraClasses[variant][selected ? "selected" : suggested ? "suggested" : "base"]}`}
      data-testid={`feedback-button-${variant}`}
    >
      {variant === "positive" ? (
        <ThumbsUp className="size-6" />
      ) : (
        <ThumbsDown className="size-6" />
      )}
    </Button>
  );
}

export default function ClientPage({
  trace: iTrace,
  aiSuggestionsEnabled: iAiSuggestionsEnabled,
  traceTreeViewMinimized,
  error,
}: {
  trace: Trace;
  aiSuggestionsEnabled: boolean;
  traceTreeViewMinimized: boolean;
  error?: {
    status: number | string;
    message: string;
  };
}) {
  const [selectedTrace, setSelectedTrace] = useState(iTrace.id);
  const [trace, setTrace] = useState({
    feedback: iTrace.feedback,
    openCode: iTrace.openCode || "",
    isFlagged: iTrace.isFlagged,
  });
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [savingState, setSavingState] = useState<"saved" | "saving" | "error">(
    "saved",
  );
  const [aiSuggestionsEnabled, setAiSuggestionsEnabled] = useState(
    iAiSuggestionsEnabled,
  );

  const project = useProjectStore((s) => s.project);
  const [isShortcutsDialogOpen, setIsShortcutsDialogOpen] = useState(false);
  const { shortcuts, saveShortcuts } = useTraceShortcutSettings();
  const openCodeInputRef = useRef<HTMLTextAreaElement>(null);
  const tracesContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const params = useParams();
  const savingStates: {
    state: "saving" | "saved" | "error";
    color: string;
    active?: string;
  }[] = [
    {
      state: "saving",
      color: "gray-400",
      active: "animate-spin",
    },
    {
      state: "saved",
      color: "green-500",
    },
    {
      state: "error",
      color: "red-500",
    },
  ];

  const { nextTrace, traceList } = useTraceStore((s) => s);

  const [suggestionDiscarded, setSuggestionDiscarded] = useState(false);

  useEffect(() => {
    const update = () => {
      setSuggestionDiscarded(false);
    };
    update();
  }, [iTrace.id]);

  const needSuggestion =
    aiSuggestionsEnabled && !trace.feedback && !trace.openCode;
  const suggestion = useAiSuggestion({
    currentTrace: iTrace.id,
    nextTrace,
    load: needSuggestion,
  });

  const traces = [iTrace];

  const addSubTraces = (trace: Trace) => {
    if (trace.traces) {
      if (collapsed.includes(trace.id)) {
        return;
      }

      for (const subTrace of trace.traces) {
        traces.push(subTrace);
        addSubTraces(subTrace);
      }
    }
  };
  addSubTraces(iTrace);

  useEffect(() => {
    if (error) {
      requestAnimationFrame(() => {
        toast.error(`${error.status}: ${error.message}`);
      });
    }
  }, [error]);

  const previousSavedRef = useRef(trace);

  const handleSave = async ({
    feedback,
    openCode,
    isFlagged,
  }: {
    feedback?: Trace["feedback"] | null;
    openCode?: string;
    isFlagged?: boolean;
  }) => {
    const newTrace = { ...trace };

    if (feedback !== undefined) {
      newTrace.feedback = feedback;
    }

    if (openCode !== undefined) {
      newTrace.openCode = openCode;
    }

    if (isFlagged !== undefined) {
      newTrace.isFlagged = isFlagged;
    }

    if (JSON.stringify(previousSavedRef.current) === JSON.stringify(newTrace)) {
      return;
    }

    previousSavedRef.current = newTrace;

    setTrace(newTrace);

    setSavingState("saving");

    try {
      await saveTrace({
        traceId: iTrace.id,
        feedback: newTrace.feedback,
        openCode: newTrace.openCode,
        isFlagged: newTrace.isFlagged,
      });

      setSavingState("saved");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unknown error");
      setSavingState("error");
      return false;
    }
  };

  const currentTraceIndex =
    traceList?.traces.findIndex((item) => item.id === iTrace.id) ?? -1;

  const gotoTraceById = (traceId?: string | null) => {
    if (!traceId) {
      return;
    }

    router.push(`/${project?.id}/${params.traceListId}/traces/${traceId}`);
    router.push(`/${project?.id}/${params.traceListId}/traces/${traceId}`);
  };

  const gotoNextTrace = () => {
    if (!project || !nextTrace) {
      return;
    }

    router.push(`/${project.id}/${params.traceListId}/traces/${nextTrace}`);
  };

  const gotoAdjacentTrace = (offset: 1 | -1) => {
    if (traceList?.traces.length === 0 || currentTraceIndex === -1) {
      return;
    }

    const nextIndex =
      (currentTraceIndex + offset + (traceList?.traces?.length ?? 0)) %
      (traceList?.traces.length ?? 0);

    gotoTraceById(traceList?.traces[nextIndex]?.id);
  };

  const focusOpenCodeInput = () => {
    requestAnimationFrame(() => {
      openCodeInputRef.current?.focus();
    });
  };

  const handleApprove = async () => {
    await handleSave({ feedback: "positive" });
  };

  const handleReject = async () => {
    const saved = await handleSave({ feedback: "negative" });
    if (saved) {
      focusOpenCodeInput();
    }
  };

  const handleToggleFlag = async () => {
    await handleSave({ isFlagged: !trace.isFlagged });
  };

  const handleSaveAndGoToNext = async () => {
    const saved = await handleSave({
      feedback: trace.feedback,
      openCode: trace.openCode,
      isFlagged: trace.isFlagged,
    });

    if (saved) {
      gotoNextTrace();
    }
  };

  useTraceShortcuts({
    onOpenShortcuts: () => setIsShortcutsDialogOpen(true),
    onGoToNextTrace: () => gotoAdjacentTrace(1),
    onGoToPreviousTrace: () => gotoAdjacentTrace(-1),
    onApprove: handleApprove,
    onRejectAndFocusOpenCode: handleReject,
    onToggleFlag: handleToggleFlag,
    onSaveAndGoToNext: handleSaveAndGoToNext,
    shortcuts,
    disabled: isShortcutsDialogOpen,
  });

  const scrollToTrace = (traceId: string) => {
    requestAnimationFrame(() => {
      const element = document.getElementById(`trace-${traceId}`);
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  };

  useEffect(() => {
    const container = tracesContainerRef.current;

    if (!container) {
      return;
    }

    const calculateSelectedTrace = () => {
      const traceElements = traces.map((trace) => {
        const element = document.getElementById(`trace-${trace.id}`);
        return {
          id: trace.id,
          element,
        };
      });

      const containerRect = container.getBoundingClientRect();

      let closestTraceId: string | null = null;
      let closestDistance = Infinity;

      for (const { id, element } of traceElements) {
        if (!element) {
          continue;
        }

        const elementRect = element.getBoundingClientRect();
        const distance = Math.abs(elementRect.top - containerRect.top);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestTraceId = id;
        }
      }

      if (closestTraceId && closestTraceId !== selectedTrace) {
        setSelectedTrace(closestTraceId);
      }
    };

    container.addEventListener("scroll", calculateSelectedTrace, {
      passive: true,
    });
    return () => {
      container.removeEventListener("scroll", calculateSelectedTrace);
    };
  }, [traces, selectedTrace]);

  return (
    <div className="relative w-full flex">
      <TraceShortcutsDialog
        open={isShortcutsDialogOpen}
        onOpenChange={setIsShortcutsDialogOpen}
        shortcuts={shortcuts}
        onSaveShortcuts={saveShortcuts}
      />

      <HeaderActions>
        <Toggle
          size="sm"
          variant="outline"
          className="px-3"
          pressed={aiSuggestionsEnabled}
          onPressedChange={async (p) => {
            const enabled = p.valueOf();

            setAiSuggestionsEnabled(enabled);
            toggleAiSuggestions(enabled);
          }}
        >
          <Sparkles />
          Suggestions
        </Toggle>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsShortcutsDialogOpen(true)}
          data-testid="open-shortcuts-dialog-button"
        >
          ? Shortcuts
        </Button>

        {traceList?.id && <TracelistExport traceListId={traceList.id} />}
      </HeaderActions>

      <TraceTreeView
        trace={iTrace}
        selectedTrace={selectedTrace}
        onTraceSelect={scrollToTrace}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        minimized={traceTreeViewMinimized}
      />

      <div className="flex flex-1 w-full gap-4 pl-2">
        <div
          ref={tracesContainerRef}
          className="w-full space-y-8 overflow-y-auto -mr-4 px-4 pb-12"
        >
          {traces.map((trace, idx) => {
            const attachments = extractAttachments(trace);
            trace = filterAttachments(trace);
            const information: {
              title: string;
              content?: string | null;
              attachments?: string[] | null;
            }[] = [
              {
                title: "System",
                content: trace.system,
                attachments: attachments.system,
              },
              {
                title: "Input",
                content: trace.input,
                attachments: attachments.input,
              },
              {
                title: "Output",
                content: trace.output,
                attachments: attachments.output,
              },
              {
                title: "Context",
                content: trace.context,
                attachments: attachments.context,
              },
            ];

            const isCollapsed = collapsed.includes(trace.id);

            return (
              <React.Fragment key={trace.id}>
                {idx !== 0 && <hr className="border-neutral-300" />}

                <div id={`trace-${trace.id}`} className="space-y-4">
                  <div>
                    <div className="flex gap-4 justify-between items-center">
                      <h1 className="flex items-center gap-2 text-2xl font-bold">
                        <TraceIcon
                          name={trace.name}
                          className="inline-block size-6 stroke-3"
                        />
                        {trace.name || "Untitled Trace"}
                      </h1>

                      <ChevronDown
                        className="size-5 transition-transform cursor-pointer"
                        style={{
                          transform: isCollapsed
                            ? "rotate(-90deg)"
                            : "rotate(0deg)",
                        }}
                        onClick={() => {
                          setCollapsed((prev) =>
                            prev.includes(trace.id)
                              ? prev.filter((id) => id !== trace.id)
                              : [...prev, trace.id],
                          );
                        }}
                      />
                    </div>

                    <p className="text-sm text-neutral-600">ID: {trace.id}</p>
                  </div>

                  {!isCollapsed &&
                    information.map(({ title, content, attachments }) => (
                      <Collapsible defaultOpen key={title}>
                        <CollapsibleTrigger className="group flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer text-black/60">
                          <h2 className="font-bold">{title}</h2>
                          <ChevronDown className="size-5 transition-transform group-data-[state=open]:rotate-0 group-data-[state=closed]:-rotate-90" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="CollapsibleContent">
                          <div
                            className={`overflow-hidden mt-2 rounded-lg border bg-accent p-4`}
                          >
                            <AttachmentDialog attachments={attachments ?? []} />
                            {content ? (
                              <div className={"contents markdown"}>
                                <Markdown>{content}</Markdown>
                              </div>
                            ) : (
                              <p className="text-sm font-bold text-neutral-400">
                                No {title.toLowerCase()} available
                              </p>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                </div>
              </React.Fragment>
            );
          })}
        </div>

        <div
          className="h-full flex flex-col min-w-70 max-w-70 space-y-4"
          style={{
            minWidth: 280,
            width: 280,
          }}
        >
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="group flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
              <span className="text-sm font-medium">Assessment criteria</span>
              <ChevronDown className="size-5 transition-transform group-data-[state=open]:rotate-0 group-data-[state=closed]:-rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent className="CollapsibleContent">
              <div className="w-full markdown p-4 mt-2 text-sm min-h-60 max-h-100 transition-all overflow-auto border rounded-lg">
                <div className="overflow-auto wrap-break-word">
                  <Markdown>{project?.assessmentCriteria}</Markdown>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="mt-auto space-y-5">
            {aiSuggestionsEnabled && (
              <div className="flex justify-between items-end">
                <span className="text-sm font-medium">AI Suggestions</span>
                {needSuggestion &&
                  !suggestionDiscarded &&
                  (suggestion ? (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon-xs"
                        disabled={!suggestion}
                        onClick={async () => {
                          if (!suggestion) return;
                          handleSave(suggestion);
                        }}
                      >
                        <Check />
                      </Button>

                      <Button
                        variant="outline"
                        size="icon-xs"
                        disabled={!suggestion}
                        onClick={() => setSuggestionDiscarded(true)}
                      >
                        <X />
                      </Button>
                    </div>
                  ) : (
                    <Spinner className="text-foreground/60" />
                  ))}
              </div>
            )}

            <Field>
              <FieldLabel className="flex gap-3 justify-between items-center">
                <span>Feedback</span>

                <div className="relative size-4 bg-white rounded-full">
                  {([LoaderCircle, Check, TriangleAlert] as const).map(
                    (Icon, index) => {
                      const state = savingStates[index];

                      return (
                        <Icon
                          key={index}
                          className={`absolute top-1/2 left-1/2 -translate-1/2 w-full h-full text-${state.color} transition-opacity duration-300 ${
                            savingState === state.state
                              ? state.active
                              : "opacity-0"
                          }`}
                        />
                      );
                    },
                  )}
                </div>
              </FieldLabel>

              <div className="flex gap-3">
                <FeedbackButton
                  variant="positive"
                  selected={trace.feedback === "positive"}
                  suggested={
                    suggestion?.feedback === "positive" && !suggestionDiscarded
                  }
                  onClick={() =>
                    handleSave({
                      feedback:
                        trace.feedback === "positive" ? null : "positive",
                    })
                  }
                />
                <FeedbackButton
                  variant="negative"
                  selected={trace.feedback === "negative"}
                  suggested={
                    suggestion?.feedback === "negative" && !suggestionDiscarded
                  }
                  onClick={() =>
                    handleSave({
                      feedback:
                        trace.feedback === "negative" ? null : "negative",
                    })
                  }
                />
              </div>
            </Field>
            <Field>
              <FieldLabel
                htmlFor="open-code"
                className={`transition-opacity ${trace.feedback === "negative" || (suggestion?.openCode && !suggestionDiscarded) ? "" : "opacity-40"}`}
              >
                Open code
              </FieldLabel>
              <Textarea
                ref={openCodeInputRef}
                id="open-code"
                placeholder={
                  (suggestionDiscarded ? null : suggestion?.openCode) ??
                  "Enter open code here..."
                }
                value={trace.openCode}
                onChange={(e) =>
                  setTrace((prev) => ({
                    ...prev,
                    openCode: e.target.value,
                  }))
                }
                onBlur={(e) =>
                  handleSave({
                    openCode: e.target.value,
                  })
                }
                onKeyDown={async (e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    e.preventDefault();
                    await handleSaveAndGoToNext();
                    e.currentTarget.blur();
                  }
                }}
                style={{
                  height: 134,
                  opacity:
                    suggestion?.openCode && !suggestionDiscarded
                      ? 1
                      : undefined,
                }}
                className="w-full resize-none"
                disabled={trace.feedback !== "negative"}
                data-testid="open-code-input"
              />
            </Field>
            <div className="flex gap-4 justify-end">
              <Button
                onClick={handleToggleFlag}
                size="lg"
                variant={trace.isFlagged ? "default" : "outline"}
                className={`border ${trace.isFlagged ? "bg-orange-400 border-transparent hover:bg-orange-400/80" : ""}`}
              >
                <Flag />
              </Button>

              <Button
                onClick={gotoNextTrace}
                disabled={(() => {
                  if (!nextTrace) {
                    return true;
                  }

                  if (trace.isFlagged) {
                    return false;
                  }

                  if (trace.feedback === null) {
                    return true;
                  }

                  if (trace.feedback === "negative" && !trace.openCode) {
                    return true;
                  }
                })()}
                size="lg"
                data-testid="next-button"
              >
                {nextTrace ? "Next" : "Finished"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
