import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ImageBackground,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CATEGORIES } from "../../components/client/Dashboard";
import { styles } from "../../styles/(client)/Dashboard";
import { useAuth } from "../_layout";

export default function ClientDashboard() {
  const { logout } = useAuth();
  const router = useRouter();

  // State to hold pending appointments (Pass empty array [] to test empty state)
  const [appointments, setAppointments] = useState([
    {
      id: "1",
      title: "Counseling Session with Dr. Jane Doe",
      dateTime: "15th July 2024, 3:00 PM",
      status: "Confirmed",
    },
  ]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.maxContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header Banner */}
          <ImageBackground
            source={require("../../../assets/images/client/header.jpg")}
            style={styles.headerBannerImage}
            resizeMode="cover"
          >
            <View style={styles.headerOverlay}>
              <View style={styles.topRow}>
                <View style={styles.locationBadge}>
                  <Ionicons name="location-sharp" size={14} color="#FFFFFF" />
                  <Text style={styles.locationText}>Nairobi, Kenya</Text>
                </View>

                <View style={styles.headerActions}>
                  <TouchableOpacity
                    style={styles.headerIconButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="notifications" size={18} color="#FFFFFF" />
                    <View style={styles.notificationDot} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={logout}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="log-out-outline"
                      size={18}
                      color="#FFD1D1"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.welcomeContainer}>
                <Text style={styles.welcomeTitle}>Karibu Victor!</Text>
                <Text style={styles.welcomeSubtitle}>
                  You don't have to navigate life transitions alone. Share your
                  journey with verified mentors and counselors.
                </Text>
              </View>
            </View>
          </ImageBackground>

          <View style={styles.sectionContainer}>
            {/* Guidance Tracks Category Grid */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeader}>
                What guidance do you need today?
              </Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.categoryItem}
                    activeOpacity={0.7}
                    onPress={() => router.push("programs/" + item.routerPath)}
                  >
                    <View style={styles.categoryIconCircle}>
                      <Ionicons name={item.icon} size={22} color="#16A34A" />
                    </View>
                    <Text style={styles.categoryLabel} numberOfLines={2}>
                      {item.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Upcoming Events Block */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeader}>Upcoming Events</Text>
              <View style={styles.cardContainer}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.iconTag}>
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color="#16A34A"
                    />
                  </View>
                  <View style={styles.badgeTag}>
                    <Text style={styles.badgeText}>Workshop</Text>
                  </View>
                </View>

                <Text style={styles.cardTitle}>Career Transition Workshop</Text>
                <Text style={styles.cardSubText}>
                  Join us for an interactive session on navigating the job
                  market and setting professional milestones.
                </Text>

                <TouchableOpacity
                  style={styles.primaryButton}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryBtnText}>Register Now</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Appointments Block with Conditional Rendering */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeader}>Pending Appointments</Text>
                {appointments.length > 0 && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => router.push("appointment")}
                  >
                    <Text style={styles.seeAllText}>See All</Text>
                  </TouchableOpacity>
                )}
              </View>

              {appointments.length > 0 ? (
                appointments.map((apt) => (
                  <View key={apt.id} style={styles.appointmentCard}>
                    <View style={styles.appointmentIconWrapper}>
                      <Ionicons
                        name="person-outline"
                        size={24}
                        color="#0F172A"
                      />
                    </View>
                    <View style={styles.appointmentContent}>
                      <Text style={styles.cardTitle}>{apt.title}</Text>
                      <View style={styles.timeRow}>
                        <Ionicons
                          name="time-outline"
                          size={14}
                          color="#64748B"
                        />
                        <Text style={styles.timeText}>{apt.dateTime}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.secondaryButton}
                        activeOpacity={0.8}
                        onPress={() => router.push("appointment")}
                      >
                        <Text style={styles.secondaryBtnText}>
                          View Session Details
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                /* Empty Appointments Fallback */
                <View style={styles.emptyStateCard}>
                  <View style={styles.emptyIconCircle}>
                    <Ionicons
                      name="calendar-clear-outline"
                      size={28}
                      color="#64748B"
                    />
                  </View>
                  <Text style={styles.emptyTitle}>
                    No Upcoming Appointments
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    Connect with a mentor or counselor to help guide your next
                    step.
                  </Text>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={18}
                      color="#FFFFFF"
                    />
                    <Text style={styles.primaryBtnText}>Book a Session</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
