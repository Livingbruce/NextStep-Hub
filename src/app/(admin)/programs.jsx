import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  FlatList,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../../styles/(admin)/programs";

// Sample Programs Data
const SAMPLE_PROGRAMS = [
  {
    id: "1",
    title: "Youth Leadership & Career Transition Summit",
    date: "2026-10-15T09:00:00",
    location: "Nairobi Innovation Hub",
    attendees: 45,
    status: "Upcoming",
  },
  {
    id: "2",
    title: "Virtual Mentorship Orientation",
    date: "2026-09-25T14:00:00",
    location: "Online (Zoom)",
    attendees: 120,
    status: "Upcoming",
  },
  {
    id: "3",
    title: "High School Career Guidance Workshop",
    date: "2026-11-02T10:00:00",
    location: "Meru Community Center",
    attendees: 80,
    status: "Upcoming",
  },
  {
    id: "4",
    title: "Accounting & Financial Literacy Seminar",
    date: "2026-08-10T11:00:00",
    location: "Meru Central Co-op Union",
    attendees: 60,
    status: "Past",
  },
  {
    id: "5",
    title: "Tech Skills & React Native Bootcamp",
    date: "2026-06-18T09:30:00",
    location: "Online (Google Meet)",
    attendees: 150,
    status: "Past",
  },
];

export default function Programs() {
  const [activeTab, setActiveTab] = useState("upcoming"); // 'upcoming' | 'past'

  // Filter & Sort Upcoming Programs (Closest to Furthest: Ascending)
  const upcomingPrograms = useMemo(() => {
    const now = new Date();
    return SAMPLE_PROGRAMS.filter((p) => new Date(p.date) >= now).sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );
  }, []);

  // Filter & Sort Past Programs (Latest to Earliest: Descending)
  const pastPrograms = useMemo(() => {
    const now = new Date();
    return SAMPLE_PROGRAMS.filter((p) => new Date(p.date) < now).sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    );
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderProgramCard = ({ item }) => {
    const isUpcoming = new Date(item.date) >= new Date();

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <View
            style={[
              styles.statusBadge,
              isUpcoming ? styles.upcomingBadge : styles.pastBadge,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isUpcoming ? styles.upcomingStatusText : styles.pastStatusText,
              ]}
            >
              {isUpcoming ? "Upcoming" : "Completed"}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color="#1E3A8A" />
          <Text style={styles.infoText}>{formatDate(item.date)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#64748B" />
          <Text style={styles.infoText}>{item.location}</Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.attendeeTag}>
            <Ionicons name="people-outline" size={14} color="#475569" />
            <Text style={styles.attendeeText}>{item.attendees} Registered</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Programs & Events</Text>
        <Text style={styles.headerSubtitle}>
          Manage scheduled mentorship sessions and past workshops
        </Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "upcoming" && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab("upcoming")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "upcoming" && styles.activeTabText,
            ]}
          >
            Upcoming ({upcomingPrograms.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "past" && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab("past")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "past" && styles.activeTabText,
            ]}
          >
            Past Archive ({pastPrograms.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Program Lists */}
      <FlatList
        data={activeTab === "upcoming" ? upcomingPrograms : pastPrograms}
        keyExtractor={(item) => item.id}
        renderItem={renderProgramCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-sharp" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>
              No {activeTab} programs available.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
