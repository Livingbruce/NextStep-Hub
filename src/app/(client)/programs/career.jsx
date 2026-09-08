import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../../../styles/(client)/programs/career";

import { SECTORS } from "../../../components/client/careerSectors";

export default function CareerScreen() {
  const router = useRouter();

  const handleBookAppointment = () => {
    router.push("/appointment");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.maxContainer}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("/programs")}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Career Mentorship</Text>

          <View style={styles.headerRightSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Intro Card */}
          <View style={styles.introCard}>
            <Text style={styles.introText}>
              Comprehensive mentorship for discovery, advancement, transitions,
              and purpose-driven career growth.
            </Text>
          </View>

          {/* 7 Sectors List */}
          {SECTORS.map((sector) => (
            <View key={sector.id} style={styles.sectorCard}>
              <Image
                source={sector.image}
                style={styles.sectorImage}
                resizeMode="cover"
              />
              <View style={styles.sectorContent}>
                <Text style={styles.sectorTitle}>{sector.title}</Text>
                <Text style={styles.sectorSubtitle}>{sector.subtitle}</Text>

                <View style={styles.pointsContainer}>
                  {sector.points.map((pt, idx) => (
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

          {/* Bottom Book Appointment Button */}
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
