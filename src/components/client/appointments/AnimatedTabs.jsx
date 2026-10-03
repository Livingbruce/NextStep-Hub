import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { styles } from "../../../styles/(client)/appointments/index";
import { ui } from "../../../styles/(client)/appointments/ui";

const PAD = 4;

export default function AnimatedTabs({ tabs, active, onChange }) {
  const [width, setWidth] = useState(0);
  const index = Math.max(
    0,
    tabs.findIndex((t) => t.key === active),
  );
  const segment = width ? (width - PAD * 2) / tabs.length : 0;
  const x = useSharedValue(0);

  useEffect(() => {
    x.set(withSpring(index * segment, { damping: 18, stiffness: 220 }));
  }, [index, segment, x]);

  const indicator = useAnimatedStyle(() => ({
    width: segment,
    transform: [{ translateX: x.get() }],
  }));

  return (
    <View
      style={styles.tabContainer}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessibilityRole="tablist"
    >
      {segment > 0 && <Animated.View style={[ui.tabIndicator, indicator]} />}

      {tabs.map((tab) => {
        const selected = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            style={ui.tabHit}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => {
              if (selected) return;
              Haptics.selectionAsync().catch(() => {});
              onChange(tab.key);
            }}
          >
            <Text style={[styles.tabText, selected && styles.activeTabText]}>
              {tab.label}
            </Text>
            <View style={[ui.tabCount, selected && ui.tabCountActive]}>
              <Text
                style={[ui.tabCountText, selected && ui.tabCountTextActive]}
              >
                {tab.count}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
