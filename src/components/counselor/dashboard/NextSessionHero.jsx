import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Alert, Linking, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { cd } from "../../../styles/(counselor)/dashboardUi";
import PressableScale from "../../client/appointments/PressableScale";
import { formatWhen, relativeLabel } from "../../client/home/time";
import { clientNameOf, clientOf, phoneOf } from "./sessionAction";

export default function NextSessionHero({ session, now, onDetails }) {
  const router = useRouter();
  const isPhone = session.session_mode === "phone";
  const county = clientOf(session)?.county;

  // Handle Agora Room Launch vs Direct Dialer
  const handleStartSession = () => {
    if (isPhone) {
      const number = phoneOf(session).replace(/[^0-9+]/g, "");
      if (!number) {
        Alert.alert("No Phone Number", "Client contact number missing.");
        return;
      }
      Linking.openURL(`tel:${number}`);
    } else {
      // Navigate to the full-screen Agora Video Call Route
      router.push({
        pathname: "/(counselor)/call/[id]",
        params: { id: session.id, channel: `session_${session.id}` },
      });
    }
  };

  return (
    <Animated.View entering={FadeInDown.delay(120).duration(500)}>
      <LinearGradient
        colors={["#0F172A", "#1E3A8A", "#2563EB"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={cd.hero}
      >
        <View style={cd.heroTop}>
          <View style={cd.heroChip}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: "#22C55E",
                marginRight: 6,
              }}
            />
            <Text style={cd.heroChipText}>READY TO LAUNCH</Text>
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
            <Ionicons
              name={isPhone ? "call-outline" : "videocam-outline"}
              size={13}
              color="#FFFFFF"
            />
            <Text style={cd.heroPillText}>
              {isPhone ? "Phone Call" : "Agora Video"}
            </Text>
          </View>
          {!!county && (
            <View style={cd.heroPill}>
              <Ionicons name="location-outline" size={13} color="#FFFFFF" />
              <Text style={cd.heroPillText}>{county}</Text>
            </View>
          )}
        </View>

        {/* Action Controls */}
        <View style={cd.heroActions}>
          <PressableScale
            haptic
            containerStyle={{ flexGrow: 1 }}
            style={[
              cd.heroBtn,
              { backgroundColor: isPhone ? "#16A34A" : "#2563EB" },
            ]}
            onPress={handleStartSession}
          >
            <Ionicons
              name={isPhone ? "call" : "videocam"}
              size={18}
              color="#FFFFFF"
            />
            <Text
              style={[cd.heroBtnText, { color: "#FFFFFF", fontWeight: "bold" }]}
            >
              {isPhone ? "Call Client Now" : "Start Live Session"}
            </Text>
          </PressableScale>

          <PressableScale
            haptic
            containerStyle={{ flexGrow: 1 }}
            style={[cd.heroBtn, cd.heroBtnGhost]}
            onPress={onDetails}
          >
            <Ionicons name="document-text-outline" size={16} color="#FFFFFF" />
            <Text style={cd.heroBtnText}>Notes & Details</Text>
          </PressableScale>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}
