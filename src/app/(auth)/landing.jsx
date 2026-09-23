import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, { FadeInDown, SlideInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AuroraBlobs from "../../components/landing/AuroraBlobs";
import HeroIllustration, {
  HERO_BASE_HEIGHT,
  HERO_BASE_WIDTH,
} from "../../components/landing/Heroillustration";
import Marquee from "../../components/landing/Marquee";
import RotatingText from "../../components/landing/Rotatingtext";
import ShimmerButton from "../../components/landing/Shimmerbutton";

const ROTATING_TOPICS = [
  "choosing a course",
  "your KUCCPS application",
  "settling into campus",
  "landing your first job",
  "changing careers",
  "finding your purpose",
];

const HIGHLIGHTS = [
  { icon: "school-outline", label: "Pre-Campus" },
  { icon: "compass-outline", label: "Career Guidance" },
  { icon: "briefcase-outline", label: "Post-Campus" },
  { icon: "videocam-outline", label: "Private video sessions" },
  { icon: "shield-checkmark-outline", label: "Verified mentors" },
  { icon: "lock-closed-outline", label: "Confidential" },
];

const TITLE_LINES = [
  ["Step", "Confidently", "Into"],
  ["Your", "Next", "Chapter"],
];

// One orchestrated page-load moment: the headline arrives word by word.
function AnimatedTitle({ fontSize }) {
  let wordIndex = 0;
  return (
    <View style={{ alignItems: "center" }}>
      {TITLE_LINES.map((line, lineIdx) => (
        <View key={lineIdx} style={styles.titleLine}>
          {line.map((word) => {
            const delay = 450 + wordIndex++ * 90;
            return (
              <Animated.Text
                key={`${lineIdx}-${word}`}
                entering={FadeInDown.delay(delay)
                  .duration(550)
                  .springify()
                  .damping(16)}
                style={[
                  styles.title,
                  { fontSize, lineHeight: fontSize * 1.22 },
                ]}
              >
                {word}
              </Animated.Text>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export default function Landing() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  // Responsive sizing: phones, small phones, tablets.
  const isTablet = Math.min(width, height) >= 600;
  const topHeight = Math.min(height * (isTablet ? 0.4 : 0.44), 460);
  const availableHeroHeight = topHeight - insets.top - 16 - 30 - 8;
  const heroScale = Math.min(
    1.9,
    Math.max(
      0.75,
      Math.min(
        (width * 0.6) / HERO_BASE_WIDTH,
        availableHeroHeight / HERO_BASE_HEIGHT,
      ),
    ),
  );
  const titleSize = isTablet ? 36 : width < 360 ? 22 : 26;
  const contentMaxWidth = 520;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#FF7A45", "#F05A2B", "#E14B1F"]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <AuroraBlobs width={width} height={height} />

      {/* Top: brand + interactive illustration */}
      <View
        style={[
          styles.topSection,
          { height: topHeight, paddingTop: insets.top + 16 },
        ]}
      >
        <Animated.Text
          entering={FadeInDown.duration(600)}
          style={[styles.brand, isTablet && { fontSize: 26 }]}
        >
          NextStep Hub
        </Animated.Text>

        <HeroIllustration scale={heroScale} />
      </View>

      {/* Bottom sheet slides up */}
      <Animated.View
        entering={SlideInDown.duration(750).springify().damping(20)}
        style={styles.bottomSheet}
      >
        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.sheetContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 8 },
          ]}
        >
          <View style={[styles.column, { maxWidth: contentMaxWidth }]}>
            <View style={styles.headlineBlock}>
              <AnimatedTitle fontSize={titleSize} />

              <Animated.View
                entering={FadeInDown.delay(900).duration(500)}
                style={styles.rotatingBlock}
              >
                <Text style={styles.subtitle}>Get guidance on</Text>
                <RotatingText
                  words={ROTATING_TOPICS}
                  lineHeight={isTablet ? 32 : 26}
                  style={[styles.rotating, isTablet && { fontSize: 20 }]}
                />
                <Text style={styles.subtitleSmall}>
                  Trusted mentors who have walked in your shoes, ready to help
                  you at every transition.
                </Text>
              </Animated.View>
            </View>

            <Animated.View entering={FadeInDown.delay(1050).duration(500)}>
              <Marquee>
                {HIGHLIGHTS.map((item) => (
                  <View key={item.label} style={styles.chip}>
                    <Ionicons name={item.icon} size={14} color="#F05A2B" />
                    <Text style={styles.chipText}>{item.label}</Text>
                  </View>
                ))}
              </Marquee>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(1150).duration(500)}
              style={styles.buttonWrapper}
            >
              <ShimmerButton
                label="Create an account"
                onPress={() => router.push("/(auth)/signup")}
              />
              <ShimmerButton
                variant="secondary"
                label="Log in"
                onPress={() => router.push("/(auth)/login")}
              />
            </Animated.View>

            <Animated.Text
              entering={FadeInDown.delay(1250).duration(500)}
              style={styles.legalText}
            >
              By continuing, you agree to NextStep Hub,{"\n"}
              <Text style={styles.legalLink}>Terms of service</Text> and{" "}
              <Text style={styles.legalLink}>Privacy Policy</Text>
            </Animated.Text>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F05A2B" },

  topSection: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 0,
  },
  brand: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },

  bottomSheet: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    overflow: "hidden",
  },
  sheetContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  column: {
    width: "100%",
    gap: 20,
    alignItems: "center",
  },

  headlineBlock: { alignItems: "center", gap: 12 },
  titleLine: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    columnGap: 7,
  },
  title: {
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
  },

  rotatingBlock: { alignItems: "center", alignSelf: "stretch", gap: 2 },
  subtitle: { fontSize: 14, color: "#64748B", fontWeight: "500" },
  rotating: { fontSize: 18, fontWeight: "800", color: "#F05A2B" },
  subtitleSmall: {
    marginTop: 8,
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 19,
    paddingHorizontal: 8,
  },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: "#FFF3EE",
    borderWidth: 1,
    borderColor: "#FFD9CB",
  },
  chipText: { fontSize: 12, fontWeight: "600", color: "#9A3412" },

  buttonWrapper: { width: "100%", gap: 12 },

  legalText: {
    fontSize: 11,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 16,
  },
  legalLink: { fontWeight: "700", color: "#475569" },
});
