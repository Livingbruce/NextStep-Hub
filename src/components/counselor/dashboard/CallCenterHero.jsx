import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { cc } from "../../../styles/(counselor)/callCenter";
import { joinState } from "../../call/callWindow";
import PressableScale from "../../client/appointments/PressableScale";
import { formatWhen, relativeLabel } from "../../client/home/time";
import { clientNameOf, clientOf, phoneOf } from "./sessionAction";

function Btn({ primary, icon, label, onPress, disabled, busy }) {
  return (
    <PressableScale
      haptic
      disabled={disabled || busy}
      containerStyle={{ flexGrow: primary ? 1.6 : 1 }}
      style={[
        cc.btn,
        primary ? cc.btnPrimary : cc.btnGhost,
        disabled && cc.btnOff,
      ]}
      onPress={onPress}
    >
      {busy ? (
        <ActivityIndicator
          size="small"
          color={primary ? "#1E3A8A" : "#FFFFFF"}
        />
      ) : (
        <>
          <Ionicons
            name={icon}
            size={17}
            color={primary ? "#1E3A8A" : "#FFFFFF"}
          />
          <Text
            style={[cc.btnText, { color: primary ? "#1E3A8A" : "#FFFFFF" }]}
          >
            {label}
          </Text>
        </>
      )}
    </PressableScale>
  );
}

export default function CallCenterHero({
  session,
  now,
  isActive,
  busy,
  onVideo,
  onAudio,
  onDial,
  onReturn,
  onDetails,
}) {
  const win = joinState(session, now);
  const phone = session.session_mode === "phone";
  const open = win.state === "open";
  const client = clientOf(session);
  const reasons = (session.reasons || []).slice(0, 3);

  return (
    <Animated.View entering={FadeInDown.delay(100).duration(450)}>
      <LinearGradient
        colors={["#1E3A8A", "#1D4ED8", "#2563EB"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={cc.hero}
      >
        <View style={cc.heroTop}>
          <View style={[cc.chip, (open || isActive) && cc.chipReady]}>
            <Ionicons
              name={
                isActive ? "radio" : open ? "checkmark-circle" : "time-outline"
              }
              size={13}
              color="#FFFFFF"
            />
            <Text style={cc.chipText}>
              {isActive
                ? "LIVE NOW"
                : open
                  ? "READY TO START"
                  : win.label.toUpperCase()}
            </Text>
          </View>
          <Text style={cc.heroRel}>
            {relativeLabel(session.scheduled_start_time, now)}
          </Text>
        </View>

        <Text style={cc.heroName} numberOfLines={1}>
          {clientNameOf(session)}
        </Text>
        <Text style={cc.heroType}>{session.counseling_type} session</Text>

        <View style={cc.pills}>
          <View style={cc.pill}>
            <Ionicons name="time-outline" size={13} color="#FFFFFF" />
            <Text style={cc.pillText}>
              {formatWhen(session.scheduled_start_time)}
            </Text>
          </View>
          <View style={cc.pill}>
            <Ionicons name="hourglass-outline" size={13} color="#FFFFFF" />
            <Text style={cc.pillText}>
              {session.duration_minutes || 50} min
            </Text>
          </View>
          <View style={cc.pill}>
            <Ionicons
              name={phone ? "call-outline" : "videocam-outline"}
              size={13}
              color="#FFFFFF"
            />
            <Text style={cc.pillText}>{phone ? "Phone" : "Video"}</Text>
          </View>
          {!!client?.county && (
            <View style={cc.pill}>
              <Ionicons name="location-outline" size={13} color="#FFFFFF" />
              <Text style={cc.pillText}>{client.county}</Text>
            </View>
          )}
        </View>

        {(reasons.length > 0 || !!session.session_goals) && (
          <View style={cc.intake}>
            <Text style={cc.intakeHead}>Client intake</Text>
            {reasons.length > 0 && (
              <View style={cc.tags}>
                {reasons.map((r) => (
                  <View key={r} style={cc.tag}>
                    <Text style={cc.tagText}>{r}</Text>
                  </View>
                ))}
              </View>
            )}
            {!!session.session_goals && (
              <Text style={cc.goal} numberOfLines={2}>
                “{session.session_goals}”
              </Text>
            )}
          </View>
        )}

        <View style={cc.actions}>
          {isActive ? (
            <Btn
              primary
              icon="radio"
              label="Return to session"
              onPress={onReturn}
            />
          ) : phone ? (
            <>
              <Btn
                primary
                icon="call"
                label={open ? "Call client" : win.label}
                disabled={!open}
                onPress={() => onDial(phoneOf(session))}
              />
              <Btn
                icon="mic"
                label="In app"
                disabled={!open}
                busy={busy}
                onPress={onAudio}
              />
            </>
          ) : (
            <>
              <Btn
                primary
                icon="videocam"
                label={open ? "Start video session" : win.label}
                disabled={!open}
                busy={busy}
                onPress={onVideo}
              />
              <Btn
                icon="mic"
                label="Audio"
                disabled={!open}
                busy={busy}
                onPress={onAudio}
              />
            </>
          )}
          <PressableScale
            haptic
            style={[cc.btn, cc.btnGhost, { paddingHorizontal: 13 }]}
            onPress={onDetails}
            accessibilityLabel="Details"
          >
            <Ionicons name="document-text-outline" size={17} color="#FFFFFF" />
          </PressableScale>
        </View>
        {!open && !isActive && (
          <Text style={cc.windowNote}>
            You can start 15 minutes before the scheduled time.
          </Text>
        )}
      </LinearGradient>
    </Animated.View>
  );
}
