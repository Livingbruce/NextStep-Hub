import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PermissionsAndroid, Platform } from "react-native";
import {
  ChannelProfileType,
  ClientRoleType,
  RemoteVideoState,
  createAgoraRtcEngine,
} from "react-native-agora";
import { supabase } from "../../libs/supabase";

const CallContext = createContext(null);
export const useCall = () => useContext(CallContext);

async function readFunctionError(error) {
  try {
    const body = await error.context.json();
    return body?.error || error.message;
  } catch {
    return error.message;
  }
}

async function ensurePermissions(video) {
  if (Platform.OS !== "android") return;
  const list = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
  if (video) list.push(PermissionsAndroid.PERMISSIONS.CAMERA);
  const res = await PermissionsAndroid.requestMultiple(list);
  if (
    Object.values(res).some((r) => r !== PermissionsAndroid.RESULTS.GRANTED)
  ) {
    throw new Error(
      "Microphone" +
        (video ? " and camera" : "") +
        " permission is needed to join.",
    );
  }
}

async function fetchToken(appointmentId, opts = {}) {
  const { data, error } = await supabase.functions.invoke("agora-token", {
    body: { appointmentId, ...opts },
  });
  if (error) throw new Error(await readFunctionError(error));
  if (!data?.token)
    throw new Error(data?.error || "Could not get a session token.");
  return data;
}

