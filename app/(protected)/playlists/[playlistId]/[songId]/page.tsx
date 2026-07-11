import { notFound } from "next/navigation";
import { SongAutoPlay } from "@/features/player/components/SongAutoPlay";
import { getPlaylistById } from "@/features/playlist/api";
import { PlaylistDetailComponent } from "@/features/playlist/pages/PlaylistDetail";

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
    <>
      <PlaylistDetailComponent playlistId={playlistId} />
      <SongAutoPlay
        playlistId={playlistId}
        playlistTitle={playlist.title}
        song={song}
        songs={playlist.songs}
      />
    </>
  );
}
