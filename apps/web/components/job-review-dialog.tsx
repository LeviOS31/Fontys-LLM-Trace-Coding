"use client";

import { useJobStore } from "@/state/job";
import {
  type Job,
  type DiffStatus,
  type OriginalAxialCode,
  type PendingAxialCode,
  asRegenerateMetadata,
} from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  acceptRegeneration,
  rejectRegeneration,
} from "@/app/[projectId]/[traceListId]/axial-codes/actions";
import { Table } from "lucide-react";

interface DiffEntry {
  title: string;
  status: DiffStatus;
  original?: OriginalAxialCode;
  pending?: PendingAxialCode;
}

function computeDiff(
  original: OriginalAxialCode[],
  pending: PendingAxialCode[],
): DiffEntry[] {
  const entries: DiffEntry[] = [];
  const pendingByTitle = new Map(
    pending.map((p) => [p.title.toLowerCase(), p]),
  );
  const originalByTitle = new Map(
    original.map((o) => [o.title.toLowerCase(), o]),
  );

  for (const orig of original) {
    const pend = pendingByTitle.get(orig.title.toLowerCase());
    if (!pend) {
      entries.push({ title: orig.title, status: "removed", original: orig });
    } else {
      const changed =
        orig.description !== pend.description ||
        orig.connections.length !== pend.connections.length;
      entries.push({
        title: orig.title,
        status: changed ? "modified" : "unchanged",
        original: orig,
        pending: pend,
      });
    }
  }

  for (const pend of pending) {
    if (!originalByTitle.has(pend.title.toLowerCase())) {
      entries.push({ title: pend.title, status: "added", pending: pend });
    }
  }

  return entries;
}

const leftBorder: Record<DiffStatus, string> = {
  added: "border-l-4 border-l-green-500",
  removed: "border-l-4 border-l-red-400",
  modified: "border-l-4 border-l-yellow-400",
  unchanged: "border-l-4 border-l-transparent",
};

