import { notFound } from "next/navigation";
import { SongDetailComponent } from "@/features/player/pages/SongDetail";
import { getPlaylistById } from "@/features/playlist/api";

interface Props {
  params: Promise<{ playlistId: string; songId: string }>;
}

export default async function Page({ params }: Props) {
  const { playlistId, songId } = await params;
  const playlist = await getPlaylistById(playlistId);

  if (!playlist) {
    notFound();
  }

  const song = playlist.songs.find((item) => item.id === songId);

  if (!song) {
    notFound();
  }

  return (
    <SongDetailComponent
      headerEndActions={null}
      playlistId={playlistId}
      playlistTitle={playlist.title}
      song={song}
      songs={playlist.songs}
    />
  );
}
