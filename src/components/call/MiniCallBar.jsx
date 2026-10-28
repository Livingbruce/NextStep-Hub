import { Ionicons } from "@expo/vector-icons";
import { useRef } from "react";
import {
  Animated,
  PanResponder,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { RtcTextureView } from "react-native-agora";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCall, useCallTimer } from "../../context/CallContext";
import { cs } from "../../styles/call";
import { initials } from "./CallModal";

const W = 124,
  H = 176,
  M = 12;

export default function MiniCallBar() {
  const {
    session,
    expanded,
    status,
    remoteUid,
    remoteVideoOn,
    muted,
    startedAt,
    expand,
    toggleMute,
  } = useCall();
  const timer = useCallTimer(startedAt);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const pos = useRef({ x: width - W - M, y: insets.top + 64 });
  const start = useRef(pos.current);
  const pan = useRef(new Animated.ValueXY(pos.current)).current;

  const responder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, g) =>
        Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5,
      onPanResponderGrant: () => {
        start.current = { ...pos.current };
      },
      onPanResponderMove: (_, g) =>
        pan.setValue({ x: start.current.x + g.dx, y: start.current.y + g.dy }),
      onPanResponderRelease: (_, g) => {
        // snap to the nearest horizontal edge, clamp vertically
        const x =
          start.current.x + g.dx + W / 2 < width / 2 ? M : width - W - M;
        const y = Math.min(
          Math.max(start.current.y + g.dy, insets.top + 8),
          height - H - insets.bottom - 90,
        );
        pos.current = { x, y };
        Animated.spring(pan, {
          toValue: pos.current,
          useNativeDriver: false,
          friction: 8,
        }).start();
      },
    }),
  ).current;

  if (!session || expanded) return null;
  const showVideo = remoteUid != null && remoteVideoOn;
  const accent = session.role === "counselor" ? "#2563EB" : "#16A34A";

  return (
    <Animated.View
      {...responder.panHandlers}
      style={[
        cs.mini,
        { transform: pan.getTranslateTransform(), zIndex: 2000 },
      ]}
    >
      <Pressable
        style={{ flex: 1 }}
        onPress={expand}
        accessibilityLabel="Return to call"
      >
        {showVideo ? (
          <RtcTextureView style={{ flex: 1 }} canvas={{ uid: remoteUid }} />
        ) : (
          <View style={cs.miniCenter}>
            <View style={[cs.miniAvatar, { backgroundColor: accent }]}>
              <Text style={cs.miniAvatarText}>
                {initials(session.peerName)}
              </Text>
            </View>
            <Text style={cs.miniWait}>
              {status === "live" ? session.peerName.split(" ")[0] : "Waiting…"}
            </Text>
          </View>
        )}
      </Pressable>

      <View style={cs.miniTimer} pointerEvents="none">
        <View
          style={[
            cs.dot,
            { backgroundColor: status === "live" ? "#4ADE80" : "#FACC15" },
          ]}
        />
        <Text style={cs.miniTimerText}>
          {status === "live" ? timer : "Live"}
        </Text>
      </View>

      <View style={cs.miniActions}>
        <Pressable style={cs.miniBtn} onPress={toggleMute} hitSlop={6}>
          <Ionicons
            name={muted ? "mic-off" : "mic"}
            size={16}
            color="#FFFFFF"
          />
        </Pressable>
        <Pressable style={cs.miniBtn} onPress={expand} hitSlop={6}>
          <Ionicons name="expand" size={16} color="#FFFFFF" />
        </Pressable>
      </View>
    </Animated.View>
  );
}
