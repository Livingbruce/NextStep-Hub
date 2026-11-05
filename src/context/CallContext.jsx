import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Alert, PermissionsAndroid, Platform } from "react-native";

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

  if (video) {
    list.push(PermissionsAndroid.PERMISSIONS.CAMERA);
  }

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

async function fetchToken(room, opts = {}) {
  const { data, error } = await supabase.functions.invoke("agora-token", {
    body: {
      kind: room.kind,
      id: room.id,
      ...opts,
    },
  });

  if (error) {
    throw new Error(await readFunctionError(error));
  }

  if (!data?.token) {
    throw new Error(data?.error || "Could not get a session token.");
  }

  return data;
}

const tableOf = (kind) => (kind === "program" ? "programs" : "appointments");

export function useCallTimer(startedAt) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!startedAt) return;

    setNow(Date.now());

    const id = setInterval(() => {
      setNow(Date.now());
    }, 1000);

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
  const [session, setSession] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [status, setStatus] = useState("idle");

  // Backward-compatible single remote participant state.
  const [remoteUid, setRemoteUid] = useState(null);
  const [remoteVideoOn, setRemoteVideoOn] = useState(false);

  // Multiperson participant state.
  const [uids, setUids] = useState([]);
  const [roster, setRoster] = useState({});
  const [remoteVideo, setRemoteVideo] = useState({});

  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [canPublish, setCanPublish] = useState(true);

  const [startedAt, setStartedAt] = useState(null);
  const [quality, setQuality] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [clientResponse, setClientResponse] = useState("ringing");

  const engineRef = useRef(null);
  const handlerRef = useRef(null);
  const sessionRef = useRef(null);

  const uidsRef = useRef([]);
  const canPublishRef = useRef(true);
  const startCallRef = useRef(null);

  const remoteUidRef = useRef(null);
  remoteUidRef.current = remoteUid;

  const statusRef = useRef("idle");
  statusRef.current = status;

  const teardown = useCallback(() => {
    const engine = engineRef.current;

    engineRef.current = null;

    if (engine) {
      try {
        engine.leaveChannel();

        if (handlerRef.current) {
          engine.unregisterEventHandler(handlerRef.current);
        }

        engine.release();
      } catch (e) {
        console.warn("Agora teardown:", e);
      }
    }

    handlerRef.current = null;
    sessionRef.current = null;

    uidsRef.current = [];
    canPublishRef.current = true;

    setSession(null);
    setStatus("idle");

    setRemoteUid(null);
    setRemoteVideoOn(false);

    setUids([]);
    setRoster({});
    setRemoteVideo({});

    setMuted(false);
    setCameraOn(true);
    setSpeakerOn(true);
    setCanPublish(true);

    setStartedAt(null);
    setQuality(0);
    setExpanded(false);
    setClientResponse("ringing");
  }, []);

  const startCall = useCallback(
    async (opts) => {
      const {
        kind = "appointment",
        role,
        peerName,
        subtitle,
        intake = null,
        notes = "",
      } = opts;

      const id = opts.roomId ?? opts.appointmentId;
      const requestedVideo = opts.video !== false;

      if (!id) {
        throw new Error("A room ID is required to start a call.");
      }

      if (kind !== "appointment" && kind !== "program") {
        throw new Error("Unsupported call session type.");
      }

      if (engineRef.current) {
        setExpanded(true);
        return;
      }

      setConnecting(true);

      try {
        setClientResponse("ringing");

        const t = await fetchToken({ kind, id }, { video: requestedVideo });

        // The server decides whether this session is audio or video.
        const useVideo = t.mode === "video";
        const publish = !!t.canPublish;

        // Audience participants do not need microphone or camera permission.
        if (publish) {
          await ensurePermissions(useVideo);
        }

        const names = {};

        (t.roster || []).forEach((r) => {
          names[r.uid] = r.name;
        });

        const clientCount = (t.roster || []).filter(
          (r) => r.role === "client",
        ).length;

        const engine = createAgoraRtcEngine();

        engine.initialize({
          appId: t.appId,
          channelProfile: t.live
            ? ChannelProfileType.ChannelProfileLiveBroadcasting
            : ChannelProfileType.ChannelProfileCommunication,
        });

        const handler = {
          onJoinChannelSuccess: () => {
            setStatus((s) => (s === "idle" ? "waiting" : s));
          },

          onRejoinChannelSuccess: () => {
            setStatus((s) => (s === "reconnecting" ? "live" : s));
          },

          onUserJoined: (_c, uid) => {
            if (!uidsRef.current.includes(uid)) {
              const next = [...uidsRef.current, uid];

              uidsRef.current = next;
              setUids(next);
            }

            setRemoteUid(uidsRef.current[0] ?? null);
            setStatus("live");
            setStartedAt((p) => p || Date.now());
          },

          onUserOffline: (_c, uid) => {
            const next = uidsRef.current.filter((u) => u !== uid);

            uidsRef.current = next;

            setUids(next);
            setRemoteUid(next[0] ?? null);

            setRemoteVideo((p) => {
              const { [uid]: _removed, ...rest } = p;
              return rest;
            });

            setRemoteVideoOn(next.some((u) => remoteVideo[u]));

            if (!next.length) {
              setStatus((s) => (s === "live" ? "waiting" : s));
            }
          },

          onRemoteVideoStateChanged: (_c, uid, state) => {
            const isDecoding =
              state === RemoteVideoState.RemoteVideoStateDecoding;

            setRemoteVideo((p) => ({
              ...p,
              [uid]: isDecoding,
            }));

            if (uid === remoteUidRef.current) {
              setRemoteVideoOn(isDecoding);
            }
          },

          onConnectionLost: () => {
            setStatus("reconnecting");
          },

          onNetworkQuality: (_c, uid, tx) => {
            if (uid === 0) {
              setQuality(tx);
            }
          },

          onTokenPrivilegeWillExpire: async () => {
            try {
              const s = sessionRef.current;

              if (!s) return;

              const fresh = await fetchToken(
                { kind: s.kind, id: s.roomId },
                { ring: false },
              );

              engineRef.current?.renewToken(fresh.token);
            } catch (e) {
              console.warn("Token renew failed:", e);
            }
          },

          onError: (err, msg) => {
            console.warn("Agora error:", err, msg);
          },
        };

        engine.registerEventHandler(handler);
        engine.enableAudio();

        // Do not initialize the video pipeline for audio sessions.
        if (useVideo) {
          engine.enableVideo();

          if (publish) {
            engine.startPreview();
          }
        }

        engine.setEnableSpeakerphone(useVideo || kind === "program");

        engineRef.current = engine;
        handlerRef.current = handler;

        canPublishRef.current = publish;
        setCanPublish(publish);

        const group = !!t.group;

        const meta = {
          kind,
          roomId: id,

          // Kept for existing appointment-related UI.
          appointmentId: id,

          role,
          subtitle,
          intake,
          video: useVideo,
          group,
          attendees: t.attendees,

          peerName:
            kind === "appointment" && group && role === "counselor"
              ? `Group session · ${clientCount} participant${
                  clientCount === 1 ? "" : "s"
                }`
              : peerName,

          initialNotes: notes,
        };

        sessionRef.current = meta;

        setSession(meta);
        setRoster(names);

        setCameraOn(useVideo && publish);
        setSpeakerOn(useVideo || kind === "program");
        setStatus("waiting");

        engine.joinChannel(t.token, t.channel, t.uid, {
          clientRoleType: publish
            ? ClientRoleType.ClientRoleBroadcaster
            : ClientRoleType.ClientRoleAudience,

          publishMicrophoneTrack: publish,
          publishCameraTrack: publish && useVideo,

          autoSubscribeAudio: true,
          autoSubscribeVideo: useVideo,
        });

        setExpanded(true);
      } catch (e) {
        if (engineRef.current) {
          teardown();
        }

        throw e;
      } finally {
        setConnecting(false);
      }
    },
    [teardown],
  );

  startCallRef.current = startCall;

  const endCall = useCallback(async () => {
    const s = sessionRef.current;

    teardown();

    if (s?.role === "counselor") {
      const { error } = await supabase
        .from(tableOf(s.kind))
        .update({
          call_status: "ended",
          call_ended_at: new Date().toISOString(),
        })
        .eq("id", s.roomId);

      if (error) {
        console.warn("Could not update call status:", error);
      }
    }
  }, [teardown]);

  const ringAgain = useCallback(async () => {
    const s = sessionRef.current;

    // Ring-again behavior is specific to appointments.
    if (!s || s.kind !== "appointment") return;

    setClientResponse("ringing");

    try {
      await fetchToken(
        { kind: "appointment", id: s.roomId },
        { video: s.video },
      );
    } catch (e) {
      console.warn(e);
    }
  }, []);

  const handleDeclined = useCallback(
    async (s) => {
      if (!s || s.kind !== "appointment") return;

      teardown();

      const { error } = await supabase
        .from("appointments")
        .update({
          call_status: "ended",
          call_ended_at: new Date().toISOString(),
        })
        .eq("id", s.roomId);

      if (error) {
        console.warn("Could not update declined call:", error);
      }

      Alert.alert(
        "Call declined",
        `${s.peerName || "The participant"} declined the call. It may have been by mistake.`,
        [
          {
            text: "OK",
            style: "cancel",
          },
          {
            text: "Call again",
            onPress: () => {
              startCallRef
                .current?.({
                  ...s,
                  roomId: s.roomId,
                  notes: s.initialNotes,
                })
                .catch((e) => {
                  Alert.alert(
                    "Could not start call",
                    e?.message || "Please try again.",
                  );
                });
            },
          },
        ],
      );
    },
    [teardown],
  );

  // Appointment-only counselor response and 1:1 decline handling.
  useEffect(() => {
    if (
      !session ||
      session.role !== "counselor" ||
      session.kind !== "appointment"
    ) {
      return;
    }

    const ch = supabase
      .channel(`appointment-response-${session.roomId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "appointments",
          filter: `id=eq.${session.roomId}`,
        },
        (p) => {
          const n = p.new;

          setClientResponse(n.client_response);

          // Decline handling is for one-to-one appointments only.
          if (
            !session.group &&
            n.client_response === "declined" &&
            remoteUidRef.current == null
          ) {
            handleDeclined(sessionRef.current || session);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [
    session?.roomId,
    session?.role,
    session?.kind,
    session?.group,
    handleDeclined,
  ]);

  // Client-side session-ended listener for appointments and programs.
  useEffect(() => {
    if (!session || session.role === "counselor") return;

    const table = tableOf(session.kind);

    const ch = supabase
      .channel(`call-${session.roomId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table,
          filter: `id=eq.${session.roomId}`,
        },
        (p) => {
          if (p.new.call_status === "ended") {
            teardown();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [session?.roomId, session?.role, session?.kind, teardown]);

  // Appointment-only unanswered ring expiry.
  useEffect(() => {
    if (
      !session ||
      session.role !== "counselor" ||
      session.kind !== "appointment" ||
      clientResponse !== "ringing" ||
      status === "live"
    ) {
      return;
    }

    const timeout = setTimeout(() => {
      supabase.rpc("expire_ring", {
        p_appointment_id: session.roomId,
      });
    }, 45000);

    return () => clearTimeout(timeout);
  }, [session?.roomId, session?.role, session?.kind, clientResponse, status]);

  // Promote or demote a program attendee while the call is active.
  const applyRole = useCallback(async (can) => {
    const engine = engineRef.current;
    const s = sessionRef.current;

    if (!engine || !s || can === canPublishRef.current) {
      return;
    }

    try {
      if (can) {
        await ensurePermissions(s.video);

        // The server must return a publisher token when this
        // participant is authorized to speak.
        const fresh = await fetchToken(
          { kind: s.kind, id: s.roomId },
          { ring: false },
        );

        engine.renewToken(fresh.token);

        engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);

        engine.updateChannelMediaOptions({
          clientRoleType: ClientRoleType.ClientRoleBroadcaster,

          publishMicrophoneTrack: true,
          publishCameraTrack: s.video,
        });

        if (s.video) {
          engine.enableLocalVideo(true);
          engine.startPreview();
        }

        setMuted(false);
      } else {
        engine.updateChannelMediaOptions({
          clientRoleType: ClientRoleType.ClientRoleAudience,

          publishMicrophoneTrack: false,
          publishCameraTrack: false,
        });

        engine.setClientRole(ClientRoleType.ClientRoleAudience);

        if (s.video) {
          engine.enableLocalVideo(false);
        }
      }

      canPublishRef.current = can;

      setCanPublish(can);
      setCameraOn(can && s.video);
    } catch (e) {
      Alert.alert(
        "Can't change speaking status",
        e?.message || "Please try again.",
      );
    }
  }, []);

  // Listen for program host changes to can_speak.
  useEffect(() => {
    if (
      !session ||
      session.kind !== "program" ||
      session.role === "counselor" ||
      !userId
    ) {
      return;
    }

    const ch = supabase
      .channel(`speak-${session.roomId}-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "program_participants",
          filter: `client_id=eq.${userId}`,
        },
        ({ new: row }) => {
          if (row.program_id === session.roomId) {
            applyRole(!!row.can_speak);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [session?.roomId, session?.kind, session?.role, userId, applyRole]);

  // Leave the call if the user logs out.
  useEffect(() => {
    if (!userId && engineRef.current) {
      teardown();
    }
  }, [userId, teardown]);

  const toggleMute = useCallback(() => {
    if (!canPublishRef.current) return;

    const next = !muted;

    engineRef.current?.muteLocalAudioStream(next);
    setMuted(next);
  }, [muted]);

  const toggleCamera = useCallback(async () => {
    const engine = engineRef.current;
    const s = sessionRef.current;

    if (!engine || !s?.video || !canPublishRef.current) {
      return;
    }

    if (cameraOn) {
      engine.enableLocalVideo(false);

      engine.updateChannelMediaOptions({
        publishCameraTrack: false,
      });

      setCameraOn(false);
    } else {
      try {
        await ensurePermissions(true);
      } catch (e) {
        Alert.alert(
          "Camera permission required",
          e?.message || "Allow camera access to turn on your camera.",
        );
        return;
      }

      engine.enableLocalVideo(true);

      engine.updateChannelMediaOptions({
        publishCameraTrack: true,
      });

      engine.startPreview();

      setCameraOn(true);
    }
  }, [cameraOn]);

  const flipCamera = useCallback(() => {
    const s = sessionRef.current;

    if (!s?.video || !canPublishRef.current) {
      return;
    }

    engineRef.current?.switchCamera();
  }, []);

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

      // Existing single-participant properties.
      remoteUid,
      remoteVideoOn,

      // Multiperson properties.
      uids,
      roster,
      remoteVideo,

      muted,
      cameraOn,
      speakerOn,
      canPublish,

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

      uids,
      roster,
      remoteVideo,

      muted,
      cameraOn,
      speakerOn,
      canPublish,

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
