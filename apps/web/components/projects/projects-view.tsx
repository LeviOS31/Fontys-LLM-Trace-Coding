"use client";

import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { type MouseEvent, useEffect, useState } from "react";
import {
  Ellipsis,
  FolderOpen,
  LayoutGrid,
  Pencil,
  Plus,
  Settings2,
  Table2,
  Trash2,
  TriangleAlertIcon,
} from "lucide-react";

import {
  addProject,
  deleteProject,
  updateProject,
} from "@/app/[projectId]/actions";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HeaderActions } from "@/components/header-actions";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Project } from "@/lib/types";

function NewProjectDialog({
  onAdd,
  trigger,
}: {
  onAdd: (project: Project) => void;
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [project, setProject] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  async function handleAdd() {
    if (!project.name.trim()) return;
    setCreateError("");
    setLoading(true);
    try {
      const data = await addProject({
        ...project,
      });

      if (!data || !("id" in data)) return;

      onAdd(data as Project);
      setProject({ name: "", description: "" } as Project);
      setOpen(false);

      requestAnimationFrame(() => {
        toast.success("Created the project", {
          action: {
            label: "Upload file",
            onClick: () => router.push(`${data.id}/upload`),
          },
        });
      });
    } catch {
      requestAnimationFrame(() => {
        toast.error("Failed to create project. Please try again.");
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setCreateError("");
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button data-testid="new-project-button">
            <Plus />
            New project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent data-testid="create-project-dialog">
        <DialogHeader>
          <DialogTitle>Create new project</DialogTitle>
        </DialogHeader>
        <FieldGroup>
          <FieldSet>
            <FieldLegend className="sr-only">Project details</FieldLegend>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="project-name">Name</FieldLabel>
                <Input
                  id="project-name"
                  placeholder="Project name"
                  value={project.name}
                  onChange={(e) =>
                    setProject({ ...project, name: e.target.value })
                  }
                  data-testid="project-name-input"
                />
                {createError && (
                  <p
                    className="text-sm text-destructive"
                    data-testid="project-form-error"
                  >
                    {createError}
                  </p>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="project-desc">Description</FieldLabel>
                <Input
                  id="project-desc"
                  placeholder="Short description (optional)"
                  value={project.description}
                  onChange={(e) =>
                    setProject({ ...project, description: e.target.value })
                  }
                  data-testid="project-desc-input"
                />
                <FieldDescription>
                  A short description of the project.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldSet>
        </FieldGroup>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={!project.name.trim() || loading}
            data-testid="create-project-button"
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditProjectDialog({
  project,
  open,
  onOpenChange,
  onUpdate,
}: {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, values: Pick<Project, "name" | "description">) => void;
}) {
  const [form, setForm] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    if (!project) return;
    const updateState = (project: Pick<Project, "name" | "description">) => {
      setForm({ ...project });
      setEditError("");
    };
    updateState({
      name: project.name,
      description: project.description ?? "",
    });
  }, [project, open]);

  async function handleUpdate() {
    if (!project || !form.name.trim()) return;
    setEditError("");
    setLoading(true);

    try {
      const data = await updateProject({
        id: project.id,
        name: form.name,
        description: form.description,
      });

      if (!data || !("id" in data)) return;

      onUpdate(project.id, {
        name: data.name,
        description: data.description,
      });
      onOpenChange(false);
      toast.success("Project updated.");
    } catch {
      toast.error("Failed to update project. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) setEditError("");
      }}
    >
      <DialogContent data-testid="edit-project-dialog">
        <DialogHeader>
          <DialogTitle>Edit project</DialogTitle>
        </DialogHeader>
        <FieldGroup>
          <FieldSet>
            <FieldLegend className="sr-only">Project details</FieldLegend>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="edit-project-name">Name</FieldLabel>
                <Input
                  id="edit-project-name"
                  placeholder="Project name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  data-testid="project-name-input"
                />
                {editError && (
                  <p
                    className="text-sm text-destructive"
                    data-testid="project-form-error"
                  >
                    {editError}
                  </p>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="edit-project-desc">Description</FieldLabel>
                <Input
                  id="edit-project-desc"
                  placeholder="Short description (optional)"
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  data-testid="project-desc-input"
                />
              </Field>
            </FieldGroup>
          </FieldSet>
        </FieldGroup>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={!form.name.trim() || loading}
            data-testid="save-project-button"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteProjectDialog({
  project,
  open,
  onOpenChange,
  onConfirm,
}: {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: string) => void | Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!project) return;
    setLoading(true);
    try {
      await onConfirm(project.id);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="delete-project-dialog">
        <DialogHeader>
          <DialogTitle>Delete project</DialogTitle>
          <DialogDescription>
            {project
              ? `"${project.name}" will be gone forever. This cannot be undone!`
              : "This project will be gone forever. This cannot be undone!"}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
            data-testid="confirm-delete-project-button"
          >
            <TriangleAlertIcon />
            Yes, delete it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ProjectsView({
  initialProjects,
}: {
  initialProjects: Project[];
}) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [gridColumns, setGridColumns] = useState(3);
  const [view, setView] = useState("grid");
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  function handleAdd(project: Project) {
    setProjects((prev) => [project, ...prev]);
  }

  function handleEditStart(project: Project, e: MouseEvent<HTMLElement>) {
    e.preventDefault();
    e.stopPropagation();
    setEditingProject(project);
    setIsEditDialogOpen(true);
  }

  function handleDeleteStart(project: Project, e: MouseEvent<HTMLElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDeletingProject(project);
    setIsDeleteDialogOpen(true);
  }

  function handleUpdate(
    id: string,
    values: Pick<Project, "name" | "description">,
  ) {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === id ? { ...project, ...values } : project,
      ),
    );
  }

  async function handleDelete(id: string) {
    try {
      const error = await deleteProject({ id });
      if (error) throw error;
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert("Failed to delete project. Please try again.");
    }
  }

  return (
    <div className="h-full w-full flex flex-col">
      <HeaderActions>
        {projects.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings2 />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56">
              <p className="text-sm font-medium mb-2">View</p>
              <Tabs value={view} onValueChange={setView}>
                <TabsList className="w-full">
                  <TabsTrigger value="grid" className="flex-1">
                    <LayoutGrid />
                    Grid
                  </TabsTrigger>
                  <TabsTrigger value="list" className="flex-1">
                    <Table2 />
                    List
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="grid" className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Columns
                    </span>
                    <span className="text-sm tabular-nums font-medium">
                      {gridColumns}
                    </span>
                  </div>
                  <Slider
                    min={1}
                    max={5}
                    step={1}
                    value={[gridColumns]}
                    onValueChange={([val]) => setGridColumns(val)}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1</span>
                    <span>5</span>
                  </div>
                </TabsContent>
                <TabsContent value="list" />
              </Tabs>
            </PopoverContent>
          </Popover>
        )}
        <NewProjectDialog onAdd={handleAdd} />
        <EditProjectDialog
          project={editingProject}
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) setEditingProject(null);
          }}
          onUpdate={handleUpdate}
        />
        <DeleteProjectDialog
          project={deletingProject}
          open={isDeleteDialogOpen}
          onOpenChange={(open) => {
            setIsDeleteDialogOpen(open);
            if (!open) setDeletingProject(null);
          }}
          onConfirm={handleDelete}
        />
      </HeaderActions>

      <div className="flex-1 overflow-auto">
        {projects.length === 0 ? (
          <Empty className="border h-full">
            <EmptyContent>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FolderOpen />
                </EmptyMedia>
                <EmptyTitle>No projects</EmptyTitle>
                <EmptyDescription>
                  You don&apos;t have any projects yet. Click &ldquo;New
                  project&rdquo; to get started.
                </EmptyDescription>
              </EmptyHeader>
              <NewProjectDialog
                onAdd={handleAdd}
                trigger={
                  <Button variant="outline">
                    <Plus />
                    New project
                  </Button>
                }
              />
            </EmptyContent>
          </Empty>
        ) : view === "grid" ? (
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
            }}
          >
            {projects.map((project) => (
              <Link href={`/${project.id}`} key={project.id}>
                <Card
                  data-testid="project-card"
                  className="hover:shadow-md transition-shadow cursor-pointer"
                >
                  <CardHeader>
                    <CardTitle className={"h-6 truncate"} data-testid="project-name">
                      {project.name}
                    </CardTitle>
                      <CardDescription className={"h-10"} data-testid="project-description">
                        {project.description}
                      </CardDescription>
                    <CardAction>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            data-testid="project-ellipsis"
                          >
                            <Ellipsis />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => handleEditStart(project, e)}
                            data-testid="project-edit"
                          >
                            <Pencil />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={(e) => handleDeleteStart(project, e)}
                            data-testid="project-delete"
                          >
                            <Trash2 />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-xs">
                      Created{" "}
                      {new Date(project.createdAt).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="divide-y rounded-md border overflow-hidden">
            {projects.map((project) => (
              <Link
                href={`/${project.id}`}
                key={project.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{project.name}</p>
                  {project.description && (
                    <p className="text-sm text-muted-foreground truncate">
                      {project.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <p className="text-xs text-muted-foreground">
                    {new Date(project.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-7">
                        <Ellipsis />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => handleEditStart(project, e)}
                        data-testid="project-edit"
                      >
                        <Pencil />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={(e) => handleDeleteStart(project, e)}
                        data-testid="project-delete"
                      >
                        <Trash2 />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
