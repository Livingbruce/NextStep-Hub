import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { RtcTextureView } from "react-native-agora";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCall } from "../../context/CallContext";

const GAP = 8;
const HOST_UID = 1;
const COLORS = [
  "#2563EB",
  "#16A34A",
  "#9333EA",
  "#EA580C",
  "#DB2777",
  "#0D9488",
  "#CA8A04",
];
const RANK = { host: 0, panelist: 1, speaker: 2 };
const LABEL = { host: "Host", panelist: "Invigilator", speaker: "Speaker" };

const initialsOf = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("") || "•";

export default function ProgramStage() {
  const insets = useSafeAreaInsets();
  const {
    session,
    uids,
    roster,
    roles,
    remoteVideo,
    remoteAudio,
    speaking,
    localUid,
    canPublish,
    muted,
    cameraOn,
    status,
  } = useCall();
  const [box, setBox] = useState({ w: 0, h: 0 });

  const iAmHost = session?.role === "counselor";

  const tiles = useMemo(() => {
    const ids = new Set(uids);
    if (!iAmHost) ids.add(HOST_UID);

    const list = [...ids].map((uid) => ({
      key: `r${uid}`,
      uid,
      local: false,
      name: roster[uid] || "Participant",
      role: roles[uid] || "speaker",
      video: !!remoteVideo[uid],
      audio: !!remoteAudio[uid],
      speaking: !!speaking[uid],
    }));

    if (canPublish && localUid != null) {
      list.push({
        key: "me",
        uid: localUid,
        local: true,
        name: "You",
        role: iAmHost
          ? "host"
          : session?.selfRole === "panelist"
            ? "panelist"
            : "speaker",
        video: cameraOn,
        audio: !muted,
        speaking: !!speaking[localUid],
      });
    }
    return list.sort((a, b) => (RANK[a.role] ?? 2) - (RANK[b.role] ?? 2));
  }, [
    uids,
    roster,
    roles,
    remoteVideo,
    remoteAudio,
    speaking,
    localUid,
    canPublish,
    cameraOn,
    muted,
    iAmHost,
    session?.selfRole,
  ]);

  const topPad = insets.top + 76;
  const bottomPad = 150;
  const w = box.w;
  const h = Math.max(0, box.h - topPad - bottomPad);

  const n = Math.max(1, tiles.length);
  const wide = w >= 600;
  const cols =
    n <= 1 ? 1 : wide ? (n <= 4 ? 2 : n <= 9 ? 3 : 4) : n <= 2 ? 1 : 2;
  const rows = Math.ceil(n / cols);
  const tileW = w ? (w - 16 - GAP * (cols - 1)) / cols : 0;
  const tileH = Math.max(wide ? 150 : 120, (h - GAP * (rows - 1)) / rows);

  return (
    <View
      style={StyleSheet.absoluteFill}
      onLayout={(e) => setBox(e.nativeEvent.layout)}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: topPad,
          paddingBottom: bottomPad,
          paddingHorizontal: 8,
          flexDirection: "row",
          flexWrap: "wrap",
          gap: GAP,
          alignContent: "flex-start",
        }}
        showsVerticalScrollIndicator={false}
      >
        {tileW > 0 &&
          tiles.map((t) => (
            <View
              key={t.key}
              style={[
                s.tile,
                { width: tileW, height: tileH },
                t.speaking && s.speaking,
              ]}
            >
              {t.video ? (
                <RtcTextureView
                  style={StyleSheet.absoluteFill}
                  canvas={{ uid: t.local ? 0 : t.uid }}
                />
              ) : (
                <View style={s.center}>
                  <View
                    style={[
                      s.avatar,
                      { backgroundColor: COLORS[t.uid % COLORS.length] },
                    ]}
                  >
                    <Text style={s.avatarText}>{initialsOf(t.name)}</Text>
                  </View>
                </View>
              )}

              {!t.audio && (
                <View style={s.micOff}>
                  <Ionicons name="mic-off" size={13} color="#FFFFFF" />
                </View>
              )}

              <View style={s.nameTag}>
                <Text style={s.nameText} numberOfLines={1}>
                  {t.name}
                  {t.role !== "speaker" || t.local ? ` · ${LABEL[t.role]}` : ""}
                </Text>
              </View>
            </View>
          ))}
      </ScrollView>

      {!canPublish && status !== "idle" && (
        <View style={[s.hint, { bottom: 128 }]} pointerEvents="none">
          <Text style={s.hintText}>
            You're viewing. The host can invite you to speak.
          </Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  tile: {
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#1E293B",
    borderWidth: 2,
    borderColor: "transparent",
  },
  speaking: { borderColor: "#3B82F6" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 22, fontWeight: "800", color: "#FFFFFF" },
  micOff: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(15,23,42,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  nameTag: {
    position: "absolute",
    left: 8,
    bottom: 8,
    maxWidth: "85%",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  nameText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  hint: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  hintText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: "600",
  },
});
