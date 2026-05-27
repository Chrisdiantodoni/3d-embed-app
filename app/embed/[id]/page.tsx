import { headers } from "next/headers";
import { getProjectById } from "@/app/api/projects/[id]/route";
import {
  getSourceOriginFromHeaders,
  isAllowedDomain,
  verifyEmbedToken,
} from "@/lib/embed-auth";
import { listProjectEmbedDomains } from "@/lib/project-embed-domains";
import EmbedSceneClient from "./embed-scene-client";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function EmbedProjectPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const { token } = await searchParams;
  const requestHeaders = await headers();
  const sourceOrigin = getSourceOriginFromHeaders(requestHeaders);

  if (!token) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 px-6 text-center text-sm text-zinc-400">
        Missing embed token.
      </div>
    );
  }

  const verifiedToken = verifyEmbedToken(token);

  if (!verifiedToken.ok || verifiedToken.payload.projectId !== id) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 px-6 text-center text-sm text-zinc-400">
        Invalid or expired embed token.
      </div>
    );
  }

  const savedDomains = await listProjectEmbedDomains(id);
  const savedOrigins = savedDomains.map((item) => item.domain);

  if (sourceOrigin && !isAllowedDomain(sourceOrigin, savedOrigins)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 px-6 text-center text-sm text-zinc-400">
        This embed is not allowed on this domain.
      </div>
    );
  }

  const projectData = await getProjectById(id);

  if (!projectData) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-sm text-zinc-400">
        Project not found.
      </div>
    );
  }

  const normalizedProject = {
    projectId: id,
    token,
    settings: projectData.settings,
    sceneAssets: projectData.sceneAssets
      .filter(
        (
          asset,
        ): asset is typeof asset & {
          id: string;
          name: string;
          url: string;
        } => Boolean(asset.id && asset.name && asset.url),
      )
      .map((asset) => ({
        id: asset.id,
        name: asset.name,
        url: asset.url,
        transform: asset.transform,
      })),
  };

  return <EmbedSceneClient data={normalizedProject} />;
}
