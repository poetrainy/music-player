import { PlaylistCard } from "@/features/playlist/components/PlaylistCard";
import { Playlist } from "@/features/playlist/entity";

interface Props {
  playlists: Playlist[];
}

export function PlaylistListComponent({ playlists }: Props) {
  return (
    <div className="flex flex-col gap-6">
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
