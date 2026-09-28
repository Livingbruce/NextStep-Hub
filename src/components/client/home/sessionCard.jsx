import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { styles } from "../../../styles/(client)/Dashboard";
import { formatWhen, statusMeta } from "./time";

export default function SessionCard({ apt, index = 0, onPress }) {
  const meta = statusMeta(apt.status);
  const press = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: press.get() }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 70).duration(450)}
      style={style}
    >
      <Pressable
        onPressIn={() => press.set(withSpring(0.98))}
        onPressOut={() => press.set(withSpring(1))}
        onPress={onPress}
        accessibilityRole="button"
        style={styles.appointmentCard}
      >
        <View style={styles.appointmentIconWrapper}>
          <Ionicons name="person-outline" size={22} color="#0F172A" />
        </View>
        <View style={styles.appointmentContent}>
          <View style={styles.appointmentTop}>
            <Text style={[styles.cardTitle, { flex: 1 }]} numberOfLines={2}>
              {apt.title}
            </Text>
            <View style={[styles.badgeTag, { backgroundColor: meta.bg }]}>
              <Text style={[styles.badgeText, { color: meta.text }]}>
                {meta.label}
              </Text>
            </View>
          </View>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={14} color="#64748B" />
            <Text style={styles.timeText}>{formatWhen(apt.dateTime)}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
      </Pressable>
    </Animated.View>
  );
}
