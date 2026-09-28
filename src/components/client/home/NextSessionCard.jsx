import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { styles } from "../../../styles/(client)/Dashboard";
import { formatWhen, isSoon, relativeLabel } from "./time";

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
    <View style={styles.pulseWrap}>
      <Animated.View style={[styles.pulseRing, ring]} />
      <View style={styles.pulseDot} />
    </View>
  );
}

function HeroButton({ label, icon, primary, onPress }) {
  const press = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: press.get() }],
  }));
  return (
    <Animated.View style={[{ flexGrow: 1 }, style]}>
      <Pressable
        onPressIn={() => press.set(withSpring(0.95))}
        onPressOut={() => press.set(withSpring(1))}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
            () => {},
          );
          onPress?.();
        }}
        accessibilityRole="button"
        style={[
          styles.heroBtn,
          primary ? styles.heroBtnPrimary : styles.heroBtnGhost,
        ]}
      >
        <Ionicons
          name={icon}
          size={16}
          color={primary ? "#15803D" : "#FFFFFF"}
        />
        <Text style={[styles.heroBtnText, primary && { color: "#15803D" }]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export default function NextSessionCard({ session, now, onJoin, onDetails }) {
  const soon = isSoon(session.dateTime, now);
  return (
    <Animated.View entering={FadeInDown.delay(250).duration(550)}>
      <LinearGradient
        colors={["#22C55E", "#16A34A", "#15803D"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroDecorA} />
        <View style={styles.heroDecorB} />

        <View style={styles.heroTopRow}>
          <View style={styles.heroChip}>
            {soon && <PulseDot />}
            <Text style={styles.heroChipText}>NEXT SESSION</Text>
          </View>
          <Text style={styles.heroRelative}>
            {relativeLabel(session.dateTime, now)}
          </Text>
        </View>

        <Text style={styles.heroTitle} numberOfLines={2}>
          {session.counselorName
            ? `Session with ${session.counselorName}`
            : `${session.type || "Counseling"} session`}
        </Text>

        <View style={styles.heroTimeRow}>
          <Ionicons
            name="time-outline"
            size={15}
            color="rgba(255,255,255,0.9)"
          />
          <Text style={styles.heroTime}>{formatWhen(session.dateTime)}</Text>
        </View>

        <View style={styles.heroActions}>
          {session.link ? (
            <HeroButton
              primary
              icon="videocam"
              label="Join session"
              onPress={onJoin}
            />
          ) : null}
          <HeroButton
            icon="document-text-outline"
            label="Details"
            onPress={onDetails}
          />
        </View>
      </LinearGradient>
    </Animated.View>
  );
}
