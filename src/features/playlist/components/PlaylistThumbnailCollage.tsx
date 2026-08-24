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

const getThumbnailUrl = (
  song: Song,
  size: PlaylistThumbnailCollageSize,
): string =>
  size === "small" ? song.thumbnailUrlSmall : song.thumbnailUrlLarge;

// NOTE: 同じサムネイル画像が複数タイルに並ぶと見た目が崩れるため、
// 画像URLが重複する曲はスキップして次の曲から探す
const selectDistinctThumbnailSongs = (
  songs: Song[],
  size: PlaylistThumbnailCollageSize,
): Song[] => {
  const usedThumbnailUrls = new Set<string>();
  const distinctSongs: Song[] = [];

  for (const song of songs) {
    if (distinctSongs.length === COLLAGE_TILE_COUNT) {
      break;
    }

    const thumbnailUrl = getThumbnailUrl(song, size);

    if (usedThumbnailUrls.has(thumbnailUrl)) {
      continue;
    }

    usedThumbnailUrls.add(thumbnailUrl);
    distinctSongs.push(song);
  }

  return distinctSongs;
};

export function PlaylistThumbnailCollage({ songs, size }: Props) {
  const distinctSongs = selectDistinctThumbnailSongs(songs, size);
  const tiles = Array.from(
    { length: COLLAGE_TILE_COUNT },
    (_, index) => distinctSongs[index],
  );

  return (
    <div className={cvaPlaylistThumbnailCollage({ size })}>
      {tiles.map((song, index) =>
        song ? (
          <div key={song.id} className="relative">
            <SongThumbnail
              thumbnailUrl={getThumbnailUrl(song, size)}
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
