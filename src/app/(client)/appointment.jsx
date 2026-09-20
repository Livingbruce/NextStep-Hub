import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  LayoutAnimation,
  Linking,
  Platform,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../libs/supabase";
import { styles } from "../../styles/(client)/appointments/index";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental &&
  !global.nativeFabricUIManager
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function AppointmentScreen() {
  const router = useRouter();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Active Tab: 'upcoming' or 'history'
  const [activeTab, setActiveTab] = useState("upcoming");

  const [expandedId, setExpandedId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [reviewText, setReviewText] = useState("");

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        Alert.alert(
          "Authentication Required",
          "Please sign in to view appointments.",
        );
        return;
      }

      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          id,
          counseling_type,
          reasons,
          other_reason,
          session_goals,
          had_therapy_before,
          notes,
          session_link,
          scheduled_start_time,
          scheduled_end_time,
          status,
          payment_status,
          payment_amount,
          currency,
          action_reason,
          counselor:counselor_id (
            first_name,
            surname,
            avatar_url
          ),
          reviews:appointment_reviews (
            id,
            reviewer_id,
            reviewer_role,
            counselor_notes,
            feedback_text
          )
        `,
        )
        .eq("client_id", user.id)
        .order("scheduled_start_time", { ascending: true });

      if (error) throw error;

      setAppointments(data || []);
    } catch (err) {
      console.error("Error fetching appointments:", err);
      Alert.alert("Error", "Could not retrieve your appointments.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAppointments();
  }, []);

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((prev) => (prev === id ? null : id));
    setCancelReason("");
    setReviewText("");
  };

  const handleCancelAppointment = async (id) => {
    if (!cancelReason.trim()) {
      return Alert.alert(
        "Required",
        "Please provide a reason for cancellation.",
      );
    }

    try {
      setActionLoading(true);

      const { error } = await supabase
        .from("appointments")
        .update({
          status: "cancelled_by_client",
          action_reason: cancelReason.trim(),
          action_by_role: "client",
          action_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      Alert.alert("Cancelled", "Your appointment has been cancelled.");
      setCancelReason("");
      setExpandedId(null);
      fetchAppointments();
    } catch (err) {
      console.error("Error cancelling appointment:", err);
      Alert.alert("Error", err.message || "Failed to cancel appointment.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveReview = async (id) => {
    if (!reviewText.trim()) {
      return Alert.alert(
        "Required",
        "Please enter a review before submitting.",
      );
    }

    try {
      setActionLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) throw new Error("User not authenticated");

      const payload = {
        appointment_id: id,
        reviewer_id: user.id,
        reviewer_role: "client",
        feedback_text: reviewText.trim(),
      };

      const { error } = await supabase
        .from("appointment_reviews")
        .insert([payload]);

      if (error) {
        if (error.code === "23505") {
          throw new Error(
            "You have already submitted a review for this session.",
          );
        }
        throw error;
      }

      Alert.alert("Thank You", "Your review has been submitted successfully.");
      setReviewText("");
      setExpandedId(null);
      fetchAppointments();
    } catch (err) {
      console.error("Error submitting review:", err);
      Alert.alert(
        "Submission Error",
        err.message || "Failed to submit review.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAppointment = (id) => {
    Alert.alert(
      "Delete Record",
      "Are you sure you want to remove this record from your screen?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setActionLoading(true);
              const { error } = await supabase
                .from("appointments")
                .delete()
                .eq("id", id);

              if (error) throw error;

              setAppointments((prev) => prev.filter((app) => app.id !== id));
              setExpandedId(null);
            } catch (err) {
              console.error("Error deleting appointment:", err);
              Alert.alert("Error", "Could not delete appointment record.");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  const openSessionLink = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Invalid Link", "Cannot open session link.");
      }
    } catch (err) {
      console.error("Error launching URL:", err);
    }
  };

  const formatStatus = (status, paymentStatus) => {
    switch (status) {
      case "completed":
        return { label: "Done", bg: "#E0F2FE", text: "#0369A1" };
      case "cancelled_by_client":
      case "cancelled_by_counselor":
      case "cancelled":
        return { label: "Cancelled", bg: "#FEE2E2", text: "#DC2626" };
      case "not_attended":
      case "missed":
      case "no_show":
        return { label: "Not Attended", bg: "#FEF3C7", text: "#B45309" };
      case "scheduled":
        return { label: "Confirmed", bg: "#DCFCE7", text: "#15803D" };
      case "pending_payment":
        return paymentStatus === "completed"
          ? { label: "Confirmed", bg: "#DCFCE7", text: "#15803D" }
          : { label: "Pending Payment", bg: "#FEF3C7", text: "#B45309" };
      default:
        return {
          label: status.replace(/_/g, " "),
          bg: "#F1F5F9",
          text: "#475569",
        };
    }
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return { dateStr: "N/A", timeStr: "N/A" };
    const dateObj = new Date(isoString);
    const dateStr = dateObj.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timeStr = dateObj.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return { dateStr, timeStr };
  };

  const getInitials = (firstName = "", surname = "") => {
    const f = firstName.trim().charAt(0);
    const s = surname.trim().charAt(0);
    return `${f}${s}`.toUpperCase() || "C";
  };

  // Helper check for historical status
  const isHistoryAppointment = (app) => {
    const historyStatuses = [
      "completed",
      "cancelled_by_client",
      "cancelled_by_counselor",
      "cancelled",
      "not_attended",
      "missed",
      "no_show",
    ];
    return historyStatuses.includes(app.status);
  };

  // Filter lists based on tab selection
  const upcomingAppointments = appointments.filter(
    (app) => !isHistoryAppointment(app),
  );
  const historyAppointments = appointments.filter((app) =>
    isHistoryAppointment(app),
  );

  const displayedAppointments =
    activeTab === "upcoming" ? upcomingAppointments : historyAppointments;

  const renderAppointmentCard = ({ item }) => {
    const isExpanded = expandedId === item.id;
    const statusMeta = formatStatus(item.status, item.payment_status);
    const { dateStr, timeStr } = formatDateTime(item.scheduled_start_time);

    const isDone = item.status === "completed";
    const isCancelled =
      item.status === "cancelled_by_client" ||
      item.status === "cancelled_by_counselor" ||
      item.status === "cancelled";
    const isNotAttended =
      item.status === "not_attended" ||
      item.status === "missed" ||
      item.status === "no_show";

    const counselorFirstName = item.counselor?.first_name || "";
    const counselorSurname = item.counselor?.surname || "";
    const counselorName = item.counselor
      ? `Counselor ${counselorFirstName} ${counselorSurname}`.trim()
      : "Unassigned Counselor";

    const avatarUrl = item.counselor?.avatar_url;
    const initials = getInitials(counselorFirstName, counselorSurname);

    const counselorReview = item.reviews?.find(
      (r) => r.reviewer_role === "counselor",
    );
    const clientReview = item.reviews?.find(
      (r) => r.reviewer_role === "client",
    );

    return (
      <View style={styles.card}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => toggleExpand(item.id)}
        >
          <View style={styles.cardHeader}>
            <View style={styles.counselorInfo}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
              )}
              <View style={styles.counselorTextWrapper}>
                <Text style={styles.counselorName} numberOfLines={1}>
                  {counselorName}
                </Text>
                <Text style={styles.typeText}>
                  {item.counseling_type} Session
                </Text>
              </View>
            </View>
            <View
              style={[styles.statusBadge, { backgroundColor: statusMeta.bg }]}
            >
              <Text style={[styles.statusText, { color: statusMeta.text }]}>
                {statusMeta.label}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.cardFooter}>
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={16} color="#64748B" />
              <Text style={styles.metaText}>{dateStr}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={16} color="#64748B" />
              <Text style={styles.metaText}>{timeStr}</Text>
            </View>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={18}
              color="#94A3B8"
              style={{ marginLeft: "auto" }}
            />
          </View>
        </TouchableOpacity>

        {/* EXPANDED SECTION */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* Session Link */}
            {item.session_link && !isCancelled && !isNotAttended && (
              <View style={styles.detailBlock}>
                <Text style={styles.detailTitle}>Session Meeting Link:</Text>
                <TouchableOpacity
                  onPress={() => openSessionLink(item.session_link)}
                >
                  <Text style={styles.linkText} numberOfLines={1}>
                    {item.session_link}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Booking Intake Details */}
            {item.reasons && item.reasons.length > 0 && (
              <View style={styles.detailBlock}>
                <Text style={styles.detailTitle}>Reasons for Session:</Text>
                <Text style={styles.detailText}>
                  {item.reasons.join(", ")}
                  {item.other_reason ? ` (${item.other_reason})` : ""}
                </Text>
              </View>
            )}

            {item.session_goals && (
              <View style={styles.detailBlock}>
                <Text style={styles.detailTitle}>Session Goals:</Text>
                <Text style={styles.detailText}>{item.session_goals}</Text>
              </View>
            )}

            <View style={styles.detailBlock}>
              <Text style={styles.detailTitle}>Prior Therapy Experience:</Text>
              <Text style={styles.detailText}>
                {item.had_therapy_before ? "Yes" : "No"}
              </Text>
            </View>

            {item.notes && (
              <View style={styles.detailBlock}>
                <Text style={styles.detailTitle}>Counselor Session Notes:</Text>
                <Text style={styles.detailText}>{item.notes}</Text>
              </View>
            )}

            {counselorReview?.counselor_notes && (
              <View style={styles.detailBlock}>
                <Text style={styles.detailTitle}>Counselor Review Notes:</Text>
                <Text style={styles.detailText}>
                  {counselorReview.counselor_notes}
                </Text>
              </View>
            )}

            {clientReview?.feedback_text && (
              <View style={styles.detailBlock}>
                <Text style={styles.detailTitle}>Your Feedback:</Text>
                <Text style={styles.detailText}>
                  {clientReview.feedback_text}
                </Text>
              </View>
            )}

            {/* Action Buttons & Feedback Form */}
            {isDone ? (
              <View style={{ marginTop: 8 }}>
                {!clientReview && (
                  <>
                    <Text style={styles.actionLabel}>Leave a Review</Text>
                    <TextInput
                      style={styles.actionInput}
                      placeholder="Share feedback on your session..."
                      placeholderTextColor="#94A3B8"
                      value={reviewText}
                      onChangeText={setReviewText}
                      multiline
                    />
                  </>
                )}
                <View style={styles.actionButtonRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDeleteAppointment(item.id)}
                    disabled={actionLoading}
                  >
                    <Ionicons name="trash-outline" size={16} color="#DC2626" />
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>

                  {!clientReview && (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.submitBtn]}
                      onPress={() => handleSaveReview(item.id)}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.submitBtnText}>Submit Review</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ) : isCancelled ? (
              <View style={{ marginTop: 8 }}>
                <Text style={styles.cancelledNotice}>
                  This appointment was cancelled.
                  {item.action_reason
                    ? `\nReason: "${item.action_reason}"`
                    : ""}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    styles.deleteBtn,
                    { marginTop: 10 },
                  ]}
                  onPress={() => handleDeleteAppointment(item.id)}
                  disabled={actionLoading}
                >
                  <Ionicons name="trash-outline" size={16} color="#DC2626" />
                  <Text style={styles.deleteBtnText}>Delete Record</Text>
                </TouchableOpacity>
              </View>
            ) : isNotAttended ? (
              <View style={{ marginTop: 8 }}>
                <Text style={styles.cancelledNotice}>
                  This session was marked as not attended / missed.
                </Text>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    styles.deleteBtn,
                    { marginTop: 10 },
                  ]}
                  onPress={() => handleDeleteAppointment(item.id)}
                  disabled={actionLoading}
                >
                  <Ionicons name="trash-outline" size={16} color="#DC2626" />
                  <Text style={styles.deleteBtnText}>Delete Record</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ marginTop: 8 }}>
                <Text style={styles.actionLabel}>Reason for Cancellation</Text>
                <TextInput
                  style={styles.actionInput}
                  placeholder="Tell us why you are cancelling..."
                  placeholderTextColor="#94A3B8"
                  value={cancelReason}
                  onChangeText={setCancelReason}
                  multiline
                />
                <TouchableOpacity
                  style={[styles.actionBtn, styles.cancelBtn]}
                  onPress={() => handleCancelAppointment(item.id)}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.cancelBtnText}>
                      Confirm Cancellation
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.maxContainer}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Your Appointments</Text>
          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.7}
            onPress={() => router.push("/appointments/newAppointments")}
          >
            <Ionicons name="add" size={24} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {/* Navigation Tabs */}
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
              Upcoming ({upcomingAppointments.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "history" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("history")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "history" && styles.activeTabText,
              ]}
            >
              History ({historyAppointments.length})
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#936D9A"
            style={{ marginTop: 40 }}
          />
        ) : displayedAppointments.length > 0 ? (
          <FlatList
            data={displayedAppointments}
            keyExtractor={(item) => item.id}
            renderItem={renderAppointmentCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        ) : (
          <View style={styles.sectionContainer}>
            <Ionicons
              name={
                activeTab === "upcoming" ? "calendar-outline" : "time-outline"
              }
              size={64}
              color="#CBD5E1"
            />
            <Text style={styles.emptySubtitle}>
              {activeTab === "upcoming"
                ? "You have no upcoming appointments scheduled."
                : "No past or historical appointments found."}
            </Text>
            {activeTab === "upcoming" && (
              <TouchableOpacity
                style={styles.bookButton}
                activeOpacity={0.8}
                onPress={() => router.push("/appointments/newAppointments")}
              >
                <Text style={styles.bookButtonText}>Book Appointment</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
