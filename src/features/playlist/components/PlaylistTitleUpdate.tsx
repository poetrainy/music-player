"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { IconButton } from "@/components/IconButton";
import { updatePlaylist } from "@/features/playlist/api";

interface Props {
  playlistId: string;
  title: string;
}

export function PlaylistTitleUpdate({ playlistId, title }: Props) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [value, setValue] = useState(title);

  const handleCancel = () => {
    setValue(title);
    setIsEditing(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const trimmedValue = value.trim();

    if (!trimmedValue || trimmedValue === title) {
      handleCancel();
      return;
    }

    setIsUpdating(true);

    const formData = new FormData();
    formData.set("playlistId", playlistId);
    formData.set("title", trimmedValue);

    await updatePlaylist(formData);

    setIsUpdating(false);
    setIsEditing(false);
    router.refresh();
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={isUpdating}
          autoFocus
          className="text-foreground bg-surface-elevated min-w-0 rounded-md px-3 py-1 text-center text-2xl font-extrabold tracking-tight outline-none"
        />
        <IconButton
          type="submit"
          disabled={isUpdating}
          aria-label="保存"
          className="text-brand"
        >
          <Check className="size-5" />
        </IconButton>
        <IconButton
          type="button"
          onClick={handleCancel}
          disabled={isUpdating}
          aria-label="キャンセル"
          className="text-zinc-400"
        >
          <X className="size-5" />
        </IconButton>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <h1 className="text-foreground text-2xl font-extrabold tracking-tight">
        {title}
      </h1>
      <IconButton
        type="button"
        onClick={() => setIsEditing(true)}
        aria-label="プレイリスト名を編集"
        className="text-zinc-400"
      >
        <Pencil className="size-4" />
      </IconButton>
    </div>
  );
}
