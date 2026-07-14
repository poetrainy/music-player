"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { cva } from "class-variance-authority";
import { Check, Loader2 } from "lucide-react";
import { usePlayer } from "@/features/player/hook";
import {
  deletePlaylistSong,
  registerPlaylistSong,
} from "@/features/playlist/api";
import { Playlist } from "@/features/playlist/entity";
import { SongSummary } from "@/features/song/components/SongSummary";
import { Song } from "@/features/song/entity";

interface Props {
  playlists: Playlist[];
  query: string;
  songs: Song[];
}

const cvaSearchComponentSongListItem = cva(
  "flex items-center gap-3 rounded-md p-2",
  {
    variants: {
      isActive: {
        true: "bg-surface-elevated",
        false: "hover:bg-surface-elevated active:bg-surface-elevated",
      },
    },
  },
);

export function SearchComponent({ playlists, query, songs }: Props) {
  const { currentSong, play } = usePlayer();
  const router = useRouter();
  const [isSearchPending, startSearchTransition] = useTransition();
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(
    playlists[0]?.id ?? "",
  );
  const [pendingSongId, setPendingSongId] = useState<string | null>(null);
  const [sessionPlaylistItemIdsBySongId, setSessionPlaylistItemIdsBySongId] =
    useState<Record<string, string | null>>({});

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
    setSessionPlaylistItemIdsBySongId((previous) => ({
      ...previous,
      [songId]: playlistItemId,
    }));
  };

  const handleDeleteSong = async (songId: string) => {
    const playlistItemId = getPlaylistItemId(songId);

    if (!selectedPlaylistId || !playlistItemId) {
      return;
    }

    setPendingSongId(songId);

    const formData = new FormData();
    formData.set("playlistId", selectedPlaylistId);
    formData.set("playlistItemId", playlistItemId);

    await deletePlaylistSong(formData);

    setPendingSongId(null);
    setSessionPlaylistItemIdsBySongId((previous) => ({
      ...previous,
      [songId]: null,
    }));
  };

  const selectedPlaylist = playlists.find(
    (playlist) => playlist.id === selectedPlaylistId,
  );

  const getPlaylistItemId = (songId: string): string | null => {
    if (songId in sessionPlaylistItemIdsBySongId) {
      return sessionPlaylistItemIdsBySongId[songId];
    }

    const existingSong = selectedPlaylist?.songs.find(
      (song) => song.id === songId,
    );

    return existingSong?.playlistItemId ?? null;
  };

  return (
    <div className="flex flex-col gap-6">
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
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "検索"
          )}
        </button>
      </form>
      {!!playlists.length && (
        <select
          value={selectedPlaylistId}
          onChange={(event) => {
            setSelectedPlaylistId(event.target.value);
            setSessionPlaylistItemIdsBySongId({});
          }}
          aria-label="プレイリストを選択"
          className="bg-surface-elevated text-foreground w-full rounded-md px-3 py-2 text-sm"
        >
          {playlists.map(({ id, title }) => (
            <option key={id} value={id}>
              {title}
            </option>
          ))}
        </select>
      )}
      {!songs.length ? (
        <p className="text-sm text-zinc-400">
          {query ? "検索結果がありません。" : "曲を検索してください。"}
        </p>
      ) : (
        <ul className="flex flex-col">
          {songs.map((song) => {
            const playlistItemId = getPlaylistItemId(song.id);
            const isActive = currentSong?.id === song.id;

            return (
              <li
                key={song.id}
                className={cvaSearchComponentSongListItem({ isActive })}
              >
                <button
                  type="button"
                  onClick={() => play(song, null, "検索結果", [])}
                  className="group flex min-w-0 flex-1 items-center gap-3 rounded-md text-left"
                >
                  <SongSummary song={song} isActive={isActive} />
                </button>
                {selectedPlaylistId && (
                  <button
                    type="button"
                    onClick={() =>
                      playlistItemId
                        ? handleDeleteSong(song.id)
                        : handleAddSong(song.id)
                    }
                    disabled={pendingSongId === song.id}
                    aria-label={
                      playlistItemId
                        ? "プレイリストから削除"
                        : "プレイリストに追加"
                    }
                    className="text-brand active:text-brand/70 flex size-8 shrink-0 items-center justify-center text-sm font-semibold disabled:text-zinc-500"
                  >
                    {pendingSongId === song.id ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : playlistItemId ? (
                      <Check className="size-5" />
                    ) : (
                      "追加"
                    )}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
