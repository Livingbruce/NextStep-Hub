import notifee, { EventType } from "@notifee/react-native";
import * as Linking from "expo-linking";
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
import IncomingCallScreen from "../components/call/IncomingCallScreen";
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
  id,
  call_status,
  client_response,
  call_mode,
  call_ringing_at,
  counseling_type,
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

  const openingIdsRef = useRef(new Set());
  const handledLinks = useRef(new Set());

  const isClient = role === "client";

  const dismiss = useCallback((id) => {
    setIncoming((current) =>
      current && (!id || current.id === id) ? null : current,
    );

    if (id) {
      notifee.cancelNotification(callNotificationId(id)).catch(() => {});
    }
  }, []);

  // Only open calls belonging to the signed-in client.
  const open = useCallback(
    async (id) => {
      if (
        !id ||
        !userId ||
        !isClient ||
        inCallRef.current ||
        incomingRef.current?.id === id ||
        openingIdsRef.current.has(id)
      ) {
        return;
      }

      openingIdsRef.current.add(id);

      try {
        const { data, error } = await supabase
          .from("appointments")
          .select(SELECT)
          .eq("id", id)
          .eq("client_id", userId)
          .maybeSingle();

        if (error) {
          console.error("[IncomingCall] Appointment lookup failed:", error);
          return;
        }

        // An appointment belonging to another client is rejected here.
        if (!data) {
          console.warn(
            "[IncomingCall] Ignored call not belonging to this client.",
          );
          return;
        }

        if (data.call_status !== "live" || data.client_response !== "ringing") {
          return;
        }

        if (inCallRef.current || incomingRef.current?.id === id) {
          return;
        }

        const counselor = Array.isArray(data.counselor)
          ? data.counselor[0]
          : data.counselor;

        const counselorName = [counselor?.first_name, counselor?.surname]
          .filter(Boolean)
          .join(" ");

        setIncoming({
          id: data.id,
          name: counselorName ? `Counselor ${counselorName}` : "Your counselor",
          mode: data.call_mode || "video",
          type: data.counseling_type,
          ringingAt: data.call_ringing_at
            ? new Date(data.call_ringing_at).getTime()
            : Date.now(),
        });

        console.log("[IncomingCall] Opened incoming call:", id);
      } catch (error) {
        console.error("[IncomingCall] Failed to open call:", error);
      } finally {
        openingIdsRef.current.delete(id);
      }
    },
    [userId, isClient],
  );

  const accept = useCallback(
    async (id, info) => {
      if (!id) return;

      const current = info || incomingRef.current;

      dismiss(id);

      const { error } = await respondToCall(id, "accepted");

      if (error) {
        console.error("[IncomingCall] Accept failed:", error);
        return;
      }

      join({
        appointmentId: id,
        role: "client",
        peerName: current?.name || "Your counselor",
        subtitle: `${current?.type || "Counseling"} session`,
        video: (current?.mode || "video") === "video",
      });
    },
    [dismiss, join],
  );

  const decline = useCallback(
    async (id) => {
      if (!id) return;

      dismiss(id);

      const { error } = await respondToCall(id, "declined");

      if (error) {
        console.error("[IncomingCall] Decline failed:", error);
      }
    },
    [dismiss],
  );

  // Realtime events are scoped to this client's appointments.
  useEffect(() => {
    if (!userId || !isClient) return;

    const channel = supabase
      .channel(`incoming-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "appointments",
          filter: `client_id=eq.${userId}`,
        },
        (payload) => {
          const appointment = payload.new;

          setLiveMap((current) => ({
            ...current,
            [appointment.id]: appointment.call_status === "live",
          }));

          if (
            appointment.call_status === "live" &&
            appointment.client_response === "ringing"
          ) {
            open(appointment.id);
          } else {
            dismiss(appointment.id);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, isClient, open, dismiss]);

  // Catch calls that started while the app was closed.
  const catchUp = useCallback(async () => {
    if (!userId || !isClient) return;

    const since = new Date(Date.now() - RING_MS).toISOString();

    const { data, error } = await supabase
      .from("appointments")
      .select("id")
      .eq("client_id", userId)
      .eq("call_status", "live")
      .eq("client_response", "ringing")
      .gte("call_ringing_at", since)
      .limit(1);

    if (error) {
      console.error("[IncomingCall] Catch-up failed:", error);
      return;
    }

    if (data?.[0]) {
      open(data[0].id);
    }
  }, [userId, isClient, open]);

  // Handle the deep link opened by Accept on the native overlay.
  useEffect(() => {
    if (!isClient) return;

    const handleUrl = (url) => {
      if (!url) return;

      const query = Linking.parse(url)?.queryParams || {};
      const id = query.acceptCall;

      if (!id || handledLinks.current.has(id)) return;

      handledLinks.current.add(id);

      accept(String(id), {
        name: query.name,
        mode: query.mode || "video",
        type: query.type,
      });
    };

    Linking.getInitialURL().then(handleUrl);

    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleUrl(url);
    });

    return () => subscription.remove();
  }, [isClient, accept]);

  // Register this client's push token and check for missed foreground updates.
  useEffect(() => {
    if (!userId || !isClient) return;

    registerPushToken(userId).catch((error) => {
      console.error("[IncomingCall] Push registration failed:", error);
    });

    catchUp();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        catchUp();
      }
    });

    return () => subscription.remove();
  }, [userId, isClient, catchUp]);

  // Handle notification actions.
  useEffect(() => {
    if (!isClient) return;

    const handleNotification = ({ type, detail }) => {
      const id = detail?.notification?.data?.appointmentId;

      if (!id) return;

      if (
        type === EventType.ACTION_PRESS &&
        detail.pressAction?.id === "accept"
      ) {
        open(id);
      } else if (
        type === EventType.ACTION_PRESS &&
        detail.pressAction?.id === "decline"
      ) {
        decline(id);
      } else if (type === EventType.PRESS) {
        open(id);
      }
    };

    notifee.getInitialNotification().then((notification) => {
      if (!notification) return;

      handleNotification({
        type:
          notification.pressAction?.id === "accept"
            ? EventType.ACTION_PRESS
            : EventType.PRESS,
        detail: {
          notification: notification.notification,
          pressAction: notification.pressAction,
        },
      });
    });

    return notifee.onForegroundEvent(handleNotification);
  }, [isClient, open, decline]);

  // Stop ringing after 45 seconds and record a missed call.
  useEffect(() => {
    if (!incoming) return;

    const remaining = Math.max(
      1000,
      RING_MS - (Date.now() - incoming.ringingAt),
    );

    const timer = setTimeout(async () => {
      const id = incoming.id;

      dismiss(id);

      const { error } = await respondToCall(id, "missed");

      if (error) {
        console.error("[IncomingCall] Missed-call update failed:", error);
      }
    }, remaining);

    return () => clearTimeout(timer);
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
