import { SongList } from "@/components/SongList";
import { PlaylistPlayButton } from "@/features/playlist/components/PlaylistPlayButton";
import { PlaylistThumbnailCollage } from "@/features/playlist/components/PlaylistThumbnailCollage";
import { PlaylistTitleUpdate } from "@/features/playlist/components/PlaylistTitleUpdate";
import { Playlist } from "@/features/playlist/entity";

interface Props {
  playlist: Playlist;
}

export function PlaylistDetailComponent({ playlist }: Props) {
  return (
    <div className="flex flex-col gap-6 pb-6">
      <div className="flex flex-col items-center gap-4 pt-6 text-center">
        <div className="w-48">
          <PlaylistThumbnailCollage songs={playlist.songs} size="lg" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold text-zinc-400">プレイリスト</p>
          <PlaylistTitleUpdate
            playlistId={playlist.id}
            title={playlist.title}
          />
          <p className="text-sm text-zinc-400">{playlist.songs.length}曲</p>
        </div>
        <PlaylistPlayButton
          playlistId={playlist.id}
          playlistTitle={playlist.title}
          songs={playlist.songs}
        />
      </div>
      <SongList
        playlistId={playlist.id}
        playlistTitle={playlist.title}
        songs={playlist.songs}
      />
    </div>
  );
}
