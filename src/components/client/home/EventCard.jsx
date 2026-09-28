import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Pressable, Text, View } from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { styles } from "../../../styles/(client)/Dashboard";
import { formatWhen } from "./time";

const LOCATION = {
  virtual: {
    icon: "videocam-outline",
    label: "Online",
    action: "Join meeting",
    actionIcon: "videocam",
    color: "#0284C7",
  },
  phone: {
    icon: "call-outline",
    label: "By phone",
    action: "Join call",
    actionIcon: "call",
    color: "#2563EB",
  },
  physical: {
    icon: "location-outline",
    label: "In person",
    action: "View venue",
    actionIcon: "location",
    color: "#475569",
  },
};

export default function EventCard({
  program,
  registered,
  index = 0,
  cardStyle,
  onRegister,
  onOpenLocation,
}) {
  const loc = LOCATION[program.location_type] || LOCATION.physical;
  const date = new Date(program.starts_at);
  const press = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: press.get() }],
  }));

  const fee = program.is_paid
    ? `${program.currency || "KES"} ${Number(program.amount).toLocaleString()}`
    : "Free";

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 90).duration(500)}
      style={[cardStyle, anim]}
    >
      <Pressable
        onPressIn={() => press.set(withSpring(0.985))}
        onPressOut={() => press.set(withSpring(1))}
        style={styles.cardContainer}
        accessibilityRole="summary"
      >
        <View style={styles.eventHeaderRow}>
          <View style={styles.dateBlock}>
            <Text style={styles.dateDay}>{date.getDate()}</Text>
            <Text style={styles.dateMonth}>
              {date.toLocaleString("en-US", { month: "short" }).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.badgeTag}>
              <Text style={styles.badgeText} numberOfLines={1}>
                {program.category || "Event"}
              </Text>
            </View>
            <Text
              style={[styles.cardTitle, { marginTop: 6 }]}
              numberOfLines={2}
            >
              {program.title}
            </Text>
          </View>
        </View>

        {!!program.description && (
          <Text style={styles.cardSubText} numberOfLines={2}>
            {program.description}
          </Text>
        )}

        <View style={styles.metaWrap}>
          <View style={styles.metaPill}>
            <Ionicons name="time-outline" size={13} color="#64748B" />
            <Text style={styles.metaPillText}>
              {formatWhen(program.starts_at)}
            </Text>
          </View>
          <View style={styles.metaPill}>
            <Ionicons name={loc.icon} size={13} color="#64748B" />
            <Text style={styles.metaPillText}>{loc.label}</Text>
          </View>
          <View
            style={[
              styles.metaPill,
              program.is_paid ? styles.metaPaid : styles.metaFree,
            ]}
          >
            <Text
              style={[
                styles.metaPillText,
                {
                  color: program.is_paid ? "#B45309" : "#15803D",
                  fontWeight: "800",
                },
              ]}
            >
              {fee}
            </Text>
          </View>
        </View>

        {registered ? (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
                () => {},
              );
              onOpenLocation?.();
            }}
            style={[styles.primaryButton, { backgroundColor: loc.color }]}
            accessibilityRole="button"
          >
            <Ionicons name={loc.actionIcon} size={16} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>{loc.action}</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
                () => {},
              );
              onRegister?.();
            }}
            style={styles.primaryButton}
            accessibilityRole="button"
          >
            <Text style={styles.primaryBtnText}>Register now</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </Pressable>
        )}
      </Pressable>
    </Animated.View>
  );
}
