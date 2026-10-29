import { NextResponse, after } from "next/server";
import {
  respondDiscordPlaybackControl,
  respondDiscordPlaylistCommand,
  respondDiscordPlaylistSelection,
  updateDiscordInteractionMessage,
} from "@/features/discord/api";
import {
  DISCORD_EPHEMERAL_MESSAGE_FLAG,
  DISCORD_INTERACTION_RESPONSE_TYPES,
  DISCORD_INTERACTION_TYPES,
  DISCORD_PLAYBACK_COMMAND_NAME,
  DiscordInteraction,
} from "@/features/discord/entity";
import {
  isDiscordUserAllowed,
  parseDiscordAllowedUserIds,
  parseDiscordComponentAction,
  parseDiscordInteraction,
  parseDiscordPlaybackSetting,
  verifyDiscordSignature,
} from "@/features/discord/library";

// NOTE: 再生先の状態が届くまで待ってからメッセージを書き換えるため、応答を返した後の処理に余裕を持たせる
export const maxDuration = 30;

const respondEphemeralMessage = (content: string) =>
  NextResponse.json({
    type: DISCORD_INTERACTION_RESPONSE_TYPES.channelMessage,
    data: { content, flags: DISCORD_EPHEMERAL_MESSAGE_FLAG },
  });

const parseJson = (body: string): unknown => {
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
};

// NOTE: Discord は 3 秒以内に応答しないと失敗として扱うため、YouTube・再生先とのやり取りは応答を保留してから after で行い、終わったらメッセージを書き換える。失敗した場合も押した結果が分かるよう、その旨に書き換える
const respondLater = (
  interaction: DiscordInteraction,
  task: () => Promise<void>,
) => {
  after(() =>
    task().catch(() =>
      updateDiscordInteractionMessage(interaction, {
        content: "操作に失敗しました。もう一度試してください",
      }).catch(() => {}),
    ),
  );
};

export const POST = async (request: Request) => {
  const {
    DISCORD_PUBLIC_KEY: publicKey,
    DISCORD_ALLOWED_USER_IDS: allowedUserIds,
    DISCORD_PLAYBACK_EMAIL: email,
    DISCORD_PLAYBACK_REFRESH_TOKEN: refreshToken,
    DISCORD_PLAYBACK_DEVICE_ID: deviceId,
  } = process.env;
  const body = await request.text();

  if (
    !publicKey ||
    !verifyDiscordSignature(
      publicKey,
      request.headers.get("x-signature-ed25519"),
      request.headers.get("x-signature-timestamp"),
      body,
    )
  ) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const interaction = parseDiscordInteraction(parseJson(body));

  if (!interaction) {
    return NextResponse.json({ message: "Bad Request" }, { status: 400 });
  }

  if (interaction.type === DISCORD_INTERACTION_TYPES.ping) {
    return NextResponse.json({ type: DISCORD_INTERACTION_RESPONSE_TYPES.pong });
  }

  if (
    !isDiscordUserAllowed(
      interaction.userId,
      parseDiscordAllowedUserIds(allowedUserIds),
    )
  ) {
    return respondEphemeralMessage("この操作は許可されていません");
  }

  const setting = parseDiscordPlaybackSetting(email, refreshToken, deviceId);

  if (!setting) {
    return respondEphemeralMessage("再生先が設定されていません");
  }

  if (
    interaction.type === DISCORD_INTERACTION_TYPES.applicationCommand &&
    interaction.commandName === DISCORD_PLAYBACK_COMMAND_NAME
  ) {
    respondLater(interaction, () =>
      respondDiscordPlaylistCommand(interaction, setting),
    );

    return NextResponse.json({
      type: DISCORD_INTERACTION_RESPONSE_TYPES.deferredChannelMessage,
    });
  }

  const action =
    interaction.type === DISCORD_INTERACTION_TYPES.messageComponent
      ? parseDiscordComponentAction(interaction.customId)
      : null;

  if (!action) {
    return respondEphemeralMessage("対応していない操作です");
  }

  respondLater(interaction, () =>
    action.type === "playlist"
      ? respondDiscordPlaylistSelection(interaction, setting, action.playlistId)
      : respondDiscordPlaybackControl(interaction, setting, action.command),
  );

  return NextResponse.json({
    type: DISCORD_INTERACTION_RESPONSE_TYPES.deferredUpdateMessage,
  });
};
