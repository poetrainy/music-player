import { cva } from "class-variance-authority";
import { Song } from "@/features/song/entity";

const cvaPlayerSongInfoTitle = cva("text-contrast text-sm font-medium", {
  variants: {
    variant: {
      "control-bar": "truncate",
      widget: "line-clamp-2 wrap-anywhere",
    },
  },
});

const cvaPlayerSongInfoDetail = cva("text-muted text-xs", {
  variants: {
    variant: {
      "control-bar": "truncate",
      widget: "line-clamp-2 wrap-anywhere",
    },
  },
});

type PlayerSongInfoVariant = "control-bar" | "widget";

interface Props {
  song: Song;
  playlistTitle: string | null;
  variant: PlayerSongInfoVariant;
}

export function PlayerSongInfo({ song, playlistTitle, variant }: Props) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <p className={cvaPlayerSongInfoTitle({ variant })}>{song.title}</p>
      <p className={cvaPlayerSongInfoDetail({ variant })}>
        {playlistTitle ? `${song.artist}・${playlistTitle}` : song.artist}
      </p>
    </div>
  );
}
