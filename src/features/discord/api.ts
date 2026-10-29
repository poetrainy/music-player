import {
  DiscordInteraction,
  DiscordMessage,
  DiscordMessageContent,
  DiscordPlaybackControlCommandType,
  DiscordPlaybackSetting,
} from "@/features/discord/entity";
import {
  buildDiscordPlaybackResultMessage,
  buildDiscordPlaylistMessage,
} from "@/features/discord/library";
import { getEmbedAccessToken } from "@/features/embed/api";
import { sendRemotePlaybackCommand } from "@/features/remote-playback/api";
import { serviceAdapter } from "@/service/adapter";

const DISCORD_API_URL = "https://discord.com/api/v10";

// NOTE: ボタンを押したときなど、応答を保留したメッセージを後から書き換える。Bot のトークンは不要で、操作ごとに届くトークンで書き換えられる
export const updateDiscordInteractionMessage = async (
  { applicationId, token }: DiscordInteraction,
  message: DiscordMessage | DiscordMessageContent,
): Promise<void> => {
  const response = await fetch(
    `${DISCORD_API_URL}/webhooks/${encodeURIComponent(applicationId)}/${encodeURIComponent(token)}/messages/@original`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      // NOTE: 曲名などに @everyone などが含まれていてもメンションにしないよう、メンションをすべて無効にする
      body: JSON.stringify({ ...message, allowed_mentions: { parse: [] } }),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to update Discord message: ${response.status}`);
  }
};

const getDiscordAccessToken = async (refreshToken: string) => {
  const accessToken = await getEmbedAccessToken(refreshToken);

  if (!accessToken) {
    throw new Error("Failed to refresh access token for Discord");
  }

  return accessToken;
};

export const respondDiscordPlaylistCommand = async (
  interaction: DiscordInteraction,
  { refreshToken }: DiscordPlaybackSetting,
): Promise<void> => {
  const accessToken = await getDiscordAccessToken(refreshToken);
  const playlists = await serviceAdapter.getPlaylistSummaries(accessToken);

  await updateDiscordInteractionMessage(
    interaction,
    buildDiscordPlaylistMessage(playlists),
  );
};

export const respondDiscordPlaylistSelection = async (
  interaction: DiscordInteraction,
  { email, refreshToken, deviceId, deviceName }: DiscordPlaybackSetting,
  playlistId: string,
): Promise<void> => {
  const accessToken = await getDiscordAccessToken(refreshToken);
  const [playlists, song] = await Promise.all([
    serviceAdapter.getPlaylistSummaries(accessToken),
    serviceAdapter.getPlaylistFirstSong(accessToken, playlistId),
  ]);
  const playlist = playlists.find(({ id }) => id === playlistId);

  if (!playlist || !song) {
    await updateDiscordInteractionMessage(interaction, {
      content: "このプレイリストには再生できる曲がありません",
    });

    return;
  }

  const result = await sendRemotePlaybackCommand(
    email,
    deviceId,
    {
      type: "play",
      song,
      playlistId,
      playlistTitle: playlist.title,
      startSeconds: 0,
    },
    // NOTE: 再生先は曲を読み込む間も状態を送るため、選んだ曲の再生が始まるまで待つ
    (state) => state.song?.id === song.id && state.isPlaying,
  );

  await updateDiscordInteractionMessage(
    interaction,
    buildDiscordPlaybackResultMessage(result, deviceName),
  );
};

export const respondDiscordPlaybackControl = async (
  interaction: DiscordInteraction,
  { email, deviceId, deviceName }: DiscordPlaybackSetting,
  command: DiscordPlaybackControlCommandType,
): Promise<void> => {
  const result = await sendRemotePlaybackCommand(
    email,
    deviceId,
    { type: command },
    () => true,
  );

  await updateDiscordInteractionMessage(
    interaction,
    buildDiscordPlaybackResultMessage(result, deviceName),
  );
};
