import { PlayerPlaybackRestore } from "@/features/player/components/PlayerPlaybackRestore";
import { getPlaylists } from "@/features/playlist/api";
import { PlaylistListComponent } from "@/features/playlist/pages/PlaylistList";

export default async function Page() {
  const playlists = await getPlaylists();

  return (
    <>
      <PlaylistListComponent playlists={playlists} />
      <PlayerPlaybackRestore />
    </>
  );
}
