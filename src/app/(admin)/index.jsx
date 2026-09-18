import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../../styles/(admin)/home";
import { useAuth } from "../_layout";

const SHORTCUTS = [
  {
    id: "appointments",
    title: "Appointments",
    icon: "calendar",
    bgColor: "#EFF6FF",
    iconColor: "#2563EB",
    route: "/(admin)/appointments",
  },
  {
    id: "programs",
    title: "Programs",
    icon: "briefcase",
    bgColor: "#F0FDF4",
    iconColor: "#16A34A",
    route: "/(admin)/programs",
  },
  {
    id: "staff",
    title: "Staff Management",
    icon: "people",
    bgColor: "#FAF5FF",
    iconColor: "#9333EA",
    route: "/(admin)/staff",
  },
  {
    id: "pricing",
    title: "Pricing",
    icon: "pricetag",
    bgColor: "#FFF7ED",
    iconColor: "#EA580C",
    route: "/(admin)/pricing",
  },
];

const UPCOMING_EVENTS = [
  {
    id: "1",
    title: "Youth Mentorship Workshop",
    date: "Sep 22, 2026",
    time: "10:00 AM",
    location: "Main Hall / Online",
    category: "Mentorship",
  },
  {
    id: "2",
    title: "Career Transition Webinar",
    date: "Oct 05, 2026",
    time: "02:00 PM",
    location: "Virtual Meeting",
    category: "Career",
  },
  {
    id: "3",
    title: "Academic Stress Support Group",
    date: "Oct 18, 2026",
    time: "11:30 AM",
    location: "Room 204",
    category: "Wellness",
  },
];

const RECENT_ACTIONS = [
  {
    id: "1",
    action: "Updated Pricing Tier",
    details: "Standard Session modified to $50",
    time: "10 mins ago",
    icon: "create-outline",
  },
  {
    id: "2",
    action: "New Staff Added",
    details: "Assigned Dr. Aris to Counseling team",
    time: "1 hour ago",
    icon: "person-add-outline",
  },
  {
    id: "3",
    action: "Program Approved",
    details: "Youth Mentorship Fall 2026 published",
    time: "Yesterday",
    icon: "checkmark-circle-outline",
  },
];

export default function AdminHome() {
  const router = useRouter();
  const { logout } = useAuth();

  // Dynamic time-based greeting calculation
  const greeting = useMemo(() => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good Morning";
    if (hours < 18) return "Good Afternoon";
    return "Good Evening";
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingText}>{greeting},</Text>
            <Text style={styles.adminTitle}>Administrator</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push("/(admin)/notifications")}
            >
              <Ionicons
                name="notifications-outline"
                size={22}
                color="#0F172A"
              />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
              <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Shortcut Cards Section */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.shortcutsGrid}>
          {SHORTCUTS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.shortcutCard}
              onPress={() => router.push(item.route)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconBackground,
                  { backgroundColor: item.bgColor },
                ]}
              >
                <Ionicons name={item.icon} size={22} color={item.iconColor} />
              </View>
              <Text style={styles.shortcutTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Upcoming Events Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          <TouchableOpacity onPress={() => router.push("programs")}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          horizontal
          data={UPCOMING_EVENTS}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.eventsList}
          renderItem={({ item }) => (
            <View style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <Text style={styles.eventCategory}>{item.category}</Text>
                <View style={styles.dateBadge}>
                  <Ionicons name="time-outline" size={12} color="#475569" />
                  <Text style={styles.dateBadgeText}>{item.date}</Text>
                </View>
              </View>
              <Text style={styles.eventTitle}>{item.title}</Text>
              <View style={styles.eventFooter}>
                <Ionicons name="location-outline" size={14} color="#64748B" />
                <Text style={styles.eventLocation}>{item.location}</Text>
              </View>
            </View>
          )}
        />

        {/* Recent Actions Section */}
        <Text style={styles.sectionTitle}>Recent Actions</Text>
        <View style={styles.actionsContainer}>
          {RECENT_ACTIONS.map((item) => (
            <View key={item.id} style={styles.actionRow}>
              <View style={styles.actionIconContainer}>
                <Ionicons name={item.icon} size={20} color="#1E3A8A" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>{item.action}</Text>
                <Text style={styles.actionDetails}>{item.details}</Text>
              </View>
              <Text style={styles.actionTime}>{item.time}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
