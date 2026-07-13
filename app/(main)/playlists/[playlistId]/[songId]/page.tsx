import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SongAutoLoad } from "@/features/player/components/SongAutoLoad";
import { getPlaylistById } from "@/features/playlist/api";
import { PlaylistDetailComponent } from "@/features/playlist/pages/PlaylistDetail";

interface Props {
  params: Promise<{ playlistId: string; songId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { playlistId, songId } = await params;
  const playlist = await getPlaylistById(playlistId);
  const song = playlist?.songs.find((item) => item.id === songId);

  return { title: `♩${song?.title}` };
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
      <PlaylistDetailComponent playlist={playlist} />
      <SongAutoLoad
        playlistId={playlistId}
        playlistTitle={playlist.title}
        song={song}
        songs={playlist.songs}
      />
    </>
  );
}
