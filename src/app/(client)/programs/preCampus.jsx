import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PATHWAYS } from "../../../components/client/preUni";
import { styles } from "../../../styles/(client)/programs/preCampo";

export default function PreCampusScreen() {
  const router = useRouter();

  const handleBookAppointment = () => {
    router.push("/appointment");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.maxContainer}>
        {/* Fixed Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("/programs")}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>

          <Text style={styles.headerTitle} numberOfLines={1}>
            Pre-Campus Pathways
          </Text>

          <TouchableOpacity
            style={styles.headerRightAction}
            onPress={() => router.push("/notifications")}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Banner Intro Card */}
          <View style={styles.introCard}>
            <View style={styles.introBadge}>
              <Ionicons name="school" size={16} color="#15803D" />
              <Text style={styles.introBadgeText}>Transition Program</Text>
            </View>
            <Text style={styles.bannerTitle}>NextStep Pre-Campus Pathways</Text>
            <Text style={styles.introText}>
              Bridging the gap between High School and University with clarity,
              confidence, and career alignment.
            </Text>
          </View>

          {/* 8 Pre-Campus Sections */}
          {PATHWAYS.map((path) => (
            <View key={path.id} style={styles.card}>
              <View style={styles.imageWrapper}>
                <Image
                  source={path.image}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
              </View>

              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{path.title}</Text>
                <Text style={styles.cardSubtitle}>{path.subtitle}</Text>

                <View style={styles.pointsContainer}>
                  {path.points.map((pt, idx) => (
                    <View key={idx} style={styles.pointRow}>
                      <View style={styles.bulletDot} />
                      <Text style={styles.pointText}>
                        <Text style={styles.boldText}>{pt.bold}</Text>
                        {pt.text}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ))}

          {/* Bottom CTA Button */}
          <TouchableOpacity
            style={styles.bookButton}
            onPress={handleBookAppointment}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
            <Text style={styles.bookButtonText}>Book Appointment</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
