import { PlaylistDetailComponent } from "@/features/playlist/pages/PlaylistDetail";

interface Props {
  params: Promise<{ playlistId: string }>;
}

export default async function Page({ params }: Props) {
  const { playlistId } = await params;

  return <PlaylistDetailComponent playlistId={playlistId} />;
}
