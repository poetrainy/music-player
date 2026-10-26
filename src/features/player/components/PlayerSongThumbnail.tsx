import { cva } from "class-variance-authority";
import { SongThumbnail } from "@/features/song/components/SongThumbnail";
import { Song } from "@/features/song/entity";

export const PLAYER_SONG_THUMBNAIL_SIZES = ["small", "large"] as const;
export type PlayerSongThumbnailSize =
  (typeof PLAYER_SONG_THUMBNAIL_SIZES)[number];

const cvaPlayerSongThumbnail = cva("relative shrink-0 overflow-hidden", {
  variants: {
    size: {
      small: "size-10 rounded",
      large: "aspect-square h-full rounded-lg",
    },
  },
});

interface Props {
  song: Song;
  size: PlayerSongThumbnailSize;
}

export function PlayerSongThumbnail({ song, size }: Props) {
  return (
    <div className={cvaPlayerSongThumbnail({ size })}>
      <SongThumbnail
        key={song.id}
        thumbnailUrl={
          size === "large" ? song.thumbnailUrlLarge : song.thumbnailUrlSmall
        }
        alt={song.title}
        size={size}
      />
    </div>
  );
}
