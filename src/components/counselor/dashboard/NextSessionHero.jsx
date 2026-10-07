import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { cd } from "../../../styles/(counselor)/dashboardUi";
import PressableScale from "../../client/appointments/PressableScale";
import { formatWhen, isSoon, relativeLabel } from "../../client/home/time";
import { clientNameOf, clientOf, getAction } from "./sessionAction";

function PulseDot() {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(
      withRepeat(
        withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) }),
        -1,
        false,
      ),
    );
  }, [t]);
  const ring = useAnimatedStyle(() => ({
    opacity: interpolate(t.get(), [0, 1], [0.7, 0]),
    transform: [{ scale: interpolate(t.get(), [0, 1], [1, 2.6]) }],
  }));
  return (
    <View style={cd.pulseWrap}>
      <Animated.View style={[cd.pulseRing, ring]} />
      <View style={cd.pulseDot} />
    </View>
  );
}

export default function NextSessionHero({
  session,
  now,
  onPrimary,
  onDetails,
}) {
  const soon = isSoon(session.scheduled_start_time, now);
  const action = getAction(session);
  const phone = session.session_mode === "phone";
  const county = clientOf(session)?.county;

  return (
    <Animated.View entering={FadeInDown.delay(120).duration(500)}>
      <LinearGradient
        colors={["#1E3A8A", "#1D4ED8", "#2563EB"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={cd.hero}
      >
        <View style={cd.heroDecorA} />
        <View style={cd.heroDecorB} />

        <View style={cd.heroTop}>
          <View style={cd.heroChip}>
            {soon && <PulseDot />}
            <Text style={cd.heroChipText}>NEXT SESSION</Text>
          </View>
          <Text style={cd.heroRel}>
            {relativeLabel(session.scheduled_start_time, now)}
          </Text>
        </View>

        <Text style={cd.heroName} numberOfLines={1}>
          {clientNameOf(session)}
        </Text>

        <View style={cd.heroMeta}>
          <View style={cd.heroPill}>
            <Ionicons name="time-outline" size={13} color="#FFFFFF" />
            <Text style={cd.heroPillText}>
              {formatWhen(session.scheduled_start_time)}
            </Text>
          </View>
          <View style={cd.heroPill}>
            <Ionicons name="hourglass-outline" size={13} color="#FFFFFF" />
            <Text style={cd.heroPillText}>
              {session.duration_minutes || 50} min
            </Text>
          </View>
          <View style={cd.heroPill}>
            <Ionicons
              name={phone ? "call-outline" : "videocam-outline"}
              size={13}
              color="#FFFFFF"
            />
            <Text style={cd.heroPillText}>{phone ? "Phone" : "Online"}</Text>
          </View>
          {!!county && (
            <View style={cd.heroPill}>
              <Ionicons name="location-outline" size={13} color="#FFFFFF" />
              <Text style={cd.heroPillText}>{county}</Text>
            </View>
          )}
        </View>

        <View style={cd.heroActions}>
          <PressableScale
            haptic
            containerStyle={{ flexGrow: 1 }}
            style={[cd.heroBtn, cd.heroBtnPrimary]}
            onPress={onPrimary}
          >
            <Ionicons name={action.icon} size={16} color="#1E3A8A" />
            <Text style={[cd.heroBtnText, { color: "#1E3A8A" }]}>
              {action.label}
            </Text>
          </PressableScale>
          <PressableScale
            haptic
            containerStyle={{ flexGrow: 1 }}
            style={[cd.heroBtn, cd.heroBtnGhost]}
            onPress={onDetails}
          >
            <Ionicons name="document-text-outline" size={16} color="#FFFFFF" />
            <Text style={cd.heroBtnText}>Details</Text>
          </PressableScale>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}
