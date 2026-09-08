import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { POST_CAMPUS_MODULES } from "../../../components/client/postUni";
import { styles } from "../../../styles/(client)/programs/postCampo";

export default function PostCampusScreen() {
  const router = useRouter();

  const handleBookAppointment = () => {
    router.push("/appointment");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.maxContainer}>
        {/* Top Header Navigation */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("/programs")}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Post-Campus Pathways</Text>

          <View style={styles.headerRightSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Banner Intro Card */}
          <View style={styles.introCard}>
            <Text style={styles.bannerTitle}>
              NextStep Post-Campus Advancement
            </Text>
            <Text style={styles.introText}>
              Navigating life after graduation—from career launching and higher
              education to financial independence.
            </Text>
          </View>

          {/* Post-Campus Modules */}
          {POST_CAMPUS_MODULES.map((module) => (
            <View key={module.id} style={styles.card}>
              <Image
                source={module.image}
                style={styles.cardImage}
                resizeMode="cover"
              />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{module.title}</Text>
                <Text style={styles.cardSubtitle}>{module.subtitle}</Text>

                <View style={styles.pointsContainer}>
                  {module.points.map((pt, idx) => (
                    <View key={idx} style={styles.pointRow}>
                      <Text style={styles.bulletPoint}>•</Text>
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

          {/* Action Button */}
          <TouchableOpacity
            style={styles.bookButton}
            onPress={handleBookAppointment}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar" size={20} color="#FFFFFF" />
            <Text style={styles.bookButtonText}>Book Appointment</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
