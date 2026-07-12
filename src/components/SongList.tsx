"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MoreVertical, Trash2 } from "lucide-react";
import { IconButton } from "@/components/IconButton";
import { YoutubeThumbnail } from "@/components/YoutubeThumbnail";
import { usePlayer } from "@/features/player/hook";
import { deletePlaylistSong } from "@/features/playlist/api";
import { PlaylistSong } from "@/features/playlist/entity";

interface Props {
  playlistId: string;
  playlistTitle: string;
  songs: PlaylistSong[];
}

export function SongList({ playlistId, playlistTitle, songs }: Props) {
  const { currentSong, play } = usePlayer();
  const router = useRouter();
  const [openMenuSongId, setOpenMenuSongId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (playlistItemId: string) => {
    setIsDeleting(true);

    const formData = new FormData();
    formData.set("playlistId", playlistId);
    formData.set("playlistItemId", playlistItemId);

    await deletePlaylistSong(formData);

    setIsDeleting(false);
    setOpenMenuSongId(null);
    router.refresh();
  };

  if (songs.length === 0) {
    return <p className="text-sm text-zinc-400">曲がありません。</p>;
  }

  return (
    <ul className="flex flex-col">
      {songs.map((song, index) => {
        const isCurrentSong = currentSong?.id === song.id;

        return (
          <li
            key={song.id}
            className={`flex items-center gap-3 rounded-md px-2 ${isCurrentSong ? "bg-surface-elevated" : "hover:bg-surface-elevated active:bg-surface-elevated"}`}
          >
            <button
              type="button"
              onClick={() => play(song, playlistId, playlistTitle, songs)}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-md py-2 text-left"
            >
              <span className="w-4 shrink-0 text-right text-sm text-zinc-500">
                {index + 1}
              </span>
              <div className="bg-surface-elevated relative h-12 w-12 shrink-0 overflow-hidden rounded">
                <YoutubeThumbnail
                  videoId={song.id}
                  alt={song.title}
                  fill
                  sizes="3rem"
                  quality={90}
                  className="scale-125 object-cover"
                />
              </div>
              <div className="flex min-w-0 flex-col">
                <p
                  className={`truncate text-sm font-medium ${isCurrentSong ? "text-brand" : "text-foreground"}`}
                >
                  {song.title}
                </p>
                <p className="truncate text-xs text-zinc-400">{song.artist}</p>
              </div>
            </button>
            <div className="relative shrink-0">
              <IconButton
                type="button"
                onClick={() =>
                  setOpenMenuSongId((previous) =>
                    previous === song.id ? null : song.id,
                  )
                }
                aria-label="オプション"
                className="text-zinc-400"
              >
                <MoreVertical className="h-5 w-5" />
              </IconButton>
              {openMenuSongId === song.id ? (
                <div className="bg-surface-elevated absolute right-0 z-10 mt-1 rounded-md border border-white/10 shadow-lg shadow-black/40">
                  <button
                    type="button"
                    onClick={() => handleDelete(song.playlistItemId)}
                    disabled={isDeleting}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm whitespace-nowrap text-red-400 active:bg-red-500/10 disabled:text-zinc-500"
                  >
                    <Trash2 className="h-4 w-4" />
                    プレイリストから削除
                  </button>
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
