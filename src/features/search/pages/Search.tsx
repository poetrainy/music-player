"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { YoutubeThumbnail } from "@/components/YoutubeThumbnail";
import { Song } from "@/entity";
import {
  deletePlaylistSong,
  registerPlaylistSong,
} from "@/features/playlist/api";
import { Playlist } from "@/features/playlist/entity";

interface Props {
  playlists: Playlist[];
  query: string;
  songs: Song[];
}

export function SearchComponent({ playlists, query, songs }: Props) {
  const router = useRouter();
  const [isSearchPending, startSearchTransition] = useTransition();
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(
    playlists[0]?.id ?? "",
  );
  const [pendingSongId, setPendingSongId] = useState<string | null>(null);
  const [playlistItemIdsBySongId, setPlaylistItemIdsBySongId] = useState<
    Record<string, string>
  >({});

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const nextQuery = String(formData.get("q") ?? "");

    startSearchTransition(() => {
      router.push(`/search?q=${encodeURIComponent(nextQuery)}`);
    });
  };

  const handleAddSong = async (songId: string) => {
    if (!selectedPlaylistId) {
      return;
    }

    setPendingSongId(songId);

    const formData = new FormData();
    formData.set("playlistId", selectedPlaylistId);
    formData.set("songId", songId);

    const playlistItemId = await registerPlaylistSong(formData);

    setPendingSongId(null);
    setPlaylistItemIdsBySongId((previous) => ({
      ...previous,
      [songId]: playlistItemId,
    }));
  };

  const handleDeleteSong = async (songId: string) => {
    const playlistItemId = playlistItemIdsBySongId[songId];

    if (!selectedPlaylistId || !playlistItemId) {
      return;
    }

    setPendingSongId(songId);

    const formData = new FormData();
    formData.set("playlistId", selectedPlaylistId);
    formData.set("playlistItemId", playlistItemId);

    await deletePlaylistSong(formData);

    setPendingSongId(null);
    setPlaylistItemIdsBySongId((previous) => {
      const next = { ...previous };

      delete next[songId];

      return next;
    });
  };

  return (
    <div className="flex flex-col gap-6 p-4 pt-6">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="曲やアーティストを検索"
          aria-label="曲やアーティストを検索"
          className="bg-surface-elevated text-foreground w-full rounded-full px-4 py-2 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={isSearchPending}
          aria-label="検索"
          className="bg-brand active:bg-brand/80 flex shrink-0 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-black"
        >
          {isSearchPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "検索"
          )}
        </button>
      </form>
      {playlists.length > 0 ? (
        <select
          value={selectedPlaylistId}
          onChange={(event) => setSelectedPlaylistId(event.target.value)}
          aria-label="プレイリストを選択"
          className="bg-surface-elevated text-foreground w-full rounded-md px-3 py-2 text-sm"
        >
          {playlists.map(({ id, title }) => (
            <option key={id} value={id}>
              {title}
            </option>
          ))}
        </select>
      ) : null}
      {songs.length === 0 ? (
        <p className="text-sm text-zinc-400">
          {query ? "検索結果がありません。" : "曲を検索してください。"}
        </p>
      ) : (
        <ul className="flex flex-col">
          {songs.map(({ id, title, artist }) => (
            <li key={id} className="flex items-center gap-3 px-2 py-2">
              <div className="bg-surface-elevated relative h-12 w-12 shrink-0 overflow-hidden rounded">
                <YoutubeThumbnail
                  videoId={id}
                  alt={title}
                  size="small"
                  preload
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="text-foreground truncate text-sm font-medium">
                  {title}
                </p>
                <p className="truncate text-xs text-zinc-400">{artist}</p>
              </div>
              {selectedPlaylistId ? (
                <button
                  type="button"
                  onClick={() =>
                    playlistItemIdsBySongId[id]
                      ? handleDeleteSong(id)
                      : handleAddSong(id)
                  }
                  disabled={pendingSongId === id}
                  aria-label={
                    playlistItemIdsBySongId[id]
                      ? "プレイリストから削除"
                      : "プレイリストに追加"
                  }
                  className="text-brand active:text-brand/70 flex h-8 w-8 shrink-0 items-center justify-center text-sm font-semibold disabled:text-zinc-500"
                >
                  {pendingSongId === id ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : playlistItemIdsBySongId[id] ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    "追加"
                  )}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
