import { cva } from "class-variance-authority";
import { SongThumbnail } from "@/features/song/components/SongThumbnail";
import { Song } from "@/features/song/entity";

export const PLAYLIST_THUMBNAIL_COLLAGE_SIZES = ["small", "large"] as const;
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
        small: "size-12 md:size-16 rounded",
        large: "aspect-square w-full rounded-lg shadow-lg shadow-black/40",
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
              thumbnailUrl={
                size === "small" ? song.thumbnailUrlSmall : song.thumbnailUrlLarge
              }
              alt={song.title}
              size={size}
              sizes={size === "small" ? "8rem" : "28rem"}
            />
          </div>
        ) : (
          <div key={`empty-${index}`} className="bg-surface-elevated" />
        ),
      )}
    </div>
  );
}
