import { Ionicons } from "@expo/vector-icons";
import { Text } from "react-native";
import { clientJoinState } from "../../call/callWindow";
import { useNow } from "../home/time";
import PressableScale from "./PressableScale";

export default function JoinSessionButton({ apt, live, onJoin, compact }) {
  const now = useNow();
  const st = clientJoinState(apt, now, live);
  if (!["scheduled", "rescheduled", "pending_payment"].includes(apt.status))
    return null;
  const on = st.state === "live";
  return (
    <PressableScale
      haptic
      disabled={!on}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: compact ? 10 : 13,
        borderRadius: 14,
        marginTop: 12,
        backgroundColor: on ? "#16A34A" : "#F1F5F9",
      }}
      onPress={onJoin}
      accessibilityLabel={st.label}
    >
      <Ionicons
        name={on ? "videocam" : "time-outline"}
        size={17}
        color={on ? "#FFFFFF" : "#64748B"}
      />
      <Text
        style={{
          fontSize: 14,
          fontWeight: "800",
          color: on ? "#FFFFFF" : "#64748B",
        }}
      >
        {st.label}
      </Text>
    </PressableScale>
  );
}
