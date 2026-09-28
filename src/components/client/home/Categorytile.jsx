import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Pressable, Text } from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { styles } from "../../../styles/(client)/Dashboard";

const TINTS = [
  ["#DCFCE7", "#16A34A"],
  ["#DBEAFE", "#2563EB"],
  ["#FEF3C7", "#D97706"],
  ["#FCE7F3", "#DB2777"],
  ["#EDE9FE", "#7C3AED"],
  ["#CCFBF1", "#0D9488"],
  ["#FFEDD5", "#EA580C"],
  ["#E0F2FE", "#0284C7"],
];

export default function CategoryTile({
  item,
  index,
  onPress,
  iconSize = 24,
  circle = 58,
  tileWidth,
}) {
  const [bg, fg] = TINTS[index % TINTS.length];
  const press = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: press.get() }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(350 + index * 45)
        .springify()
        .damping(14)}
      style={[styles.categoryItem, tileWidth ? { width: tileWidth } : null]}
    >
      <Pressable
        onPressIn={() =>
          press.set(withSpring(0.88, { damping: 14, stiffness: 320 }))
        }
        onPressOut={() =>
          press.set(withSpring(1, { damping: 10, stiffness: 240 }))
        }
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
          onPress?.();
        }}
        accessibilityRole="button"
        accessibilityLabel={item.title}
        style={styles.categoryPress}
      >
        <Animated.View
          style={[
            styles.categoryIconCircle,
            {
              width: circle,
              height: circle,
              borderRadius: circle / 2,
              backgroundColor: bg,
            },
            style,
          ]}
        >
          <Ionicons name={item.icon} size={iconSize} color={fg} />
        </Animated.View>
        <Text style={styles.categoryLabel} numberOfLines={2}>
          {item.title}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
