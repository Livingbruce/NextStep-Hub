import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  LayoutAnimation,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../../styles/(admin)/appointments";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Sample Data with upcoming and past appointments
const SAMPLE_APPOINTMENTS = [
  {
    id: "app-1",
    clientName: "David Kimani",
    counselorName: "Dr. Sarah Jenkins",
    service: "Youth Career Mentorship",
    dateTime: "2026-09-20T10:00:00",
    status: "Upcoming",
    location: "Virtual Room A",
    counselorRemarks:
      "Pre-session survey completed. Focus on career pathway choices.",
    clientReview: null,
  },
  {
    id: "app-2",
    clientName: "Grace Wambui",
    counselorName: "Dr. Aris Vance",
    service: "Academic Stress Support",
    dateTime: "2026-09-25T14:30:00",
    status: "Upcoming",
    location: "Consultation Room 102",
    counselorRemarks:
      "Client requested follow-up on examination coping techniques.",
    clientReview: null,
  },
  {
    id: "app-3",
    clientName: "Brian Omondi",
    counselorName: "Dr. Sarah Jenkins",
    service: "Personal Growth Counseling",
    dateTime: "2026-08-15T11:00:00",
    status: "Completed",
    location: "Virtual Room B",
    counselorRemarks:
      "Great progress made on personal goal setting. Client engaged well.",
    clientReview: {
      rating: 5,
      comment: "Extremely helpful session! Very insightful advice.",
    },
  },
  {
    id: "app-4",
    clientName: "Faith Chebet",
    counselorName: "Dr. Aris Vance",
    service: "Relationship Guidance",
    dateTime: "2026-08-02T09:30:00",
    status: "Completed",
    location: "Consultation Room 101",
    counselorRemarks:
      "Addressed communication strategies. Next goals set for October.",
    clientReview: {
      rating: 4,
      comment: "Good guidance overall. Looking forward to the next stage.",
    },
  },
  {
    id: "app-5",
    clientName: "Kevin Mutua",
    counselorName: "Dr. Sarah Jenkins",
    service: "Youth Career Mentorship",
    dateTime: "2025-11-12T15:00:00",
    status: "Completed",
    location: "Virtual Room A",
    counselorRemarks: "Resume evaluation finalized. Career goals set.",
    clientReview: {
      rating: 5,
      comment: "Transformed how I approach my job search!",
    },
  },
];

