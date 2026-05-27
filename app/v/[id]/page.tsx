import { redirect } from "next/navigation";
import { getProjectActiveEmbedToken } from "@/lib/project-embed-access";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ShortEmbedPage({ params }: Props) {
  const { id } = await params;
  const token = await getProjectActiveEmbedToken(id);

  if (!token) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 px-6 text-center text-sm text-zinc-400">
        This project has no active embed token.
      </div>
    );
  }

  redirect(`/embed/${id}?token=${encodeURIComponent(token)}`);
}
