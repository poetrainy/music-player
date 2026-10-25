"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cva } from "class-variance-authority";
import { MoreVertical, Trash2 } from "lucide-react";
import { IconButton } from "@/components/IconButton";
import { usePlayer } from "@/features/player/hook";
import { deletePlaylistSong } from "@/features/playlist/api";
import { PlaylistSong } from "@/features/playlist/entity";
import { SongSummary } from "@/features/song/components/SongSummary";

interface Props {
  playlistId: string;
  playlistTitle: string;
  songs: PlaylistSong[];
}

const cvaPlaylistSongListItem = cva("flex items-center gap-3 rounded-md px-2", {
  variants: {
    isCurrentSong: {
      true: "bg-solid",
      false: "hover:bg-solid active:bg-solid",
    },
  },
});

export function PlaylistSongList({ playlistId, playlistTitle, songs }: Props) {
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

  if (!songs.length) {
    return <p className="text-muted text-sm">曲がありません。</p>;
  }

  return (
    <ul className="flex flex-col">
      {songs.map((song, index) => {
        const isCurrentSong = currentSong?.id === song.id;

        return (
          <li
            key={song.id}
            className={cvaPlaylistSongListItem({ isCurrentSong })}
          >
            <button
              type="button"
              onClick={() => play(song, playlistId, playlistTitle, songs)}
              className="group flex min-w-0 flex-1 items-center gap-3 rounded-md py-2 text-left"
            >
              <span className="text-muted w-4 shrink-0 text-right text-sm">
                {index + 1}
              </span>
              <SongSummary song={song} isActive={isCurrentSong} />
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
                className="text-muted"
              >
                <MoreVertical className="size-5" />
              </IconButton>
              {openMenuSongId === song.id && (
                <div className="bg-solid border-contrast/10 absolute right-0 z-10 mt-1 rounded-md border shadow-lg shadow-black/40">
                  <button
                    type="button"
                    onClick={() => handleDelete(song.playlistItemId)}
                    disabled={isDeleting}
                    className="disabled:text-muted flex w-full items-center gap-2 px-4 py-2 text-sm whitespace-nowrap text-red-400 active:bg-red-500/10"
                  >
                    <Trash2 className="size-4" />
                    プレイリストから削除
                  </button>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
