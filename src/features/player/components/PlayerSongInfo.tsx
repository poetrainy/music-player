import { Song } from "@/features/song/entity";

interface Props {
  song: Song;
  playlistTitle: string | null;
}

export function PlayerSongInfo({ song, playlistTitle }: Props) {
  return (
    <div className="flex min-w-0 flex-col">
      <p className="text-contrast truncate text-sm font-medium">{song.title}</p>
      <p className="text-muted truncate text-xs">
        {playlistTitle ? `${song.artist}・${playlistTitle}` : song.artist}
      </p>
    </div>
  );
}