export default function Appointments() {
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [expandedMonths, setExpandedMonths] = useState({ "2026-August": true });

  // 1. Separate & sort Upcoming Appointments (nearest to furthest)
  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    return SAMPLE_APPOINTMENTS.filter(
      (app) => new Date(app.dateTime) >= now,
    ).sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
  }, []);

  // Group Past/Overdue Appointments by Year and Month
  const archiveGrouped = useMemo(() => {
    const now = new Date();
    const pastApps = SAMPLE_APPOINTMENTS.filter(
      (app) => new Date(app.dateTime) < now,
    ).sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));

    const archive = {};

    pastApps.forEach((app) => {
      const date = new Date(app.dateTime);
      const year = date.getFullYear().toString();

      // Fixed: lowercase "long"
      const month = date.toLocaleString("en-US", { month: "long" });

      if (!archive[year]) {
        archive[year] = {};
      }
      if (!archive[year][month]) {
        archive[year][month] = [];
      }
      archive[year][month].push(app);
    });

    return archive;
  }, []);

  const toggleCardExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCardId((prev) => (prev === id ? null : id));
  };

  const toggleMonthExpand = (key) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedMonths((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderAppointmentCard = (item, isUpcoming = false) => {
    const isExpanded = expandedCardId === item.id;
    const formattedDate = new Date(item.dateTime).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.card,
          isUpcoming ? styles.upcomingBorder : styles.archiveBorder,
        ]}
        onPress={() => toggleCardExpand(item.id)}
        activeOpacity={0.85}
      >
        {/* Card Header Summary */}
        <View style={styles.cardHeader}>
          <View style={styles.clientMeta}>
            <Text style={styles.clientName}>{item.clientName}</Text>
            <Text style={styles.serviceTag}>{item.service}</Text>
          </View>
          <View style={styles.cardRightMeta}>
            <View
              style={[
                styles.statusBadge,
                isUpcoming ? styles.upcomingBadge : styles.completedBadge,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  isUpcoming ? styles.upcomingText : styles.completedText,
                ]}
              >
                {item.status}
              </Text>
            </View>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={18}
              color="#64748B"
            />
          </View>
        </View>

        <View style={styles.cardDateRow}>
          <Ionicons name="time-outline" size={14} color="#64748B" />
          <Text style={styles.cardDateText}>{formattedDate}</Text>
        </View>

        {/* Expanded Detailed Section */}
        {isExpanded && (
          <View style={styles.expandedDetails}>
            <View style={styles.detailDivider} />

            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={16} color="#1E3A8A" />
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Counselor: </Text>
                {item.counselorName}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={16} color="#1E3A8A" />
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Location: </Text>
                {item.location}
              </Text>
            </View>

            {/* Counselor Remarks */}
            <View style={styles.remarkBox}>
              <Text style={styles.boxTitle}>Counselor Remarks</Text>
              <Text style={styles.boxContent}>
                {item.counselorRemarks || "No remarks filed yet."}
              </Text>
            </View>

            {/* Client Reviews */}
            <View style={styles.reviewBox}>
              <Text style={styles.boxTitle}>Client Review</Text>
              {item.clientReview ? (
                <View>
                  <View style={styles.ratingRow}>
                    {[...Array(5)].map((_, i) => (
                      <Ionicons
                        key={i}
                        name={
                          i < item.clientReview.rating ? "star" : "star-outline"
                        }
                        size={14}
                        color="#F59E0B"
                      />
                    ))}
                  </View>
                  <Text style={styles.boxContent}>
                    "{item.clientReview.comment}"
                  </Text>
                </View>
              ) : (
                <Text style={styles.boxContentSubtle}>
                  No review submitted by client yet.
                </Text>
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Appointments</Text>
          <Text style={styles.headerSubtitle}>
            Manage upcoming schedules and archived sessions
          </Text>
        </View>

        {/* Section 1: Upcoming Appointments */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="calendar" size={20} color="#1E3A8A" />
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
          </View>

          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.map((app) => renderAppointmentCard(app, true))
          ) : (
            <Text style={styles.emptyText}>
              No upcoming appointments scheduled.
            </Text>
          )}
        </View>

        {/* Section 2: Strategic Archive (Year -> Month) */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="archive-outline" size={20} color="#1E3A8A" />
            <Text style={styles.sectionTitle}>Strategic Archive</Text>
          </View>

          {Object.keys(archiveGrouped).length > 0 ? (
            Object.keys(archiveGrouped).map((year) => (
              <View key={year} style={styles.yearBlock}>
                <Text style={styles.yearTitle}>{year}</Text>

                {Object.keys(archiveGrouped[year]).map((month) => {
                  const monthKey = `${year}-${month}`;
                  const isMonthOpen = !!expandedMonths[monthKey];
                  const monthApps = archiveGrouped[year][month];

                  return (
                    <View key={monthKey} style={styles.monthContainer}>
                      <TouchableOpacity
                        style={styles.monthHeader}
                        onPress={() => toggleMonthExpand(monthKey)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.monthTitle}>{month}</Text>
                        <View style={styles.monthBadge}>
                          <Text style={styles.monthBadgeText}>
                            {monthApps.length}{" "}
                            {monthApps.length === 1 ? "Session" : "Sessions"}
                          </Text>
                          <Ionicons
                            name={isMonthOpen ? "chevron-up" : "chevron-down"}
                            size={16}
                            color="#1E3A8A"
                          />
                        </View>
                      </TouchableOpacity>

                      {isMonthOpen && (
                        <View style={styles.monthBody}>
                          {monthApps.map((app) =>
                            renderAppointmentCard(app, false),
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>
              No past appointments archived yet.
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
