import { notFound } from "next/navigation";
import { DrawerHeaderActions } from "@/features/player/components/DrawerHeaderActions";
import { SongDrawer } from "@/features/player/components/SongDrawer";
import { SongDetailComponent } from "@/features/player/pages/SongDetail";
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
      <SongDrawer>
        <SongDetailComponent
          headerEndActions={<DrawerHeaderActions />}
          playlistId={playlistId}
          playlistTitle={playlist.title}
          song={song}
          songs={playlist.songs}
        />
      </SongDrawer>
    </>
  );
}
