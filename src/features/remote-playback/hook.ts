"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { InboundMessage, Realtime, RealtimeChannel } from "ably";
import { PlayerContextValue } from "@/features/player/hook";
import { getPlaylistById } from "@/features/playlist/api";
import {
  REMOTE_PLAYBACK_COMMAND_MESSAGE_NAME,
  REMOTE_PLAYBACK_STATE_MESSAGE_NAME,
  REMOTE_PLAYBACK_TOKEN_PATH,
  RemotePlaybackCommand,
  RemotePlaybackCommandMessage,
  RemotePlaybackState,
  RemotePlaybackStateMessage,
} from "@/features/remote-playback/entity";
import {
  loadRemotePlaybackTargetDeviceId,
  saveRemotePlaybackTargetDeviceId,
  subscribeRemotePlaybackTargetDeviceId,
} from "@/features/remote-playback/libraries/device";
import {
  parseRemotePlaybackCommandMessage,
  parseRemotePlaybackStateMessage,
} from "@/features/remote-playback/libraries/message";
import { Song } from "@/features/song/entity";

// NOTE: 命令の実行直後はプレーヤーの状態がまだ反映されていないため、少し待ってから状態を送る
const STATE_PUBLISH_DELAY_MILLISECONDS = 300;
// NOTE: 再生中は操作側の再生位置の推定がずれていくため、定期的に実際の位置を送り直す
const STATE_SYNC_INTERVAL_MILLISECONDS = 10 * 1000;
const CURRENT_TIME_TICK_MILLISECONDS = 500;

interface RemotePlaybackContextValue {
  targetDeviceId: string | null;
  selectTargetDevice: (deviceId: string | null) => void;
}

export const RemotePlaybackContext =
  createContext<RemotePlaybackContextValue | null>(null);

export const useRemotePlaybackTarget = (): RemotePlaybackContextValue => {
  const context = useContext(RemotePlaybackContext);

  if (!context) {
    throw new Error(
      "useRemotePlaybackTarget must be used within a PlayerProvider",
    );
  }

  return context;
};

interface ReceivedRemotePlaybackState {
  state: RemotePlaybackState;
  receivedAt: number;
}

interface RemotePlaylistSongs {
  playlistId: string;
  songs: Song[];
}

interface RemotePendingSeek {
  songId: string;
  seconds: number;
}

const fetchPlaylistSongs = async (
  playlistId: string | null,
  song: Song,
): Promise<Song[]> => {
  if (!playlistId) {
    return [song];
  }

  const playlist = await getPlaylistById(playlistId).catch(() => null);

  return playlist?.songs ?? [song];
};

const useRemotePlaybackChannel = (
  channelName: string,
  onMessage: (message: InboundMessage) => void,
) => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onMessageRef = useRef(onMessage);
  const [subscribedChannelName, setSubscribedChannelName] = useState<
    string | null
  >(null);

  useEffect(() => {
    onMessageRef.current = onMessage;
  });

  useEffect(() => {
    const client = new Realtime({ authUrl: REMOTE_PLAYBACK_TOKEN_PATH });
    const channel = client.channels.get(channelName);

    channelRef.current = channel;
    void channel
      .subscribe((message) => onMessageRef.current(message))
      .then(() => setSubscribedChannelName(channelName))
      .catch(() => {});

    return () => {
      channelRef.current = null;
      client.close();
    };
  }, [channelName]);

  // NOTE: 接続中に送ったメッセージは Ably が接続後に送るため、接続を待たずに送る
  const publish = useCallback(
    (
      name: string,
      data: RemotePlaybackCommandMessage | RemotePlaybackStateMessage,
    ) => {
      void channelRef.current?.publish(name, data).catch(() => {});
    },
    [],
  );

  return { publish, isSubscribed: subscribedChannelName === channelName };
};

