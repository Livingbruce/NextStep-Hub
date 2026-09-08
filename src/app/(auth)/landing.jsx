import { useRouter } from "expo-router";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { height } = Dimensions.get("window");

export default function Landing() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Top Section */}
      <View style={styles.topSection}>
        {/* Decorative Squiggles/Lines in corners */}
        <View style={[styles.squiggle, styles.squiggleTopLeft]} />
        <View style={[styles.squiggle, styles.squiggleTopRight]} />

        {/* Title Header */}
        <Text style={styles.headerTitle}>Mind Ease</Text>

        {/* Center Illustration Area */}
        <View style={styles.illustrationArea}>
          {/* Main Arch Shape */}
          <View style={styles.archBackground} />

          {/* Floating Emoji/Mood Badges */}
          <View style={[styles.badge, styles.badgeYellow]}>
            <Text style={styles.emojiText}>😊</Text>
          </View>
          <View style={[styles.badge, styles.badgeGreen]}>
            <Text style={styles.emojiText}>🙂</Text>
          </View>
          <View style={[styles.badge, styles.badgePurple]}>
            <Text style={styles.emojiText}>🥺</Text>
          </View>

          {/* Cloud Overlays */}
          <View style={[styles.cloud, styles.cloudLeft]} />
          <View style={[styles.cloud, styles.cloudRight]} />

          {/* Sparkles */}
          <Text style={[styles.sparkle, { top: 30, right: 35 }]}>✦</Text>
          <Text style={[styles.sparkle, { bottom: 25, left: 35 }]}>✦</Text>
        </View>
      </View>

      {/* Bottom Sheet Card */}
      <View style={styles.bottomSheet}>
        {/* Main Content */}
        <View style={styles.contentWrapper}>
          <Text style={styles.title}>
            Step Confidently Into{"\n"}Your Next Chapter
          </Text>
          <Text style={styles.subtitle}>
            Connect with trusted mentors who have walked in your shoes and are
            ready to help you succeed at every transition.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonWrapper}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={() => router.push("/(auth)/signup")}
          >
            <Text style={styles.primaryButtonText}>Create an account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.7}
            onPress={() => router.push("/(auth)/login")}
          >
            <Text style={styles.secondaryButtonText}>Log in</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Disclaimer */}
        <Text style={styles.legalText}>
          By continuing, you agree to NextStep Hub,{"\n"}
          <Text style={styles.legalLink}>Terms of service</Text> and{" "}
          <Text style={styles.legalLink}>Privacy Policy</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F05A2B", // Main vibrant orange background
  },
  topSection: {
    height: height * 0.48,
    paddingTop: 60,
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },

  // Abstract Corner Lines
  squiggle: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#0F172A",
    borderWidth: 3,
    borderRadius: 20,
  },
  squiggleTopLeft: {
    top: 40,
    left: 20,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    transform: [{ rotate: "-15deg" }],
  },
  squiggleTopRight: {
    top: 35,
    right: 20,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    transform: [{ rotate: "30deg" }],
  },

  // Illustration Elements
  illustrationArea: {
    width: 220,
    height: 180,
    alignItems: "center",
    justifyContent: "flex-end",
    position: "relative",
    marginBottom: -1,
  },
  archBackground: {
    width: 140,
    height: 140,
    borderTopLeftRadius: 70,
    borderTopRightRadius: 70,
    backgroundColor: "#E14B1F",
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
  },
  badgeYellow: {
    backgroundColor: "#FACC15",
    top: 25,
    left: 28,
  },
  badgeGreen: {
    backgroundColor: "#86EFAC",
    right: 18,
    bottom: 55,
  },
  badgePurple: {
    backgroundColor: "#C084FC",
    bottom: 22,
    left: 65,
  },
  emojiText: {
    fontSize: 18,
  },
  cloud: {
    position: "absolute",
    backgroundColor: "#F8FAF8",
    height: 32,
    borderRadius: 16,
  },
  cloudLeft: {
    width: 75,
    bottom: 28,
    left: 0,
  },
  cloudRight: {
    width: 75,
    bottom: 18,
    right: -10,
  },
  sparkle: {
    position: "absolute",
    color: "#FFFFFF",
    fontSize: 12,
  },

  // Bottom Sheet
  bottomSheet: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: "center",
    justifyContent: "space-between",
  },
  contentWrapper: {
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
    lineHeight: 32,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 8,
  },

  // Buttons
  buttonWrapper: {
    width: "100%",
    gap: 10,
  },
  primaryButton: {
    backgroundColor: "#F05A2B",
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: "center",
    width: "100%",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "#F1F5F9",
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: "center",
    width: "100%",
  },
  secondaryButtonText: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "700",
  },

  // Footer Legal
  legalText: {
    fontSize: 10,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 14,
  },
  legalLink: {
    fontWeight: "700",
    color: "#475569",
  },
});