const statusConfig: Record<DiffStatus, { label: string; className: string }> = {
  added: {
    label: "Added",
    className: "bg-green-50 text-green-700 border-green-200",
  },
  removed: {
    label: "Removed",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  modified: {
    label: "Modified",
    className: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  unchanged: {
    label: "Unchanged",
    className: "bg-neutral-50 text-neutral-500 border-neutral-200",
  },
};

function AxialCodeCard({
  entry,
  side,
}: {
  entry: DiffEntry;
  side: "original" | "pending";
}) {
  const code =
    side === "original" ? entry.original : (entry.pending ?? entry.original);
  const count =
    code === entry.original
      ? (entry.original?.connections.length ?? 0)
      : (entry.pending?.connections.length ?? 0);

  const { label, className } = statusConfig[entry.status];

  return (
    <div
      className={`rounded-md border bg-card p-4 space-y-2 ${leftBorder[entry.status]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium text-sm leading-tight">{code?.title}</h3>
        <span
          className={`text-xs border rounded px-1.5 py-0.5 shrink-0 ${className}`}
        >
          {label}
        </span>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-3">
        {code?.description}
      </p>
      {entry.status === "modified" &&
        entry.original &&
        entry.pending &&
        side === "pending" && (
          <p className="text-xs text-yellow-600">
            Connections: {entry.original.connections.length} →{" "}
            {entry.pending.connections.length}
          </p>
        )}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Table size={12} />
        <span>
          {count} {count === 1 ? "connection" : "connections"}
        </span>
      </div>
    </div>
  );
}

function DiffView({ job }: { job: Job }) {
  const meta = asRegenerateMetadata(job.metadata);
  const prompt = meta?.regeneratePrompt;
  const original = meta?.originalOutput ?? [];
  const pending = meta?.pendingOutput ?? [];
  const diff = computeDiff(original, pending);

  const added = diff.filter((d) => d.status === "added").length;
  const removed = diff.filter((d) => d.status === "removed").length;
  const modified = diff.filter((d) => d.status === "modified").length;

  return (
    <div className="flex flex-col gap-4 min-h-0 flex-1">
      {prompt && (
        <div className="rounded-md border bg-neutral-50 p-3">
          <p className="text-xs text-muted-foreground mb-1 font-medium">
            Instruction
          </p>
          <p className="text-sm">{prompt}</p>
        </div>
      )}

      <div className="flex items-center gap-4 text-sm">
        {added > 0 && (
          <span className="flex items-center gap-1.5 text-green-700">
            <span className="font-semibold">+{added}</span> added
          </span>
        )}
        {removed > 0 && (
          <span className="flex items-center gap-1.5 text-red-600">
            <span className="font-semibold">-{removed}</span> removed
          </span>
        )}
        {modified > 0 && (
          <span className="flex items-center gap-1.5 text-yellow-600">
            <span className="font-semibold">~{modified}</span> modified
          </span>
        )}
        {added === 0 && removed === 0 && modified === 0 && (
          <span className="text-muted-foreground">No changes</span>
        )}
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-6 min-h-0 flex-1">
        <div className="flex flex-col gap-2 min-h-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Current — {original.length} codes
          </p>
          <ScrollArea className="flex-1 h-[420px]">
            <div className="space-y-2 pr-3">
              {diff
                .filter((d) => d.status !== "added")
                .map((entry) => (
                  <AxialCodeCard
                    key={entry.title + "-orig"}
                    entry={entry}
                    side="original"
                  />
                ))}
            </div>
          </ScrollArea>
        </div>

        <div className="flex flex-col gap-2 min-h-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            New — {pending.length} codes
          </p>
          <ScrollArea className="flex-1 h-[420px]">
            <div className="space-y-2 pr-3">
              {diff
                .filter((d) => d.status !== "removed")
                .map((entry) => (
                  <AxialCodeCard
                    key={entry.title + "-new"}
                    entry={entry}
                    side="pending"
                  />
                ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

export default function JobReviewDialog() {
  const pendingReviewJob = useJobStore((s) => s.pendingReviewJob);
  const setPendingReviewJob = useJobStore((s) => s.setPendingReviewJob);
  const removeJob = useJobStore((s) => s.removeJob);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!pendingReviewJob) return null;

  const meta = asRegenerateMetadata(pendingReviewJob.metadata);
  const traceListId = meta?.traceListId;

  function handleAccept() {
    if (!traceListId) return;
    startTransition(async () => {
      try {
        await acceptRegeneration(traceListId, pendingReviewJob!.id);
        removeJob(pendingReviewJob!.id);
        setPendingReviewJob(null);
        toast.success("Changes applied");
        router.refresh();
      } catch {
        toast.error("Failed to apply changes");
      }
    });
  }

  function handleReject() {
    if (!traceListId) return;
    startTransition(async () => {
      try {
        await rejectRegeneration(traceListId, pendingReviewJob!.id);
        removeJob(pendingReviewJob!.id);
        setPendingReviewJob(null);
        toast.success("Changes discarded");
      } catch {
        toast.error("Failed to discard changes");
      }
    });
  }

  return (
    <Dialog
      open={!!pendingReviewJob}
      onOpenChange={(open) => !open && setPendingReviewJob(null)}
    >
      <DialogContent className="max-w-5xl w-full flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle>Review axial code changes</DialogTitle>
          <p className="text-sm text-muted-foreground">
            The AI has generated a new set of axial codes. Review the changes
            below before applying them.
          </p>
        </DialogHeader>

        <DiffView job={pendingReviewJob} />

        <DialogFooter>
          <Button variant="outline" onClick={handleReject} disabled={isPending}>
            Discard
          </Button>
          <Button onClick={handleAccept} disabled={isPending || !traceListId}>
            {isPending ? "Applying..." : "Accept changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
