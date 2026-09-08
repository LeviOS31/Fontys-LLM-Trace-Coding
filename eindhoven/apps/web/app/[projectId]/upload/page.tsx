"use client";

import { CloudUpload, File, LoaderIcon, TriangleAlert } from "lucide-react";
import {
  ChangeEvent,
  startTransition,
  DragEvent,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { probe, upload } from "@/app/[projectId]/upload/actions";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/state/project";
type UploadedFileType = "CSV" | "JSON";

type UploadedFile = {
  name: string;
  size: number;
  type: UploadedFileType;
};

export default function Page() {
  const project = useProjectStore((s) => s.project);
  const params = useParams();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [parserType, setParserType] = useState<
    (UploadedFileType & "OpenTelemetry") | undefined
  >(undefined);
  const [state, formAction, pending] = useActionState(upload, {
    success: false,
    error: "",
  });
  const [_, probeAction, probePending] = useActionState(probeFile, undefined);

  useEffect(() => {
    if (state?.success && state?.traceListId) {
      router.push(`/${project?.id}/${state.traceListId}/traces`);
    }
  }, [state]);

  function formatBytes(bytes: number, decimals = 2) {
    if (!Number.isFinite(bytes) || bytes === 0) return "0 Bytes";

    const k = 1000;
    const SIZE_UNITS = [
      "Bytes",
      "kB",
      "MB",
      "GB",
      "TB",
      "PB",
      "EB",
      "ZB",
      "YB",
    ] as const;

    const dm = Math.max(0, Math.floor(decimals));
    const i = Math.min(
      Math.floor(Math.log(Math.abs(bytes)) / Math.log(k)),
      SIZE_UNITS.length - 1,
    );
    const value = bytes / Math.pow(k, i);

    return `${parseFloat(value.toFixed(dm))} ${SIZE_UNITS[i]}`;
  }

  function validateSameKind(files: File[]) {
    const validFiles: File[] = [];
    const invalidFiles: File[] = [];

    if (!files || files.length === 0) {
      return {
        kind: undefined as UploadedFileType | undefined,
        validFiles,
        invalidFiles,
      };
    }

    const firstKind = files
      .map((f) => determineFileType(f.type, f.name))
      .find((k) => k !== undefined) as UploadedFileType | undefined;

    if (!firstKind) {
      return { kind: undefined, validFiles: [], invalidFiles: files.slice() };
    }

    for (const f of files) {
      const k = determineFileType(f.type, f.name);
      if (k === firstKind) validFiles.push(f);
      else invalidFiles.push(f);
    }

    return { kind: firstKind, validFiles, invalidFiles };
  }

  /**
   * Temporary function to determine file type based on the MIME and name
   */
  function determineFileType(
    mime: string,
    fileName?: string,
  ): UploadedFileType | undefined {
    if (mime) {
      switch (mime.toLowerCase()) {
        case "text/csv":
          return "CSV";
        case "application/json":
        case "text/json":
          return "JSON";
        default:
          break;
      }
    }

    if (fileName) {
      const name = fileName.toLowerCase();
      if (name.endsWith(".csv")) return "CSV";
      if (name.endsWith(".json") || name.endsWith(".jsonl")) return "JSON";
    }

    return undefined;
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    document.getElementById("file-upload-box")?.classList.add(`bg-neutral-100`);
  }

  function onDragLeave() {
    document
      .getElementById("file-upload-box")
      ?.classList.remove(`bg-neutral-100`);
  }

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    onDragLeave();
    const files = Array.from(e.dataTransfer?.files || []);
    handleFileChange(files);
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    e.preventDefault();
    const files = Array.from(e.target.files || []);
    handleFileChange(files);
  }

  function setInputFiles(input: HTMLInputElement | null, files: File[] = []) {
    if (!input) return;
    const dt = new DataTransfer();
    for (const f of files) dt.items.add(f);
    input.files = dt.files;
  }

  function handleFileChange(files: File[]) {
    const { kind, validFiles, invalidFiles } = validateSameKind(files);

    if (validFiles.length === 0 || !kind) {
      toast.warning("No recognizable/supported files");
      return;
    }

    if (invalidFiles.length > 0) {
      toast.warning(
        `Found ${invalidFiles.length.toLocaleString()} invalid file${invalidFiles.length != 1 ? "s" : ""}`,
      );
    }

    const uploaded: UploadedFile[] = validFiles.map((file) => ({
      name: file.name,
      size: file.size,
      type: kind,
    }));

    setFiles(uploaded);
    setInputFiles(inputRef.current, validFiles);
    startTransition(probeAction);
  }

  async function readPrefixBuffer(
    file: File,
    { maxBytes = 16 * 1024 } = {},
  ): Promise<Uint8Array> {
    const reader = file.stream().getReader();
    const chunks: Uint8Array[] = [];
    let read = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = new Uint8Array(value);
      chunks.push(chunk);

      read += chunk.length;

      if (read >= maxBytes) {
        const out = new Uint8Array(maxBytes);
        let offset = 0;

        for (const c of chunks) {
          const take = Math.min(c.length, maxBytes - offset);
          out.set(c.subarray(0, take), offset);
          offset += take;

          if (offset >= maxBytes) break;
        }

        reader.releaseLock?.();
        return out;
      }
    }
    const out = new Uint8Array(read);
    let off = 0;

    for (const c of chunks) {
      out.set(c, off);
      off += c.length;
    }

    return out;
  }

  async function probeFile() {
    toast.loading(`Trying to detect file type automatically...`, {
      id: "file-probe",
    });

    const fileUpload = document.getElementsByName(
      "file",
    )[0] as HTMLInputElement;

    if (
      !("files" in fileUpload) ||
      !fileUpload.files ||
      fileUpload.files.length < 1
    )
      return;

    const buffer = await readPrefixBuffer(fileUpload.files![0]);
    const result = await probe(buffer);

    if (result.error) {
      toast.error(`Failed to detect file type`, {
        id: "file-probe",
      });
      return;
    }

    const kind = result.data?.opentelemetry
      ? "OpenTelemetry"
      : result.data?.kind.toUpperCase();

    setParserType((kind as UploadedFileType & "OpenTelemetry") ?? undefined);

    toast.success(`Automatically detected file type as '${kind}'`, {
      id: "file-probe",
    });

    return result.data;
  }

  return (
    <div className="h-full w-full flex items-center justify-center">
      <form action={formAction} className="w-lg">
        <input
          type="hidden"
          id="projectId"
          name="projectId"
          value={params.projectId || ""}
        />
        <FieldGroup>
          <FieldSet>
            <FieldLegend>New file</FieldLegend>
            <FieldDescription>
              Upload a new file to start reviewing traces.
            </FieldDescription>
            <FieldGroup>
              <Field>
                <label
                  htmlFor="file"
                  id="file-upload-box"
                  className="w-full h-48 flex flex-col items-center gap-2 justify-center rounded-md border mt-2 border-dashed border-input px-6 py-12"
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                >
                  <CloudUpload className="mx-auto h-12 w-12 text-muted-foreground" />
                  <span className="text-muted-foreground text-sm">
                    Click or drag-and-drop to add a new file.
                  </span>
                  <Input
                    ref={inputRef}
                    name="file"
                    id="file"
                    data-testid="file-upload"
                    type="file"
                    accept=".csv, .json, .jsonl"
                    onChange={onInputChange}
                    hidden
                    required
                  />
                </label>
                <FieldDescription>
                  Supported file types: CSV and JSON.
                </FieldDescription>
                {files.length > 0 &&
                  files.map((file, index) => (
                    <div
                      data-testid="file-list"
                      key={index}
                      className="border w-auto p-2 flex justify-between rounded-md"
                    >
                      <div className="flex gap-2">
                        <File />
                        <p>{file.name}</p>
                        <p className="text-slate-500">({file.type})</p>
                      </div>
                      <p>{formatBytes(file.size)}</p>
                    </div>
                  ))}
              </Field>
              <Field orientation="horizontal">
                <FieldLabel>Parser/file type</FieldLabel>
                <Select
                  name="type"
                  value={parserType}
                  disabled={probePending || files.length < 1}
                  onValueChange={(value) =>
                    setParserType(value as UploadedFileType & "OpenTelemetry")
                  }
                >
                  <SelectTrigger
                    className="w-[180px]"
                    data-testid="upload-file-type"
                  >
                    <SelectValue placeholder="Parser" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="CSV">CSV</SelectItem>
                      <SelectItem value="JSON">JSON</SelectItem>
                      <SelectItem value="OpenTelemetry">
                        OpenTelemetry
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
            <FieldDescription className="flex gap-2 items-center">
              <TriangleAlert color="orange" />
              <p>
                <span className="font-semibold">AI Processing:</span> Uploaded
                data may be sent to external LLMs. Avoid sensitive info.
              </p>
            </FieldDescription>
            <FieldGroup>
              {state?.error && <FieldError>{state?.error}</FieldError>}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  onClick={() => router.push(`/${project?.id}`)}
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button
                  data-testid="file-submit"
                  type="submit"
                  disabled={files.length == 0 || pending}
                >
                  {pending && (
                    <LoaderIcon
                      data-testid="upload-pending-spinner"
                      className="spin"
                    />
                  )}
                  Process
                </Button>
              </div>
            </FieldGroup>
          </FieldSet>
        </FieldGroup>
      </form>
    </div>
  );
}
