import { cva } from "class-variance-authority";
import { Play } from "lucide-react";
import { SongThumbnail } from "@/features/song/components/SongThumbnail";
import { Song } from "@/features/song/entity";

interface Props {
  song: Pick<Song, "id" | "title" | "artist">;
  isActive: boolean;
}

const cvaSongSummaryTitle = cva("truncate text-sm font-medium", {
  variants: {
    isActive: {
      true: "text-brand",
      false: "text-foreground",
    },
  },
});

export function SongSummary({ song, isActive }: Props) {
  return (
    <>
      <div className="bg-surface-elevated relative size-12 shrink-0 overflow-hidden rounded">
        <SongThumbnail songId={song.id} alt={song.title} size="small" preload />
        <div className="absolute inset-0 hidden items-center justify-center bg-black/50 group-hover:flex">
          <Play className="size-5 fill-white text-white" />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className={cvaSongSummaryTitle({ isActive })}>{song.title}</p>
        <p className="truncate text-xs text-zinc-400">{song.artist}</p>
      </div>
    </>
  );
}
