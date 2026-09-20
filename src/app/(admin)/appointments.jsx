import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../libs/supabase";
import { styles } from "../../styles/(admin)/appointments";

const TERMINAL_STATUSES = [
  "completed",
  "cancelled_by_client",
  "cancelled_by_counselor",
  "no_show",
];

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [expandedMonths, setExpandedMonths] = useState({});

  useEffect(() => {
    fetchAdminAppointments();
  }, []);

  const fetchAdminAppointments = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Admin session not found.");
      }

      // Fetch appointments with explicit relationship joins
      const { data: appointmentsData, error: appointmentsError } =
        await supabase
          .from("appointments")
          .select(
            `
            id,
            counseling_type,
            reasons,
            other_reason,
            session_goals,
            notes,
            session_link,
            scheduled_start_time,
            scheduled_end_time,
            status,
            client_id,
            counselor_id,
            client:profiles!appointments_client_id_fkey (
              id,
              first_name,
              surname,
              phone_no,
              county
            ),
            counselor:profiles!appointments_counselor_id_fkey (
              id,
              first_name,
              surname,
              phone_no
            )
          `,
          )
          .order("scheduled_start_time", { ascending: false });

      if (appointmentsError) {
        console.error("Appointments error details:", appointmentsError);
        throw appointmentsError;
      }

      // Fetch reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("appointment_reviews")
        .select("id, appointment_id, rating, feedback_text, created_at")
        .eq("reviewer_role", "client");

      if (reviewsError) {
        console.error("Reviews error details:", reviewsError);
      }

      const reviewsByAppointment = {};
      (reviewsData || []).forEach((review) => {
        reviewsByAppointment[review.appointment_id] = review;
      });

      const formattedAppointments = (appointmentsData || []).map((app) => {
        const clientObj = Array.isArray(app.client)
          ? app.client[0]
          : app.client;
        const counselorObj = Array.isArray(app.counselor)
          ? app.counselor[0]
          : app.counselor;

        const clientName = clientObj
          ? `${clientObj.first_name || ""} ${clientObj.surname || ""}`.trim()
          : "Unassigned Client";

        const counselorName = counselorObj
          ? `${counselorObj.first_name || ""} ${counselorObj.surname || ""}`.trim()
          : "Unassigned Counselor";

        const counselorRemarks =
          app.notes ||
          app.session_goals ||
          (Array.isArray(app.reasons) ? app.reasons.join(", ") : app.reasons) ||
          app.other_reason ||
          null;

        const review = reviewsByAppointment[app.id];

        return {
          id: app.id,
          rawStatus: app.status,
          clientName: clientName || "Unnamed Client",
          counselorName: counselorName || "Unassigned Counselor",
          service: app.counseling_type || "General Session",
          dateTime: app.scheduled_start_time,
          status: app.status
            ? app.status
                .replace(/_/g, " ")
                .replace(/\b\w/g, (char) => char.toUpperCase())
            : "Scheduled",
          location: app.session_link ? "Virtual Room" : "Pending Room",
          counselorRemarks,
          clientReview: review
            ? {
                rating: review.rating,
                comment: review.feedback_text,
              }
            : null,
        };
      });

      setAppointments(formattedAppointments);

      const now = new Date();
      const currentMonthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;

      setExpandedMonths({
        [currentMonthKey]: true,
      });
    } catch (error) {
      console.error("Admin appointments catch error:", error);
      Alert.alert(
        "Fetch Failed",
        error?.message || "Unable to load system appointments.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAdminAppointments();
  }, []);

  // Filter upcoming active appointments
  const upcomingAppointments = useMemo(() => {
    const now = new Date();

    return appointments
      .filter((appointment) => {
        if (!appointment.dateTime) return false;
        const isFuture = new Date(appointment.dateTime) >= now;
        const isTerminal = TERMINAL_STATUSES.includes(appointment.rawStatus);
        return isFuture && !isTerminal;
      })
      .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
  }, [appointments]);

  // Group completed, cancelled, no-show, and past appointments by Year -> Month -> Date
  const archiveGrouped = useMemo(() => {
    const now = new Date();

    const pastOrTerminalAppointments = appointments
      .filter((appointment) => {
        if (!appointment.dateTime) return false;
        const isPast = new Date(appointment.dateTime) < now;
        const isTerminal = TERMINAL_STATUSES.includes(appointment.rawStatus);
        return isPast || isTerminal;
      })
      .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));

    const archive = {};

    pastOrTerminalAppointments.forEach((appointment) => {
      const date = new Date(appointment.dateTime);
      const year = date.getFullYear().toString();
      const monthNumber = date.getMonth() + 1;
      const monthName = date.toLocaleString("en-US", { month: "long" });

      if (!archive[year]) {
        archive[year] = {};
      }

      if (!archive[year][monthNumber]) {
        archive[year][monthNumber] = {
          monthName,
          appointments: [],
        };
      }

      archive[year][monthNumber].appointments.push(appointment);
    });

    return archive;
  }, [appointments]);

  const toggleCardExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCardId((previous) => (previous === id ? null : id));
  };

  const toggleMonthExpand = (key) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedMonths((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  };

  const renderAppointmentCard = (item, isUpcoming = false) => {
    const isExpanded = expandedCardId === item.id;

    const formattedDate = item.dateTime
      ? new Date(item.dateTime).toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Unscheduled";

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

            <View style={styles.remarkBox}>
              <Text style={styles.boxTitle}>Counselor Remarks & Goals</Text>
              <Text style={styles.boxContent}>
                {item.counselorRemarks ||
                  "No counselor comments or notes logged."}
              </Text>
            </View>

            <View style={styles.reviewBox}>
              <Text style={styles.boxTitle}>Client Review</Text>
              {item.clientReview ? (
                <View>
                  <View style={styles.ratingRow}>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Ionicons
                        key={index}
                        name={
                          index < (item.clientReview.rating || 0)
                            ? "star"
                            : "star-outline"
                        }
                        size={14}
                        color="#F59E0B"
                      />
                    ))}
                  </View>
                  <Text style={styles.boxContent}>
                    "{item.clientReview.comment || "No written review text."}"
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

  const sortedYears = Object.keys(archiveGrouped).sort(
    (a, b) => Number(b) - Number(a),
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Appointments</Text>
          <Text style={styles.headerSubtitle}>
            Manage system-wide schedules, counselor logs, and client feedback
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#1E3A8A"
            style={{ marginTop: 40 }}
          />
        ) : (
          <>
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="calendar" size={20} color="#1E3A8A" />
                <Text style={styles.sectionTitle}>
                  Upcoming Appointments ({upcomingAppointments.length})
                </Text>
              </View>

              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((appointment) =>
                  renderAppointmentCard(appointment, true),
                )
              ) : (
                <Text style={styles.emptyText}>
                  No upcoming appointments scheduled.
                </Text>
              )}
            </View>

            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="archive-outline" size={20} color="#1E3A8A" />
                <Text style={styles.sectionTitle}>Strategic Archive</Text>
              </View>

              {sortedYears.length > 0 ? (
                sortedYears.map((year) => {
                  const sortedMonths = Object.keys(archiveGrouped[year]).sort(
                    (a, b) => Number(b) - Number(a),
                  );

                  return (
                    <View key={year} style={styles.yearBlock}>
                      <Text style={styles.yearTitle}>{year}</Text>

                      {sortedMonths.map((monthNum) => {
                        const monthKey = `${year}-${monthNum}`;
                        const isMonthOpen = !!expandedMonths[monthKey];
                        const { monthName, appointments: monthAppointments } =
                          archiveGrouped[year][monthNum];

                        return (
                          <View key={monthKey} style={styles.monthContainer}>
                            <TouchableOpacity
                              style={styles.monthHeader}
                              onPress={() => toggleMonthExpand(monthKey)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.monthTitle}>{monthName}</Text>

                              <View style={styles.monthBadge}>
                                <Text style={styles.monthBadgeText}>
                                  {monthAppointments.length}{" "}
                                  {monthAppointments.length === 1
                                    ? "Session"
                                    : "Sessions"}
                                </Text>

                                <Ionicons
                                  name={
                                    isMonthOpen ? "chevron-up" : "chevron-down"
                                  }
                                  size={16}
                                  color="#1E3A8A"
                                />
                              </View>
                            </TouchableOpacity>

                            {isMonthOpen && (
                              <View style={styles.monthBody}>
                                {monthAppointments.map((appointment) =>
                                  renderAppointmentCard(appointment, false),
                                )}
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  );
                })
              ) : (
                <Text style={styles.emptyText}>
                  No past appointments archived yet.
                </Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
