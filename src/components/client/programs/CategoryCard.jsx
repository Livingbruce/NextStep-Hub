import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import Animated, {
  FadeInDown,
  LinearTransition,
} from "react-native-reanimated";
import { pg } from "../../../styles/(client)/programsUi";
import PressableScale from "../appointments/PressableScale";

const TINTS = {
  career: ["#DCFCE7", "#16A34A"],
  preCampus: ["#DBEAFE", "#2563EB"],
  postCampus: ["#FEF3C7", "#D97706"],
};

export default function CategoryCard({
  item,
  modules,
  index = 0,
  onPress,
  style,
}) {
  const [bg, fg] = TINTS[item.id] || ["#F1F5F9", "#475569"];

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 6) * 70)
        .duration(400)
        .springify()
        .damping(18)}
      layout={LinearTransition.duration(260)}
      style={style}
    >
      <PressableScale
        scaleTo={0.985}
        haptic
        onPress={onPress}
        accessibilityLabel={`Explore ${item.title}`}
        style={pg.catCard}
      >
        <View style={pg.catTop}>
          <View style={[pg.catIcon, { backgroundColor: bg }]}>
            <Ionicons name={item.icon} size={24} color={fg} />
          </View>
          <Text style={pg.catTitle} numberOfLines={1}>
            {item.title}
          </Text>
          {!!modules && (
            <View style={pg.catCount}>
              <Text style={pg.catCountText}>{modules} topics</Text>
            </View>
          )}
        </View>

        <Text style={pg.catDesc}>{item.description}</Text>

        <View style={pg.catCta}>
          <Text style={pg.catCtaText}>Explore</Text>
          <Ionicons name="arrow-forward" size={16} color="#936D9A" />
        </View>
      </PressableScale>
    </Animated.View>
  );
}