// NOTE: deviceId がある場合は命令を受けて再生するデバイスとして、ない場合は再生先に命令を送る操作側として振る舞う
export const useRemotePlayback = (
  player: PlayerContextValue,
  channelName: string,
  deviceId: string | null,
) => {
  const playerRef = useRef(player);
  const targetDeviceIdRef = useRef<string | null>(null);
  const pendingSeekRef = useRef<RemotePendingSeek | null>(null);
  const publishTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const storedTargetDeviceId = useSyncExternalStore(
    subscribeRemotePlaybackTargetDeviceId,
    loadRemotePlaybackTargetDeviceId,
    () => null,
  );
  // NOTE: 再生するデバイス自身は命令を送らないため、保存された再生先があっても使わない
  const targetDeviceId = deviceId ? null : storedTargetDeviceId;
  const [remoteState, setRemoteState] =
    useState<ReceivedRemotePlaybackState | null>(null);
  const [remotePlaylistSongs, setRemotePlaylistSongs] =
    useState<RemotePlaylistSongs | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    playerRef.current = player;
  });

  useEffect(() => {
    targetDeviceIdRef.current = targetDeviceId;
  }, [targetDeviceId]);

  const executeCommandRef = useRef<(command: RemotePlaybackCommand) => void>(
    () => {},
  );

  const handleMessage = ({ name, data }: InboundMessage) => {
    if (name === REMOTE_PLAYBACK_COMMAND_MESSAGE_NAME && deviceId) {
      const message = parseRemotePlaybackCommandMessage(data);

      if (message?.deviceId === deviceId) {
        executeCommandRef.current(message.command);
      }

      return;
    }

    if (name === REMOTE_PLAYBACK_STATE_MESSAGE_NAME && !deviceId) {
      const message = parseRemotePlaybackStateMessage(data);

      if (!message || message.deviceId !== targetDeviceIdRef.current) {
        return;
      }

      // NOTE: デバイス間の時計のずれの影響を受けないよう、送信時刻ではなく受信時刻から再生位置を推定する
      const receivedAt = Date.now();

      setRemoteState({ state: message.state, receivedAt });
      setNow(receivedAt);
    }
  };

  const { publish, isSubscribed } = useRemotePlaybackChannel(
    channelName,
    handleMessage,
  );

  const publishState = useCallback(() => {
    if (!deviceId) {
      return;
    }

    const {
      currentSong,
      currentTime,
      duration,
      isPlaying,
      isShuffled,
      playlistId,
      playlistTitle,
      repeatMode,
      volume,
    } = playerRef.current;

    publish(REMOTE_PLAYBACK_STATE_MESSAGE_NAME, {
      deviceId,
      state: {
        song: currentSong,
        playlistId,
        playlistTitle,
        isPlaying,
        currentTime,
        duration,
        volume,
        isShuffled,
        repeatMode,
      },
    });
  }, [deviceId, publish]);

  const schedulePublishState = useCallback(() => {
    clearTimeout(publishTimerRef.current);
    publishTimerRef.current = setTimeout(
      publishState,
      STATE_PUBLISH_DELAY_MILLISECONDS,
    );
  }, [publishState]);

  useEffect(() => () => clearTimeout(publishTimerRef.current), []);

  useEffect(() => {
    executeCommandRef.current = async (command) => {
      const current = playerRef.current;

      switch (command.type) {
        case "play": {
          const { song, playlistId, playlistTitle, startSeconds } = command;
          const songs = await fetchPlaylistSongs(playlistId, song);

          pendingSeekRef.current =
            startSeconds > 0
              ? { songId: song.id, seconds: startSeconds }
              : null;
          playerRef.current.play(song, playlistId, playlistTitle, songs);
          break;
        }
        case "toggle-playback":
          current.togglePlayback();
          break;
        case "next":
          current.playNext();
          break;
        case "previous":
          current.playPrevious();
          break;
        case "seek":
          current.seekTo(command.seconds);
          break;
        case "volume":
          current.setVolume(command.volume);
          break;
        case "shuffle":
          current.toggleShuffle();
          break;
        case "repeat":
          current.cycleRepeatMode();
          break;
        case "request-state":
          break;
      }

      schedulePublishState();
    };
  }, [schedulePublishState]);

  // NOTE: 別のデバイスから引き継いだ再生位置は、曲の読み込みが終わって再生が始まってから合わせる
  useEffect(() => {
    const pendingSeek = pendingSeekRef.current;

    if (
      !pendingSeek ||
      !player.isPlaying ||
      !player.duration ||
      player.currentSong?.id !== pendingSeek.songId
    ) {
      return;
    }

    pendingSeekRef.current = null;
    player.seekTo(pendingSeek.seconds);
    schedulePublishState();
  }, [player, schedulePublishState]);

  useEffect(() => {
    publishState();
  }, [
    publishState,
    player.currentSong,
    player.duration,
    player.isPlaying,
    player.isShuffled,
    player.playlistId,
    player.playlistTitle,
    player.repeatMode,
    player.volume,
  ]);

  useEffect(() => {
    if (!deviceId || !player.isPlaying) {
      return;
    }

    const timer = setInterval(publishState, STATE_SYNC_INTERVAL_MILLISECONDS);

    return () => clearInterval(timer);
  }, [deviceId, player.isPlaying, publishState]);

  const sendCommand = useCallback(
    (targetId: string, command: RemotePlaybackCommand) => {
      publish(REMOTE_PLAYBACK_COMMAND_MESSAGE_NAME, {
        deviceId: targetId,
        command,
      });
    },
    [publish],
  );

  // NOTE: 開き直したときや再生先を切り替えたときは、再生先の現在の状態を問い合わせて表示を合わせる。返事を取りこぼさないよう、受信の準備ができてから問い合わせる
  useEffect(() => {
    if (!isSubscribed || !targetDeviceId) {
      return;
    }

    sendCommand(targetDeviceId, { type: "request-state" });
  }, [isSubscribed, sendCommand, targetDeviceId]);

  // NOTE: 再生先を切り替えたときは手元の再生を止め、再生中の曲を同じ位置から再生先に引き継ぐ
  const selectTargetDevice = useCallback(
    (nextDeviceId: string | null) => {
      const { currentSong, currentTime, isPlaying, playlistId, playlistTitle } =
        playerRef.current;

      if (nextDeviceId && isPlaying && currentSong) {
        sendCommand(nextDeviceId, {
          type: "play",
          song: currentSong,
          playlistId,
          playlistTitle,
          startSeconds: currentTime,
        });
        playerRef.current.togglePlayback();
      }

      setRemoteState(null);
      saveRemotePlaybackTargetDeviceId(nextDeviceId);
    },
    [sendCommand],
  );

  const isRemotePlaying = !!remoteState?.state.isPlaying;

  useEffect(() => {
    if (!isRemotePlaying) {
      return;
    }

    const timer = setInterval(
      () => setNow(Date.now()),
      CURRENT_TIME_TICK_MILLISECONDS,
    );

    return () => clearInterval(timer);
  }, [isRemotePlaying]);

  const remotePlaylistId = remoteState?.state.playlistId ?? null;

  useEffect(() => {
    if (!remotePlaylistId) {
      return;
    }

    let isCancelled = false;

    void getPlaylistById(remotePlaylistId)
      .then((playlist) => {
        if (isCancelled) {
          return;
        }

        setRemotePlaylistSongs({
          playlistId: remotePlaylistId,
          songs: playlist?.songs ?? [],
        });
      })
      .catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, [remotePlaylistId]);

  const connectedPlayer = useMemo((): PlayerContextValue => {
    if (deviceId || !targetDeviceId) {
      return player;
    }

    const state = remoteState?.state ?? null;
    const elapsedSeconds =
      remoteState && state?.isPlaying
        ? Math.max(now - remoteState.receivedAt, 0) / 1000
        : 0;
    const currentTime = state
      ? Math.min(
          state.currentTime + elapsedSeconds,
          state.duration || state.currentTime + elapsedSeconds,
        )
      : 0;
    const songs =
      remotePlaylistSongs && remotePlaylistSongs.playlistId === remotePlaylistId
        ? remotePlaylistSongs.songs
        : state?.song
          ? [state.song]
          : [];

    const send = (command: RemotePlaybackCommand) =>
      sendCommand(targetDeviceId, command);

    return {
      ...player,
      currentSong: state?.song ?? null,
      currentTime,
      duration: state?.duration ?? 0,
      isPlaying: !!state?.isPlaying,
      isShuffled: !!state?.isShuffled,
      playlistId: state?.playlistId ?? null,
      playlistTitle: state?.playlistTitle ?? "",
      repeatMode: state?.repeatMode ?? "off",
      songs,
      volume: state?.volume ?? player.volume,
      play: (song, playlistId, playlistTitle) => {
        send({
          type: "play",
          song,
          playlistId,
          playlistTitle,
          startSeconds: 0,
        });
        player.setActiveMobileView("player");
      },
      togglePlayback: () => send({ type: "toggle-playback" }),
      playNext: () => send({ type: "next" }),
      playPrevious: () => send({ type: "previous" }),
      seekTo: (seconds) => send({ type: "seek", seconds }),
      setVolume: (volume) => send({ type: "volume", volume }),
      toggleShuffle: () => send({ type: "shuffle" }),
      cycleRepeatMode: () => send({ type: "repeat" }),
    };
  }, [
    deviceId,
    now,
    player,
    remotePlaylistId,
    remotePlaylistSongs,
    remoteState,
    sendCommand,
    targetDeviceId,
  ]);

  return { connectedPlayer, targetDeviceId, selectTargetDevice };
};
