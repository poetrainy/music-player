import { NextResponse } from "next/server";
import { Rest } from "ably";
import { createRemotePlaybackChannelName } from "@/features/remote-playback/libraries/device";
import { getCurrentUser } from "@/features/user/api";

// NOTE: ブラウザに API キーを渡さないよう、ログイン中のユーザーのチャンネルだけを使える一時的なトークンを発行する
export const GET = async () => {
  const { ABLY_API_KEY: key } = process.env;
  const { email } = await getCurrentUser();

  if (!key || !email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const channelName = await createRemotePlaybackChannelName(email);
  const tokenRequest = await new Rest({ key }).auth.createTokenRequest({
    // NOTE: presence で名乗るには clientId が必要なため、メールアドレスを読み取れないチャンネル名をそのまま使う
    clientId: channelName,
    capability: { [channelName]: ["publish", "subscribe", "presence"] },
  });

  return NextResponse.json(tokenRequest);
};
