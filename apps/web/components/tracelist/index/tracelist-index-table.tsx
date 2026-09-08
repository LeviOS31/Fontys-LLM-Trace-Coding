"use client";
import { TracelistInfo } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/tracelist/index/tracelist-index-datatable";
import { StatusIndicator } from "@/components/tracelist/index/status-indicator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { EllipsisVertical, InfoIcon } from "lucide-react";
import RenameTracelistDialog from "@/components/tracelist/index/rename-tracelist-dialog";
import DeleteTracelistDialog from "@/components/tracelist/index/delete-tracelist-dialog";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function TracelistIndexTable({
  filteredTracelists,
}: {
  filteredTracelists: TracelistInfo[];
}) {
  const columns: ColumnDef<TracelistInfo>[] = [
    {
      accessorKey: "name",
      header: "Name",
      size: 200,
      cell: ({ row }) => {
        return (
          <p className="truncate">
            {row.original.name === "" ? "Untitled" : row.original.name}
          </p>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant="ghost"
        >
          Date
        </Button>
      ),
      size: 180,
      cell: ({ row }) =>
        row.original.createdAt.toLocaleDateString() +
        " " +
        row.original.createdAt.toLocaleTimeString(),
    },
    {
      accessorKey: "status",
      header: "Status",
      size: 120,
      cell: ({ row }) => <StatusIndicator list={row.original} />,
    },
    {
      accessorKey: "statusNumeric",
      header: () => (
        <div className={"flex flex-row gap-2 items-center"}>
          <p>Positive</p>
          <div className="w-px h-4 bg-border" />
          <p>Negative</p>
          <div className="w-px h-4 bg-border" />
          <p>Pending</p>
        </div>
      ),
      size: 50,
      cell: ({ row }) => (
        <div className="w-20 grid grid-cols-3 gap-17 px-4">
          <Badge variant={"default"} className={"bg-green-300 text-foreground"}>
            {row.original.status.positive}
          </Badge>
          <Badge variant={"default"} className={"bg-red-300 text-foreground"}>
            {row.original.status.negative}
          </Badge>
          <Badge
            variant={"default"}
            className={"bg-neutral-300 text-foreground"}
          >
            {row.original.status.pending}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "axial",
      header: "Has axial codes",
      cell: ({ row }) => {
        return row.original.axialCodes.length > 0 ? (
          <Tooltip>
            <TooltipTrigger className={"flex flex-row gap-1 items-center"}>
              Yes <InfoIcon size={12} />
            </TooltipTrigger>
            <TooltipContent>
              {row.original.axialCodes
                .toSorted((a) => a.traceAmount)
                .map((a, i) => (
                  <div key={i} className={"flex"}>
                    <p className={"w-5"}>{a.traceAmount}x</p>
                    <p>{a.name}</p>
                  </div>
                ))}
            </TooltipContent>
          </Tooltip>
        ) : (
          <p className={"text-muted-foreground"}>No</p>
        );
      },
    },
    {
      accessorKey: "actions",
      header: () => <p className={"text-right"}>Actions</p>,
      size: 64,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" type="button">
                <EllipsisVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="grid grid-cols-1">
              <RenameTracelistDialog traceList={row.original} />
              <DeleteTracelistDialog traceList={row.original} />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return <DataTable columns={columns} data={filteredTracelists} />;
}
