import notifee, { EventType } from "@notifee/react-native";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import { supabase } from "../../libs/supabase";
import IncomingCallScreen from "../app/IncomingCallScreen";
import useJoinSession from "../components/call/useJoinSession";
import {
  RING_MS,
  callNotificationId,
  registerPushToken,
  respondToCall,
} from "../services/callTask";
import { useCall } from "./CallContext";

const Ctx = createContext({ liveMap: {} });
export const useIncomingCall = () => useContext(Ctx);

const SELECT = `
  id, call_status, client_response, call_mode, call_ringing_at, counseling_type,
  counselor:counselor_id ( first_name, surname )
`;

export function IncomingCallProvider({ userId, role, children }) {
  const join = useJoinSession();
  const call = useCall();
  const [incoming, setIncoming] = useState(null);
  const [liveMap, setLiveMap] = useState({});
  const incomingRef = useRef(null);
  incomingRef.current = incoming;
  const inCallRef = useRef(false);
  inCallRef.current = !!call.session;

  const isClient = role === "client";

  const dismiss = useCallback((id) => {
    setIncoming((cur) => (cur && (!id || cur.id === id) ? null : cur));
    if (id) notifee.cancelNotification(callNotificationId(id)).catch(() => {});
  }, []);

  const open = useCallback(async (id) => {
    if (inCallRef.current || incomingRef.current?.id === id) return;
    const { data } = await supabase
      .from("appointments")
      .select(SELECT)
      .eq("id", id)
      .maybeSingle();
    if (
      !data ||
      data.call_status !== "live" ||
      data.client_response !== "ringing"
    )
      return;
    const c = Array.isArray(data.counselor)
      ? data.counselor[0]
      : data.counselor;
    setIncoming({
      id: data.id,
      name: `Counselor ${[c?.first_name, c?.surname].filter(Boolean).join(" ")}`.trim(),
      mode: data.call_mode || "video",
      type: data.counseling_type,
      ringingAt: data.call_ringing_at
        ? new Date(data.call_ringing_at).getTime()
        : Date.now(),
    });
  }, []);

  const accept = useCallback(
    async (id, info) => {
      const cur = info || incomingRef.current;
      dismiss(id);
      await respondToCall(id, "accepted");
      join({
        appointmentId: id,
        role: "client",
        peerName: cur?.name || "Your counselor",
        subtitle: `${cur?.type || "Counseling"} session`,
        video: (cur?.mode || "video") === "video",
      });
    },
    [dismiss, join],
  );

  const decline = useCallback(
    async (id) => {
      dismiss(id);
      await respondToCall(id, "declined");
    },
    [dismiss],
  );

  // Realtime: ring when the counselor starts, hang up when they end.
  useEffect(() => {
    if (!userId || !isClient) return;
    const ch = supabase
      .channel(`incoming-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "appointments",
          filter: `client_id=eq.${userId}`,
        },
        (p) => {
          const n = p.new;
          setLiveMap((m) => ({ ...m, [n.id]: n.call_status === "live" }));
          if (n.call_status === "live" && n.client_response === "ringing")
            open(n.id);
          else dismiss(n.id);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [userId, isClient, open, dismiss]);

  // Catch-up when the app opens or returns to the foreground.
  const catchUp = useCallback(async () => {
    if (!userId || !isClient) return;
    const since = new Date(Date.now() - RING_MS).toISOString();
    const { data } = await supabase
      .from("appointments")
      .select("id")
      .eq("client_id", userId)
      .eq("call_status", "live")
      .eq("client_response", "ringing")
      .gte("call_ringing_at", since)
      .limit(1);
    if (data?.[0]) open(data[0].id);
  }, [userId, isClient, open]);

  useEffect(() => {
    if (!userId || !isClient) return;
    registerPushToken(userId).catch(() => {});
    catchUp();
    const sub = AppState.addEventListener(
      "change",
      (s) => s === "active" && catchUp(),
    );
    return () => sub.remove();
  }, [userId, isClient, catchUp]);

  // Notification buttons (Android): Accept launches the app, Decline is handled in the background.
  useEffect(() => {
    if (!isClient) return;
    const handle = ({ type, detail }) => {
      const id = detail?.notification?.data?.appointmentId;
      if (!id) return;
      if (
        type === EventType.ACTION_PRESS &&
        detail.pressAction?.id === "accept"
      )
        accept(id);
      else if (
        type === EventType.ACTION_PRESS &&
        detail.pressAction?.id === "decline"
      )
        decline(id);
      else if (type === EventType.PRESS) open(id);
    };
    notifee.getInitialNotification().then((n) => {
      if (!n) return;
      handle({
        type:
          n.pressAction?.id === "accept"
            ? EventType.ACTION_PRESS
            : EventType.PRESS,
        detail: { notification: n.notification, pressAction: n.pressAction },
      });
    });
    return notifee.onForegroundEvent(handle);
  }, [isClient, accept, decline, open]);

  // Stop ringing after 45s and record a missed call.
  useEffect(() => {
    if (!incoming) return;
    const left = Math.max(1000, RING_MS - (Date.now() - incoming.ringingAt));
    const t = setTimeout(async () => {
      const id = incoming.id;
      dismiss(id);
      await respondToCall(id, "missed");
    }, left);
    return () => clearTimeout(t);
  }, [incoming, dismiss]);

  return (
    <Ctx.Provider value={{ liveMap }}>
      {children}
      <IncomingCallScreen
        incoming={incoming}
        onAccept={() => incoming && accept(incoming.id, incoming)}
        onDecline={() => incoming && decline(incoming.id)}
      />
    </Ctx.Provider>
  );
}
