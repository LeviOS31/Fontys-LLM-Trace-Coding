"use client";

import {
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { RotateCcw } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type TraceShortcutsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcuts: TraceShortcutMap;
  onSaveShortcuts: (shortcuts: TraceShortcutMap) => void;
};

type TraceShortcutsBindings = {
  onOpenShortcuts: () => void;
  onGoToNextTrace: () => void;
  onGoToPreviousTrace: () => void;
  onApprove: () => void | Promise<void>;
  onRejectAndFocusOpenCode: () => void | Promise<void>;
  onToggleFlag: () => void | Promise<void>;
  onSaveAndGoToNext: () => void | Promise<void>;
  shortcuts: TraceShortcutMap;
  disabled?: boolean;
};

const SHORTCUT_STORAGE_KEY = "trace-shortcuts-v1";

export type TraceShortcutAction =
  | "openShortcuts"
  | "goToNextTrace"
  | "goToPreviousTrace"
  | "approve"
  | "rejectAndFocusOpenCode"
  | "toggleFlag"
  | "saveAndGoToNext";

export type TraceShortcut = {
  key: string;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
  alt: boolean;
};

export type TraceShortcutMap = Record<TraceShortcutAction, TraceShortcut>;

const ACTION_ORDER: TraceShortcutAction[] = [
  "openShortcuts",
  "goToNextTrace",
  "goToPreviousTrace",
  "approve",
  "rejectAndFocusOpenCode",
  "toggleFlag",
  "saveAndGoToNext",
];

const CUSTOMIZABLE_ACTIONS: TraceShortcutAction[] = ACTION_ORDER.filter(
  (action) => action !== "openShortcuts",
);
const HANDLED_SHORTCUT_ACTIONS: TraceShortcutAction[] = ACTION_ORDER;

const EDITABLE_BLOCKED_ACTIONS = new Set<TraceShortcutAction>([
  "openShortcuts",
  "goToNextTrace",
  "goToPreviousTrace",
]);

const ACTION_LABELS: Record<TraceShortcutAction, string> = {
  openShortcuts: "Open shortcuts overview",
  goToNextTrace: "Go to next trace",
  goToPreviousTrace: "Go to previous trace",
  approve: "Approve current trace",
  rejectAndFocusOpenCode: "Reject and focus open code input",
  toggleFlag: "Flag current trace",
  saveAndGoToNext: "Save and jump to next trace",
};

const DEFAULT_TRACE_SHORTCUTS: TraceShortcutMap = {
  openShortcuts: {
    key: "?",
    ctrl: false,
    meta: false,
    shift: true,
    alt: false,
  },
  goToNextTrace: {
    key: "j",
    ctrl: false,
    meta: false,
    shift: true,
    alt: false,
  },
  goToPreviousTrace: {
    key: "k",
    ctrl: false,
    meta: false,
    shift: true,
    alt: false,
  },
  approve: {
    key: "j",
    ctrl: true,
    meta: false,
    shift: false,
    alt: false,
  },
  rejectAndFocusOpenCode: {
    key: "k",
    ctrl: true,
    meta: false,
    shift: false,
    alt: false,
  },
  toggleFlag: {
    key: "f",
    ctrl: true,
    meta: false,
    shift: false,
    alt: false,
  },
  saveAndGoToNext: {
    key: "Enter",
    ctrl: true,
    meta: false,
    shift: false,
    alt: false,
  },
};

const MODIFIER_KEYS = new Set(["Control", "Meta", "Shift", "Alt"]);

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  return Boolean(target.closest("input, textarea, [contenteditable='true']"));
}

function normalizeKey(rawKey: string): string {
  if (rawKey === " ") {
    return "Space";
  }

  if (rawKey.length === 1) {
    return rawKey.toLowerCase();
  }

  if (rawKey === "Esc") {
    return "Escape";
  }

  return rawKey;
}

function shortcutEquals(a: TraceShortcut, b: TraceShortcut): boolean {
  return (
    a.key === b.key &&
    a.ctrl === b.ctrl &&
    a.meta === b.meta &&
    a.shift === b.shift &&
    a.alt === b.alt
  );
}

function shortcutPrimaryModifierEnabled(shortcut: TraceShortcut): boolean {
  return shortcut.ctrl || shortcut.meta;
}

function shortcutSemanticallyEquals(
  a: TraceShortcut,
  b: TraceShortcut,
): boolean {
  return (
    a.key === b.key &&
    a.shift === b.shift &&
    a.alt === b.alt &&
    shortcutPrimaryModifierEnabled(a) === shortcutPrimaryModifierEnabled(b)
  );
}

