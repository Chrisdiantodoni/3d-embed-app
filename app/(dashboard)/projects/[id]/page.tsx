// app/project/[id]/page.tsx
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import ProjectEditorClient from "./project-editor-client";
import { getProjectById } from "@/app/api/projects/[id]/route";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;

  const projectData = await getProjectById(id);

  if (!projectData) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-destructive font-medium">
          Project not found or failed to load.
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-zinc-950">
      <Suspense
        fallback={
          <div className="h-full w-full flex items-center justify-center">
            <Loader2 className="animate-spin text-primary" />
          </div>
        }
      >
        <ProjectEditorClient data={projectData} />
      </Suspense>
    </div>
  );
}
