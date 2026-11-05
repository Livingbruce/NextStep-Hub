import { useCallback } from "react";
import { Alert } from "react-native";
import { useCall } from "../../context/CallContext";

export default function useJoinSession() {
  const { session, startCall, expand } = useCall();
  return useCallback(
    async (opts) => {
      const key = opts.roomId ?? opts.appointmentId;
      if (session?.roomId === key) return expand();
      if (session) {
        Alert.alert(
          "Call in progress",
          "End your current call before joining another.",
        );
        return;
      }
      try {
        await startCall(opts);
      } catch (e) {
        Alert.alert("Can't join session", e?.message || "Please try again.");
      }
    },
    [session, startCall, expand],
  );
}
