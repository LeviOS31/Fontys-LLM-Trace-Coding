"use client";
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";

import TraceIcon from "./trace-icon";
import { Trace } from "@/lib/types";
import { toggleMinimized } from "./actions";
import { useSidebar } from "@/components/ui/sidebar";

type TreeViewProps = {
  trace: Trace;
  selectedTrace: string;
  onTraceSelect?: (traceId: string) => void;
  collapsed: string[];
  setCollapsed: React.Dispatch<React.SetStateAction<string[]>>;
};

type TraceNodeProps = TreeViewProps & {
  isParent?: boolean;
};

function hasSelectedDescendant(trace: Trace, selectedTrace?: string): boolean {
  if (!selectedTrace || !trace.traces?.length) {
    return false;
  }

  return trace.traces.some((childTrace) => {
    if (childTrace.id === selectedTrace) {
      return true;
    }

    return hasSelectedDescendant(childTrace, selectedTrace);
  });
}

function TraceNode({
  trace,
  selectedTrace,
  onTraceSelect,
  isParent = false,
  collapsed,
  setCollapsed,
}: TraceNodeProps) {
  const hasChildren = Boolean(trace.traces?.length);
  const isSelected = selectedTrace === trace.id;
  const containerRef = useRef<HTMLDivElement>(null);
  const [lineHeight, setLineHeight] = useState("100%");
  const containsSelectedDescendant = useMemo(
    () => hasSelectedDescendant(trace, selectedTrace),
    [trace, selectedTrace],
  );

  const isOpen = !collapsed.includes(trace.id);

  const setIsOpen = (open: boolean) => {
    setCollapsed((prev) =>
      open ? prev.filter((id) => id !== trace.id) : [...prev, trace.id],
    );
  };

  const shouldHighlightNode =
    isSelected || (!isOpen && containsSelectedDescendant);

  useLayoutEffect(() => {
    const measureLineHeight = () => {
      const parentElement = containerRef.current?.parentElement;
      const currentElement = containerRef.current;

      if (!parentElement || !currentElement) {
        return;
      }

      const extraHeight = 31;
      const parentTop = parentElement.getBoundingClientRect().top;
      const currentTop = currentElement.getBoundingClientRect().top;

      setLineHeight(`${currentTop - parentTop + extraHeight}px`);
    };

    measureLineHeight();

    const parentElement = containerRef.current?.parentElement;

    if (!parentElement) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      measureLineHeight();
    });

    resizeObserver.observe(parentElement);
    window.addEventListener("resize", measureLineHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measureLineHeight);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative flex gap-1">
      {!isParent && (
        <div
          style={{ height: lineHeight }}
          className="absolute -left-2 bottom-[calc(100%-1.1rem)] w-3.5 border-l border-b rounded-bl-lg"
        />
      )}

      <div className="flex flex-1 flex-col gap-2">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <Item
            variant="default"
            size="sm"
            className={cn(
              shouldHighlightNode
                ? "cursor-default bg-muted"
                : "cursor-pointer transition-colors hover:bg-muted",
              "min-w-0 gap-2 p-1 text-xs pr-2",
            )}
            onClick={onTraceSelect ? () => onTraceSelect(trace.id) : undefined}
          >
            <ItemMedia
              variant="icon"
              className="size-6 rounded-sm relative z-10"
            >
              <TraceIcon name={trace.name} className="size-3.5" />
            </ItemMedia>

            <ItemContent className="min-w-0 gap-0.5">
              <ItemTitle className="line-clamp-1 overflow-hidden break-all text-ellipsis text-xs font-medium">
                {trace.name || "Untitled Trace"}
              </ItemTitle>
            </ItemContent>

            {hasChildren && (
              <ItemActions className="ml-auto">
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="group shrink-0 text-muted-foreground"
                    aria-label="Toggle trace children"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <ChevronRight className="size-3.5 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                  </Button>
                </CollapsibleTrigger>
              </ItemActions>
            )}
          </Item>

          {hasChildren && (
            <CollapsibleContent className="CollapsibleContent">
              <div className="pl-6 pt-2 flex flex-col gap-1.5">
                {trace.traces?.map((childTrace) => (
                  <TraceNode
                    key={childTrace.id}
                    trace={childTrace}
                    selectedTrace={selectedTrace}
                    onTraceSelect={onTraceSelect}
                    collapsed={collapsed}
                    setCollapsed={setCollapsed}
                  />
                ))}
              </div>
            </CollapsibleContent>
          )}
        </Collapsible>
      </div>
    </div>
  );
}

export default function TraceTreeView({
  trace,
  selectedTrace,
  onTraceSelect,
  collapsed,
  setCollapsed,
  minimized: iMinimized,
}: TreeViewProps & {
  minimized: boolean;
}) {
  const [minimized, setMinimized] = useState(iMinimized);
  const sidebar = useSidebar();

  useEffect(() => {
    toggleMinimized(minimized);

    if (!minimized) {
      sidebar.setOpen(false);
    }
  }, [minimized]);

  return (
    <>
      <div
        className="relative z-0 border-t border-r -mb-4 -ml-4 -mr-2 bg-neutral-5 h-[calc(100%+2rem)] transition-all duration-300 rounded-tr-md overflow-hidden"
        style={{
          width: minimized ? 0 : 280,
          borderColor: minimized ? "transparent" : undefined,
          marginRight: minimized ? -8 : undefined,
        }}
      >
        <div className="p-2 w-full h-full flex flex-col gap-4">
          <h2
            className="text-nowrap text-lg font-bold transition-opacity duration-300"
            style={{
              opacity: minimized ? 0 : 1,
            }}
          >
            Tree view
          </h2>

          <div
            className="overflow-y-auto transition-opacity duration-300"
            style={{ opacity: minimized ? 0 : 1 }}
          >
            <TraceNode
              trace={trace}
              selectedTrace={selectedTrace}
              onTraceSelect={onTraceSelect}
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              isParent
            />
          </div>
        </div>
      </div>
      <Button
        variant="outline"
        size="icon-sm"
        className="absolute bottom-0 left-0"
        onClick={() => setMinimized(!minimized)}
      >
        <ChevronLeft
          className={`transition-transform ${minimized ? "rotate-180" : ""}`}
        />
      </Button>
    </>
  );
}