function shortcutMatches(
  shortcut: TraceShortcut,
  pressedShortcut: TraceShortcut,
): boolean {
  if (shortcut.key !== pressedShortcut.key) {
    return false;
  }

  if (
    shortcut.shift !== pressedShortcut.shift ||
    shortcut.alt !== pressedShortcut.alt
  ) {
    return false;
  }

  const requiresPrimaryModifier = shortcutPrimaryModifierEnabled(shortcut);
  const pressedPrimaryModifier =
    shortcutPrimaryModifierEnabled(pressedShortcut);

  return requiresPrimaryModifier === pressedPrimaryModifier;
}

function shortcutFromKeyboardEvent(event: KeyboardEvent): TraceShortcut | null {
  if (MODIFIER_KEYS.has(event.key)) {
    return null;
  }

  return {
    key: normalizeKey(event.key),
    ctrl: event.ctrlKey,
    meta: event.metaKey,
    shift: event.shiftKey,
    alt: event.altKey,
  };
}

function shortcutFromReactKeyboardEvent(
  event: ReactKeyboardEvent<HTMLElement>,
): TraceShortcut | null {
  if (MODIFIER_KEYS.has(event.key)) {
    return null;
  }

  return {
    key: normalizeKey(event.key),
    ctrl: event.ctrlKey,
    meta: event.metaKey,
    shift: event.shiftKey,
    alt: event.altKey,
  };
}

function formatShortcut(shortcut: TraceShortcut): string {
  const parts: string[] = [];

  if (shortcutPrimaryModifierEnabled(shortcut)) {
    parts.push("Ctrl/Cmd");
  }
  if (shortcut.alt) {
    parts.push("Alt");
  }
  if (shortcut.shift) {
    parts.push("Shift");
  }

  const keyLabel =
    shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key;

  parts.push(keyLabel);
  return parts.join(" + ");
}

function getShortcutConflict(
  shortcuts: TraceShortcutMap,
  action: TraceShortcutAction,
  shortcut: TraceShortcut,
): TraceShortcutAction | undefined {
  return ACTION_ORDER.find(
    (candidate) =>
      candidate !== action &&
      shortcutSemanticallyEquals(shortcuts[candidate], shortcut),
  );
}

function cloneShortcutMap(shortcuts: TraceShortcutMap): TraceShortcutMap {
  const clone = {} as TraceShortcutMap;

  for (const action of ACTION_ORDER) {
    clone[action] = { ...shortcuts[action] };
  }

  return clone;
}

function shortcutMapEquals(a: TraceShortcutMap, b: TraceShortcutMap): boolean {
  return ACTION_ORDER.every((action) => shortcutEquals(a[action], b[action]));
}

function parseStoredShortcuts(
  rawValue: string | null,
): TraceShortcutMap | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<TraceShortcutMap>;
    const nextShortcuts = { ...DEFAULT_TRACE_SHORTCUTS };

    for (const action of ACTION_ORDER) {
      const shortcut = parsed[action];

      if (!shortcut || typeof shortcut !== "object") {
        continue;
      }

      if (
        typeof shortcut.key !== "string" ||
        typeof shortcut.ctrl !== "boolean" ||
        typeof shortcut.meta !== "boolean" ||
        typeof shortcut.shift !== "boolean" ||
        typeof shortcut.alt !== "boolean"
      ) {
        continue;
      }

      nextShortcuts[action] = {
        key: normalizeKey(shortcut.key),
        ctrl: shortcut.ctrl,
        meta: shortcut.meta,
        shift: shortcut.shift,
        alt: shortcut.alt,
      };
    }

    return nextShortcuts;
  } catch {
    return null;
  }
}

export function useTraceShortcutSettings() {
  const [shortcuts, setShortcuts] = useState<TraceShortcutMap>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_TRACE_SHORTCUTS;
    }

    return (
      parseStoredShortcuts(window.localStorage.getItem(SHORTCUT_STORAGE_KEY)) ??
      DEFAULT_TRACE_SHORTCUTS
    );
  });

  const saveShortcuts = (nextShortcuts: TraceShortcutMap) => {
    const normalized = cloneShortcutMap(nextShortcuts);
    setShortcuts(normalized);
    window.localStorage.setItem(
      SHORTCUT_STORAGE_KEY,
      JSON.stringify(normalized),
    );
  };

  const resetShortcuts = () => {
    saveShortcuts(DEFAULT_TRACE_SHORTCUTS);
  };

  return {
    shortcuts,
    saveShortcuts,
    resetShortcuts,
    defaultShortcuts: DEFAULT_TRACE_SHORTCUTS,
  };
}

