import { cva } from "class-variance-authority";
import { SongThumbnail } from "@/features/song/components/SongThumbnail";
import { Song } from "@/features/song/entity";

export const PLAYLIST_THUMBNAIL_COLLAGE_SIZES = ["sm", "lg"] as const;
export type PlaylistThumbnailCollageSize =
  (typeof PLAYLIST_THUMBNAIL_COLLAGE_SIZES)[number];

interface Props {
  songs: Song[];
  size: PlaylistThumbnailCollageSize;
}

const COLLAGE_TILE_COUNT = 4;

const cvaPlaylistThumbnailCollage = cva(
  "grid shrink-0 grid-cols-2 grid-rows-2 overflow-hidden bg-surface-elevated",
  {
    variants: {
      size: {
        sm: "size-12 md:size-16 rounded",
        lg: "aspect-square w-full rounded-lg shadow-lg shadow-black/40",
      },
    },
  },
);

export function PlaylistThumbnailCollage({ songs, size }: Props) {
  const tiles = Array.from(
    { length: COLLAGE_TILE_COUNT },
    (_, index) => songs[index],
  );

  return (
    <div className={cvaPlaylistThumbnailCollage({ size })}>
      {tiles.map((song, index) =>
        song ? (
          <div key={song.id} className="relative">
            <SongThumbnail
              songId={song.id}
              alt={song.title}
              size={size === "sm" ? "small" : "large"}
              sizes={size === "sm" ? "8rem" : "24rem"}
            />
          </div>
        ) : (
          <div key={`empty-${index}`} className="bg-surface-elevated" />
        ),
      )}
    </div>
  );
}
