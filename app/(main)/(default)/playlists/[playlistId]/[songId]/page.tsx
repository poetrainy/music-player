import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlayerSongAutoLoad } from "@/features/player/components/PlayerSongAutoLoad";
import { getPlaylistById } from "@/features/playlist/api";
import { PlaylistDetailComponent } from "@/features/playlist/pages/PlaylistDetail";

interface Props {
  params: Promise<{ playlistId: string; songId: string }>;
}

const getPlaylistSong = async (playlistId: string, songId: string) => {
  const playlist = await getPlaylistById(playlistId);
  const song = playlist?.songs.find((item) => item.id === songId);

  return { playlist, song };
};

export const generateMetadata = async ({
  params,
}: Props): Promise<Metadata> => {
  const { playlistId, songId } = await params;
  const { song } = await getPlaylistSong(playlistId, songId);

  return { title: song ? `♩${song.title}` : undefined };
};

export default async function Page({ params }: Props) {
  const { playlistId, songId } = await params;
  const { playlist, song } = await getPlaylistSong(playlistId, songId);

  if (!playlist) {
    notFound();
  }

  if (!song) {
    notFound();
  }

  return (
    <>
      <PlaylistDetailComponent playlist={playlist} />
      <PlayerSongAutoLoad
        playlistId={playlistId}
        playlistTitle={playlist.title}
        song={song}
        songs={playlist.songs}
      />
    </>
  );
}