export function useTraceShortcuts({
  onOpenShortcuts,
  onGoToNextTrace,
  onGoToPreviousTrace,
  onApprove,
  onRejectAndFocusOpenCode,
  onToggleFlag,
  onSaveAndGoToNext,
  shortcuts,
  disabled = false,
}: TraceShortcutsBindings) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (disabled) {
        return;
      }

      if (event.defaultPrevented) {
        return;
      }

      const isEditable = isEditableTarget(event.target);
      const pressedShortcut = shortcutFromKeyboardEvent(event);

      if (!pressedShortcut) {
        return;
      }

      for (const action of HANDLED_SHORTCUT_ACTIONS) {
        const shouldBlockInEditable = EDITABLE_BLOCKED_ACTIONS.has(action);
        if (isEditable && shouldBlockInEditable) {
          continue;
        }

        if (!shortcutMatches(shortcuts[action], pressedShortcut)) {
          continue;
        }

        event.preventDefault();
        switch (action) {
          case "openShortcuts":
            void onOpenShortcuts();
            break;
          case "goToNextTrace":
            void onGoToNextTrace();
            break;
          case "goToPreviousTrace":
            void onGoToPreviousTrace();
            break;
          case "approve":
            void onApprove();
            break;
          case "rejectAndFocusOpenCode":
            void onRejectAndFocusOpenCode();
            break;
          case "toggleFlag":
            void onToggleFlag();
            break;
          case "saveAndGoToNext":
            void onSaveAndGoToNext();
            break;
        }
        break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    disabled,
    onApprove,
    onGoToNextTrace,
    onGoToPreviousTrace,
    onOpenShortcuts,
    onRejectAndFocusOpenCode,
    onSaveAndGoToNext,
    onToggleFlag,
    shortcuts,
  ]);
}

export function TraceShortcutsDialog({
  open,
  onOpenChange,
  shortcuts,
  onSaveShortcuts,
}: TraceShortcutsDialogProps) {
  const [capturingAction, setCapturingAction] =
    useState<TraceShortcutAction | null>(null);
  const [conflictAction, setConflictAction] =
    useState<TraceShortcutAction | null>(null);
  const [draftShortcuts, setDraftShortcuts] = useState<TraceShortcutMap>(() =>
    cloneShortcutMap(shortcuts),
  );

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setDraftShortcuts(cloneShortcutMap(shortcuts));
    }

    setCapturingAction(null);
    setConflictAction(null);
    onOpenChange(nextOpen);
  };

  const rows = useMemo(
    () =>
      CUSTOMIZABLE_ACTIONS.map((action) => ({
        action,
        label: ACTION_LABELS[action],
        shortcut: draftShortcuts[action],
      })),
    [draftShortcuts],
  );

  const hasChanges = useMemo(
    () => !shortcutMapEquals(shortcuts, draftShortcuts),
    [draftShortcuts, shortcuts],
  );

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-xl" data-testid="shortcuts-dialog">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Configure your own shortcuts. Settings are saved in your browser.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3 rounded border p-2">
            <span>{ACTION_LABELS.openShortcuts}</span>
            <span className="rounded border bg-muted px-2 py-1 font-mono text-xs">
              Shift + ?
            </span>
          </div>
          {rows.map((row) => {
            const isCapturing = capturingAction === row.action;

            return (
              <div
                key={row.action}
                className="flex items-center justify-between gap-3 rounded border p-2"
              >
                <span>{row.label}</span>
                <Button
                  type="button"
                  variant={isCapturing ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setConflictAction(null);
                    setCapturingAction((prev) =>
                      prev === row.action ? null : row.action,
                    );
                  }}
                  onKeyDown={(event) => {
                    if (!isCapturing) {
                      return;
                    }

                    event.preventDefault();
                    const nextShortcut = shortcutFromReactKeyboardEvent(event);
                    if (!nextShortcut) {
                      return;
                    }

                    const conflictWith = getShortcutConflict(
                      draftShortcuts,
                      row.action,
                      nextShortcut,
                    );

                    if (conflictWith) {
                      setConflictAction(conflictWith);
                      return;
                    }

                    setDraftShortcuts((prev) => ({
                      ...prev,
                      [row.action]: nextShortcut,
                    }));
                    setConflictAction(null);
                    setCapturingAction(null);
                  }}
                >
                  {isCapturing
                    ? "Press a shortcut..."
                    : formatShortcut(row.shortcut)}
                </Button>
              </div>
            );
          })}
        </div>
        {conflictAction ? (
          <p className="text-sm text-red-600">
            This shortcut is already used by: {ACTION_LABELS[conflictAction]}.
          </p>
        ) : null}
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setCapturingAction(null);
              setConflictAction(null);
              setDraftShortcuts(cloneShortcutMap(DEFAULT_TRACE_SHORTCUTS));
            }}
          >
            <RotateCcw />
            Reset to defaults
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!hasChanges}
            onClick={() => {
              onSaveShortcuts(draftShortcuts);
              onOpenChange(false);
            }}
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
