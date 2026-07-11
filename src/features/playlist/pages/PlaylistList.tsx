import { getPlaylists } from "@/features/playlist/api";
import { PlaylistCard } from "@/features/playlist/components/PlaylistCard";

export async function PlaylistListComponent() {
  const playlists = await getPlaylists();

  return (
    <div className="flex flex-col gap-6 p-4 pt-6">
      <h1 className="text-foreground text-2xl font-extrabold tracking-tight">
        プレイリスト
      </h1>
      <div className="flex flex-col gap-1 sm:grid sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
        {playlists.map((playlist) => (
          <PlaylistCard key={playlist.id} playlist={playlist} />
        ))}
      </div>
    </div>
  );
}
