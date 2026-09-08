"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Import, Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { importTraceList } from "@/app/[projectId]/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ImportFileModalProps {
  projectId: string;
}

export default function ImportFileModal({ projectId }: ImportFileModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFile = async (file: File) => {
    setIsLoading(true);
    const toastId = toast.loading("Importing tracelist...");

    try {
      const result = await importTraceList(file, projectId);

      if (result.success && "id" in result) {
        router.push(`/${projectId}/${result.id}/traces`);
        toast.success("Imported tracelist successfully!", { id: toastId });
      } else {
        toast.error("Something went wrong!", { id: toastId });
      }
    } catch {
      toast.error("Something went wrong!", { id: toastId });
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Open menu">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => setIsOpen(true)}
              className="cursor-pointer"
            >
              <Import />
              Import
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Import Trace List</DialogTitle>
            <DialogDescription>
              Drag & drop a file here, or click to browse
            </DialogDescription>
          </DialogHeader>

          <div className="relative mx-6 my-4">
            <div
              className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
                isDragging
                  ? "border-primary bg-primary/10"
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
            >
              <Input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={onFileSelect}
                disabled={isLoading}
                accept=".json"
              />

              {isLoading ? (
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              ) : (
                <>
                  <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Click or drag-and-drop to add a new file.
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end p-6 pt-0">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
