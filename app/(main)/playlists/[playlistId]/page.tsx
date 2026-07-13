import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPlaylistById } from "@/features/playlist/api";
import { PlaylistDetailComponent } from "@/features/playlist/pages/PlaylistDetail";

interface Props {
  params: Promise<{ playlistId: string }>;
}

export const generateMetadata = async ({
  params,
}: Props): Promise<Metadata> => {
  const { playlistId } = await params;
  const playlist = await getPlaylistById(playlistId);

  return { title: playlist?.title };
};

export default async function Page({ params }: Props) {
  const { playlistId } = await params;
  const playlist = await getPlaylistById(playlistId);

  if (!playlist) {
    notFound();
  }

  return <PlaylistDetailComponent playlist={playlist} />;
}