export function useCallTimer(startedAt) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!startedAt) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  if (!startedAt) return "00:00";
  const s = Math.max(0, Math.floor((now - startedAt) / 1000));
  const h = Math.floor(s / 3600);
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${m}:${sec}` : `${m}:${sec}`;
}

export function CallProvider({ userId, children }) {
  const engineRef = useRef(null);
  const handlerRef = useRef(null);
  const sessionRef = useRef(null);

  const [session, setSession] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | waiting | live | reconnecting
  const [remoteUid, setRemoteUid] = useState(null);
  const [remoteVideoOn, setRemoteVideoOn] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [startedAt, setStartedAt] = useState(null);
  const [quality, setQuality] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [clientResponse, setClientResponse] = useState("ringing");

  const teardown = useCallback(() => {
    const engine = engineRef.current;
    engineRef.current = null;
    if (engine) {
      try {
        engine.leaveChannel();
        if (handlerRef.current)
          engine.unregisterEventHandler(handlerRef.current);
        engine.release();
      } catch (e) {
        console.warn("Agora teardown:", e);
      }
    }
    handlerRef.current = null;
    sessionRef.current = null;
    setSession(null);
    setStatus("idle");
    setRemoteUid(null);
    setRemoteVideoOn(false);
    setMuted(false);
    setCameraOn(true);
    setSpeakerOn(true);
    setStartedAt(null);
    setQuality(0);
    setExpanded(false);
    setClientResponse("ringing");
  }, []);

  const startCall = useCallback(
    async ({
      appointmentId,
      role,
      peerName,
      subtitle,
      video = true,
      intake = null,
      notes = "",
    }) => {
      if (engineRef.current) {
        setExpanded(true);
        return;
      }
      setConnecting(true);
      try {
        await ensurePermissions(video);
        const t = await fetchToken(appointmentId, { video });
        setClientResponse("ringing");

        const engine = createAgoraRtcEngine();
        engine.initialize({
          appId: t.appId,
          channelProfile: ChannelProfileType.ChannelProfileCommunication,
        });

        const handler = {
          onJoinChannelSuccess: () =>
            setStatus((s) => (s === "idle" ? "waiting" : s)),
          onRejoinChannelSuccess: () =>
            setStatus((s) => (s === "reconnecting" ? "live" : s)),
          onUserJoined: (_c, uid) => {
            setRemoteUid(uid);
            setStatus("live");
            setStartedAt((p) => p || Date.now());
          },
          onUserOffline: () => {
            setRemoteUid(null);
            setRemoteVideoOn(false);
            setStatus("waiting");
          },
          onRemoteVideoStateChanged: (_c, _uid, state) =>
            setRemoteVideoOn(
              state === RemoteVideoState.RemoteVideoStateDecoding,
            ),
          onConnectionLost: () => setStatus("reconnecting"),
          onNetworkQuality: (_c, uid, tx) => {
            if (uid === 0) setQuality(tx);
          },
          onTokenPrivilegeWillExpire: async () => {
            try {
              const fresh = await fetchToken(sessionRef.current.appointmentId, {
                ring: false,
              });
              engineRef.current?.renewToken(fresh.token);
            } catch (e) {
              console.warn("Token renew failed:", e);
            }
          },
          onError: (err, msg) => console.warn("Agora error:", err, msg),
        };
        engine.registerEventHandler(handler);
        engine.enableAudio();
        engine.enableVideo();
        if (video) engine.startPreview();
        else engine.enableLocalVideo(false);
        engine.setEnableSpeakerphone(video);

        engineRef.current = engine;
        handlerRef.current = handler;
        const meta = {
          appointmentId,
          role,
          peerName,
          subtitle,
          intake,
          video,
          initialNotes: notes,
        };
        sessionRef.current = meta;
        setSession(meta);
        setCameraOn(video);
        setSpeakerOn(video);
        setStatus("waiting");

        engine.joinChannel(t.token, t.channel, t.uid, {
          clientRoleType: ClientRoleType.ClientRoleBroadcaster,
          publishMicrophoneTrack: true,
          publishCameraTrack: video,
          autoSubscribeAudio: true,
          autoSubscribeVideo: true,
        });
        setExpanded(true);
      } catch (e) {
        if (engineRef.current) teardown();
        throw e;
      } finally {
        setConnecting(false);
      }
    },
    [teardown],
  );

  const endCall = useCallback(async () => {
    const s = sessionRef.current;
    teardown();
    if (s?.role === "counselor") {
      await supabase
        .from("appointments")
        .update({
          call_status: "ended",
          call_ended_at: new Date().toISOString(),
        })
        .eq("id", s.appointmentId);
    }
  }, [teardown]);

  const ringAgain = useCallback(async () => {
    const s = sessionRef.current;
    if (!s) return;
    setClientResponse("ringing");
    try {
      await fetchToken(s.appointmentId, { video: s.video });
    } catch (e) {
      console.warn(e);
    }
  }, []);

  // React to the other side via Supabase Realtime changes
  useEffect(() => {
    if (!session) return;
    const ch = supabase
      .channel(`call-${session.appointmentId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "appointments",
          filter: `id=eq.${session.appointmentId}`,
        },
        (p) => {
          const n = p.new;
          if (session.role === "counselor")
            setClientResponse(n.client_response);
          else if (n.call_status === "ended") teardown();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [session?.appointmentId, session?.role, teardown]);

  // Leave the call if the user logs out.
  useEffect(() => {
    if (!userId && engineRef.current) teardown();
  }, [userId, teardown]);

  const toggleMute = useCallback(() => {
    const next = !muted;
    engineRef.current?.muteLocalAudioStream(next);
    setMuted(next);
  }, [muted]);

  const toggleCamera = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) return;
    if (cameraOn) {
      engine.enableLocalVideo(false);
      engine.updateChannelMediaOptions({ publishCameraTrack: false });
      setCameraOn(false);
    } else {
      try {
        await ensurePermissions(true);
      } catch {
        return;
      }
      engine.enableLocalVideo(true);
      engine.updateChannelMediaOptions({ publishCameraTrack: true });
      engine.startPreview();
      setCameraOn(true);
    }
  }, [cameraOn]);

  const flipCamera = useCallback(() => engineRef.current?.switchCamera(), []);

  const toggleSpeaker = useCallback(() => {
    const next = !speakerOn;
    engineRef.current?.setEnableSpeakerphone(next);
    setSpeakerOn(next);
  }, [speakerOn]);

  const value = useMemo(
    () => ({
      session,
      connecting,
      status,
      remoteUid,
      remoteVideoOn,
      muted,
      cameraOn,
      speakerOn,
      startedAt,
      quality,
      expanded,
      clientResponse,
      startCall,
      endCall,
      ringAgain,
      toggleMute,
      toggleCamera,
      flipCamera,
      toggleSpeaker,
      expand: () => setExpanded(true),
      minimize: () => setExpanded(false),
    }),
    [
      session,
      connecting,
      status,
      remoteUid,
      remoteVideoOn,
      muted,
      cameraOn,
      speakerOn,
      startedAt,
      quality,
      expanded,
      clientResponse,
      startCall,
      endCall,
      ringAgain,
      toggleMute,
      toggleCamera,
      flipCamera,
      toggleSpeaker,
    ],
  );

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}
