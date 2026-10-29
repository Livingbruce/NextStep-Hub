import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import {
  askBattery,
  askFullScreen,
  askNotifications,
  askOverlay,
  isCallSetupDone,
  markCallSetupDone,
} from "../../services/callPermissions";
import PressableScale from "../client/appointments/PressableScale";

const STEPS = [
  {
    icon: "notifications",
    label: "Allow notifications",
    run: askNotifications,
  },
  { icon: "layers", label: "Display over other apps", run: askOverlay },
  {
    icon: "phone-portrait",
    label: "Allow full-screen calls",
    run: askFullScreen,
  },
  {
    icon: "battery-charging",
    label: "Don't restrict battery",
    run: askBattery,
  },
];

export default function CallSetupCard() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    isCallSetupDone().then((d) => setShow(!d));
  }, []);
  if (!show) return null;

  return (
    <View
      style={{
        backgroundColor: "#F0FDF4",
        borderColor: "#BBF7D0",
        borderWidth: 1,
        borderRadius: 18,
        padding: 16,
        marginBottom: 16,
      }}
    >
      <Text style={{ fontSize: 15, fontWeight: "800", color: "#14532D" }}>
        Get calls when the app is closed
      </Text>
      <Text
        style={{
          fontSize: 12.5,
          color: "#166534",
          marginTop: 4,
          marginBottom: 10,
          lineHeight: 18,
        }}
      >
        Allow these once so your counselor's call rings like a phone call, even
        on the lock screen.
      </Text>
      {STEPS.map((s) => (
        <PressableScale
          key={s.label}
          onPress={s.run}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            backgroundColor: "#FFFFFF",
            borderRadius: 12,
            padding: 11,
            marginBottom: 8,
          }}
        >
          <Ionicons name={s.icon} size={18} color="#16A34A" />
          <Text
            style={{
              flex: 1,
              fontSize: 13,
              fontWeight: "700",
              color: "#0F172A",
            }}
          >
            {s.label}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
        </PressableScale>
      ))}
      <PressableScale
        haptic
        onPress={() => {
          markCallSetupDone();
          setShow(false);
        }}
        style={{
          alignSelf: "flex-end",
          paddingVertical: 6,
          paddingHorizontal: 4,
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: "800", color: "#15803D" }}>
          Done
        </Text>
      </PressableScale>
    </View>
  );
}
