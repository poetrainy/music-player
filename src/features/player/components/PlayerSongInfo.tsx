import { cva } from "class-variance-authority";
import { Song } from "@/features/song/entity";

const cvaPlayerSongInfoTitle = cva("text-contrast text-sm font-medium", {
  variants: {
    isFullTextVisible: {
      true: "wrap-anywhere",
      false: "truncate",
    },
  },
});

const cvaPlayerSongInfoDetail = cva("text-muted text-xs", {
  variants: {
    isFullTextVisible: {
      true: "wrap-anywhere",
      false: "truncate",
    },
  },
});

interface Props {
  song: Song;
  playlistTitle: string | null;
  isFullTextVisible?: boolean;
}

export function PlayerSongInfo({
  song,
  playlistTitle,
  isFullTextVisible = false,
}: Props) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <p className={cvaPlayerSongInfoTitle({ isFullTextVisible })}>
        {song.title}
      </p>
      <p className={cvaPlayerSongInfoDetail({ isFullTextVisible })}>
        {playlistTitle ? `${song.artist}・${playlistTitle}` : song.artist}
      </p>
    </div>
  );
}
