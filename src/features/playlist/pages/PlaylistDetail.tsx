import { notFound } from "next/navigation";
import { SongList } from "@/components/SongList/SongList";
import { getPlaylistById } from "@/features/playlist/api";
import { PlaylistPlayButton } from "@/features/playlist/components/PlaylistPlayButton";
import { PlaylistThumbnailCollage } from "@/features/playlist/components/PlaylistThumbnailCollage";

interface Props {
  playlistId: string;
}

export async function PlaylistDetailComponent({ playlistId }: Props) {
  const playlist = await getPlaylistById(playlistId);

  if (!playlist) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 pb-6">
      <div className="flex flex-col items-center gap-4 px-6 pt-6 text-center">
        <div className="w-48">
          <PlaylistThumbnailCollage songs={playlist.songs} size="lg" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold text-zinc-400">プレイリスト</p>
          <h1 className="text-foreground text-2xl font-extrabold tracking-tight">
            {playlist.title}
          </h1>
          <p className="text-sm text-zinc-400">{playlist.songs.length}曲</p>
        </div>
        <PlaylistPlayButton playlistId={playlistId} songs={playlist.songs} />
      </div>
      <div className="px-4">
        <SongList playlistId={playlistId} songs={playlist.songs} />
      </div>
    </div>
  );
}
