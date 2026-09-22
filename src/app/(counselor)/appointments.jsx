import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  createNotification,
  NOTIFICATION_TYPES,
} from "../../../libs/notifications";
import { supabase } from "../../../libs/supabase";
import { styles } from "../../styles/(counselor)/appointment";

export default function AppointmentsScreen() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Blackout / Absent Dates state
  const [blockedDates, setBlockedDates] = useState({});
  const [savingAbsentDays, setSavingAbsentDays] = useState(false);

  // Editing state for session links
  const [editingLinks, setEditingLinks] = useState({});

  // Expanded card tracking
  const [expandedId, setExpandedId] = useState(null);

  // Modal State
  const [activeModal, setActiveModal] = useState(null); // 'cancel' | 'attended' | 'transfer' | 'postpone'
  const [selectedSession, setSelectedSession] = useState(null);
  const [modalInput, setModalInput] = useState("");
  const [postponeDate, setPostponeDate] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    await Promise.all([
      fetchCounselorProfileAndAbsentDays(),
      fetchCounselorAppointments(),
    ]);
    setLoading(false);
  };

  // Fetch Counselor's Profile and Absent Days
  const fetchCounselorProfileAndAbsentDays = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("absent_days")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching counselor absent days:", error);
        return;
      }

      if (data && Array.isArray(data.absent_days)) {
        const marked = {};
        data.absent_days.forEach((dateStr) => {
          marked[dateStr] = {
            selected: true,
            selectedColor: "#EF4444",
            disableTouchEvent: false,
          };
        });
        setBlockedDates(marked);
      }
    } catch (err) {
      console.error("Failed to load absent days:", err);
    }
  };

  // Save Absent Days to Counselor Profile
  const updateAbsentDaysInProfile = async (newBlockedDates) => {
    try {
      setSavingAbsentDays(true);
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) return;

      const absentDaysArray = Object.keys(newBlockedDates);

      const { error } = await supabase
        .from("profiles")
        .update({ absent_days: absentDaysArray })
        .eq("id", user.id);

      if (error) throw error;
    } catch (err) {
      console.error("Error updating absent days:", err);
      Alert.alert("Error", "Could not save absent days to profile.");
    } finally {
      setSavingAbsentDays(false);
    }
  };

  // Fetch Counselor Appointments + Joined Profiles
  const fetchCounselorAppointments = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        Alert.alert("Authentication Error", "Please sign in as a counselor.");
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
          agreed_terms,
          notes,
          session_link,
          scheduled_start_time,
          scheduled_end_time,
          status,
          payment_status,
          payment_amount,
          currency,
          action_reason,
          action_by_role,
          client:client_id (
            id,
            first_name,
            middle_name,
            surname,
            phone_no,
            alt_phone_no,
            gender,
            county,
            emergency_phone,
            emergency_relationship,
            age,
            relationship_status,
            religion,
            avatar_url
          ),
          reviews:appointment_reviews (
            id,
            reviewer_id,
            reviewer_role,
            counselor_notes,
            feedback_text,
            rating
          )
        `,
        )
        .eq("counselor_id", user.id)
        .order("scheduled_start_time", { ascending: true });

      if (error) throw error;

      setAppointments(data || []);
    } catch (err) {
      console.error("Error fetching counselor appointments:", err);
      Alert.alert("Error", "Could not load appointments.");
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchInitialData();
  }, []);

  // Filter Active Sessions vs History
  const activeSessions = useMemo(() => {
    return appointments.filter(
      (item) =>
        item.status !== "completed" &&
        item.status !== "cancelled_by_client" &&
        item.status !== "cancelled_by_counselor" &&
        item.status !== "rescheduled_requested",
    );
  }, [appointments]);

  const historySessions = useMemo(() => {
    return appointments.filter(
      (item) =>
        item.status === "completed" ||
        item.status === "cancelled_by_client" ||
        item.status === "cancelled_by_counselor" ||
        item.status === "rescheduled_requested",
    );
  }, [appointments]);

  // Handle Day Toggling
  const handleDayPress = (day) => {
    const dateStr = day.dateString;
    const dateObj = new Date(day.timestamp);
    const dayOfWeek = dateObj.getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      Alert.alert(
        "Weekend",
        "Weekends are set as non-working days by default.",
      );
      return;
    }

    const updated = { ...blockedDates };
    if (updated[dateStr]) {
      delete updated[dateStr];
    } else {
      updated[dateStr] = {
        selected: true,
        selectedColor: "#EF4444",
        disableTouchEvent: false,
      };
    }

    setBlockedDates(updated);
    updateAbsentDaysInProfile(updated);
  };

  // Session Links
  const handleLinkChange = (id, text) => {
    setEditingLinks((prev) => ({ ...prev, [id]: text }));
  };

  const handleSaveLink = async (id) => {
    const newLink = editingLinks[id];
    if (newLink === undefined) return;

    const trimmedLink = newLink.trim();

    try {
      setActionLoading(true);

      const { error } = await supabase
        .from("appointments")
        .update({ session_link: trimmedLink })
        .eq("id", id);

      if (error) throw error;

      const session = appointments.find((a) => a.id === id);
      if (session?.client?.id) {
        await createNotification({
          recipientId: session.client.id,
          type: NOTIFICATION_TYPES.LINK_UPDATED,
          title: "Meeting Link Updated",
          body: "Your counselor added/updated the virtual meeting link for your session.",
          data: { appointmentId: id },
        });
      }

      // 1. Optimistically update local appointments state
      setAppointments((prevAppointments) =>
        prevAppointments.map((item) =>
          item.id === id ? { ...item, session_link: trimmedLink } : item,
        ),
      );

      // 2. Clear editing buffer for this appointment ID
      setEditingLinks((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });

      Alert.alert("Success", "Virtual meeting link updated!");

      // 3. Re-fetch appointments to ensure sync with Supabase
      await fetchCounselorAppointments();
    } catch (err) {
      console.error("Error updating session link:", err);
      Alert.alert("Error", err.message || "Failed to update session link.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinCall = (url) => {
    if (!url) {
      Alert.alert("No Link", "Please save a session link first.");
      return;
    }
    Linking.openURL(url).catch(() =>
      Alert.alert("Error", "Unable to open meeting link."),
    );
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Action Modals
  const openActionModal = (type, session) => {
    setActiveModal(type);
    setSelectedSession(session);
    setModalInput("");
    setPostponeDate("");
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedSession(null);
    setModalInput("");
    setPostponeDate("");
  };

  const handleModalSubmit = async () => {
    if (!selectedSession) return;

    try {
      setActionLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (activeModal === "cancel") {
        // CANCEL: Moves to History
        const { error } = await supabase
          .from("appointments")
          .update({
            status: "cancelled_by_counselor",
            action_reason: modalInput.trim() || "Cancelled by counselor",
            action_by_role: "counselor",
            action_at: new Date().toISOString(),
          })
          .eq("id", selectedSession.id);

        if (error) throw error;
        Alert.alert("Cancelled", "Appointment cancelled and moved to history.");
      } else if (activeModal === "attended") {
        // ATTENDED: Moves to History
        const { error: appError } = await supabase
          .from("appointments")
          .update({
            status: "completed",
            notes: modalInput.trim() || selectedSession.notes,
          })
          .eq("id", selectedSession.id);

        if (appError) throw appError;

        if (modalInput.trim() && user) {
          const { data: existingReview } = await supabase
            .from("appointment_reviews")
            .select("id")
            .eq("appointment_id", selectedSession.id)
            .eq("reviewer_id", user.id)
            .maybeSingle();

          if (existingReview) {
            await supabase
              .from("appointment_reviews")
              .update({ counselor_notes: modalInput.trim() })
              .eq("id", existingReview.id);
          } else {
            await supabase.from("appointment_reviews").insert({
              appointment_id: selectedSession.id,
              reviewer_id: user.id,
              reviewer_role: "counselor",
              counselor_notes: modalInput.trim(),
            });
          }
        }

        Alert.alert(
          "Completed",
          "Session marked as attended and moved to history.",
        );
      } else if (activeModal === "transfer") {
        // TRANSFER: Moves to History
        const { error } = await supabase
          .from("appointments")
          .update({
            status: "rescheduled_requested",
            action_reason: modalInput.trim() || "Transferred back to queue",
            action_by_role: "counselor",
            action_at: new Date().toISOString(),
          })
          .eq("id", selectedSession.id);

        if (error) throw error;
        Alert.alert("Transferred", "Session transferred and moved to history.");
      } else if (activeModal === "postpone") {
        // POSTPONE: Remains active under rescheduled status
        if (!postponeDate) {
          Alert.alert(
            "Required",
            "Please provide a proposed new date or time.",
          );
          setActionLoading(false);
          return;
        }

        const { error } = await supabase
          .from("appointments")
          .update({
            status: "rescheduled",
            action_reason: modalInput.trim() || `Postponed: ${postponeDate}`,
            action_by_role: "counselor",
            action_at: new Date().toISOString(),
          })
          .eq("id", selectedSession.id);

        if (error) throw error;
        Alert.alert(
          "Postponed",
          `Appointment rescheduled for: ${postponeDate}`,
        );
      }

      closeModal();
      fetchCounselorAppointments();
    } catch (err) {
      console.error("Error processing action:", err);
      Alert.alert("Action Failed", err.message || "Could not process request.");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return "N/A";
    const dateObj = new Date(isoString);
    return dateObj.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Appointments & Schedule</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Calendar Section */}
        <View style={styles.calendarCard}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={styles.sectionTitle}>Mark Absent Days</Text>
            {savingAbsentDays && (
              <ActivityIndicator size="small" color="#EF4444" />
            )}
          </View>
          <Text style={styles.sectionSub}>
            Tap weekdays to mark unavailable days. Saved directly to your
            counselor profile.
          </Text>
          <Calendar
            onDayPress={handleDayPress}
            markedDates={blockedDates}
            theme={{
              todayTextColor: "#16A34A",
              arrowColor: "#16A34A",
              textDisabledColor: "#CBD5E1",
            }}
          />
        </View>

        {/* Current Active Appointments */}
        <View style={styles.sessionsSection}>
          <Text style={styles.sectionTitle}>
            Current Appointments ({activeSessions.length})
          </Text>

          {loading ? (
            <ActivityIndicator
              size="large"
              color="#16A34A"
              style={{ marginVertical: 20 }}
            />
          ) : activeSessions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons
                name="calendar-clear-outline"
                size={36}
                color="#94A3B8"
              />
              <Text style={styles.emptyText}>
                No active appointments scheduled.
              </Text>
            </View>
          ) : (
            activeSessions.map((session) => {
              const isExpanded = expandedId === session.id;
              const client = session.client;
              const clientName = client
                ? `${client.first_name || ""} ${client.surname || ""}`.trim()
                : "Unknown Client";

              const currentLink =
                editingLinks[session.id] !== undefined
                  ? editingLinks[session.id]
                  : session.session_link || "";

              return (
                <View key={session.id} style={styles.sessionCard}>
                  {/* Basic Card Overview */}
                  <View style={styles.cardHeader}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {session.counseling_type} Session
                      </Text>
                    </View>
                    <Text style={styles.timeText}>
                      {formatDateTime(session.scheduled_start_time)}
                    </Text>
                  </View>

                  <Text style={styles.clientName}>{clientName}</Text>
                  <Text style={styles.clientMeta}>
                    Phone: {client?.phone_no || "N/A"} • Location:{" "}
                    {client?.county || "N/A"}
                  </Text>

                  {/* Expand Intake Details Button */}
                  <TouchableOpacity
                    style={styles.expandToggleContainer}
                    onPress={() => toggleExpand(session.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.expandToggleText}>
                      {isExpanded
                        ? "Hide Intake Details"
                        : "View Client Profile & Intake Details"}
                    </Text>
                    <Ionicons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={14}
                      color="#2563EB"
                    />
                  </TouchableOpacity>

                  {/* Styled Expanded Intake Details */}
                  {isExpanded && (
                    <View style={styles.intakeCard}>
                      <Text style={styles.intakeSectionHeader}>
                        Client Profile Details
                      </Text>

                      <View style={styles.intakeRow}>
                        <Ionicons
                          name="person-outline"
                          size={14}
                          color="#64748B"
                        />
                        <Text style={styles.intakeLabel}>Demographics:</Text>
                        <Text style={styles.intakeValue}>
                          {client?.age ? `${client.age} yrs` : "Age N/A"} |{" "}
                          {client?.gender || "Gender N/A"} |{" "}
                          {client?.relationship_status || "Single"}
                        </Text>
                      </View>

                      {client?.emergency_phone && (
                        <View style={styles.intakeRow}>
                          <Ionicons
                            name="call-outline"
                            size={14}
                            color="#64748B"
                          />
                          <Text style={styles.intakeLabel}>
                            Emergency Contact:
                          </Text>
                          <Text style={styles.intakeValue}>
                            {client.emergency_phone}{" "}
                            {client.emergency_relationship
                              ? `(${client.emergency_relationship})`
                              : ""}
                          </Text>
                        </View>
                      )}

                      <Text
                        style={[styles.intakeSectionHeader, { marginTop: 4 }]}
                      >
                        Session Intake
                      </Text>

                      {session.reasons && session.reasons.length > 0 && (
                        <View>
                          <Text style={styles.intakeLabel}>
                            Reasons for Counseling:
                          </Text>
                          <View style={styles.tagsContainer}>
                            {session.reasons.map((reason, idx) => (
                              <View key={idx} style={styles.reasonTag}>
                                <Text style={styles.reasonTagText}>
                                  {reason}
                                </Text>
                              </View>
                            ))}
                            {session.other_reason ? (
                              <View style={styles.reasonTag}>
                                <Text style={styles.reasonTagText}>
                                  Other: {session.other_reason}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                        </View>
                      )}

                      {session.session_goals && (
                        <View style={styles.intakeRow}>
                          <Ionicons
                            name="flag-outline"
                            size={14}
                            color="#64748B"
                          />
                          <Text style={styles.intakeLabel}>Session Goals:</Text>
                          <Text style={styles.intakeValue}>
                            {session.session_goals}
                          </Text>
                        </View>
                      )}

                      <View style={styles.intakeRow}>
                        <Ionicons
                          name="medical-outline"
                          size={14}
                          color="#64748B"
                        />
                        <Text style={styles.intakeLabel}>
                          Had Therapy Before:
                        </Text>
                        <Text style={styles.intakeValue}>
                          {session.had_therapy_before ? "Yes" : "No"}
                        </Text>
                      </View>

                      <View style={styles.intakeRow}>
                        <Ionicons
                          name="card-outline"
                          size={14}
                          color="#64748B"
                        />
                        <Text style={styles.intakeLabel}>Payment Status:</Text>
                        <View style={styles.paymentBadge}>
                          <Text style={styles.paymentBadgeText}>
                            {session.payment_status?.toUpperCase()} (
                            {session.currency} {session.payment_amount})
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Virtual Meeting Link */}
                  <View style={styles.linkContainer}>
                    <TextInput
                      style={styles.linkInput}
                      placeholder="Add Google Meet or Zoom link..."
                      placeholderTextColor="#94A3B8"
                      value={currentLink}
                      onChangeText={(text) =>
                        handleLinkChange(session.id, text)
                      }
                    />
                    <TouchableOpacity
                      style={styles.saveLinkBtn}
                      onPress={() => handleSaveLink(session.id)}
                      disabled={actionLoading}
                    >
                      <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.joinBtn}
                    onPress={() => handleJoinCall(session.session_link)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="videocam-outline"
                      size={18}
                      color="#FFFFFF"
                    />
                    <Text style={styles.joinBtnText}>Join Virtual Room</Text>
                  </TouchableOpacity>

                  {/* Action Chips */}
                  <View style={styles.actionGrid}>
                    <TouchableOpacity
                      style={[styles.actionChip, styles.chipAttended]}
                      onPress={() => openActionModal("attended", session)}
                    >
                      <Text style={styles.chipTextAttended}>Attended</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionChip, styles.chipPostpone]}
                      onPress={() => openActionModal("postpone", session)}
                    >
                      <Text style={styles.chipTextPostpone}>Postpone</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionChip, styles.chipTransfer]}
                      onPress={() => openActionModal("transfer", session)}
                    >
                      <Text style={styles.chipTextTransfer}>Transfer</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionChip, styles.chipCancel]}
                      onPress={() => openActionModal("cancel", session)}
                    >
                      <Text style={styles.chipTextCancel}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* History Section */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>
            History ({historySessions.length})
          </Text>

          {historySessions.length === 0 ? (
            <Text
              style={{
                color: "#94A3B8",
                fontStyle: "italic",
                marginVertical: 8,
              }}
            >
              No completed, cancelled, or transferred sessions.
            </Text>
          ) : (
            historySessions.map((item) => {
              const client = item.client;
              const clientName = client
                ? `${client.first_name || ""} ${client.surname || ""}`.trim()
                : "Client";

              const isCancelled =
                item.status === "cancelled_by_client" ||
                item.status === "cancelled_by_counselor";
              const isTransferred = item.status === "rescheduled_requested";

              const counselorReview = item.reviews?.find(
                (r) => r.reviewer_role === "counselor",
              );
              const clientReview = item.reviews?.find(
                (r) => r.reviewer_role === "client",
              );

              return (
                <View key={item.id} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyClient}>{clientName}</Text>
                    <Text
                      style={[
                        styles.historyStatus,
                        isCancelled && styles.statusCancelled,
                        isTransferred && styles.statusTransferred,
                      ]}
                    >
                      {isCancelled
                        ? "Cancelled"
                        : isTransferred
                          ? "Transferred"
                          : "Attended"}
                    </Text>
                  </View>

                  <Text style={styles.historyMeta}>
                    {item.counseling_type} Session •{" "}
                    {formatDateTime(item.scheduled_start_time)}
                  </Text>

                  {item.notes ? (
                    <Text style={styles.historyNote}>
                      Session Notes: "{item.notes}"
                    </Text>
                  ) : counselorReview?.counselor_notes ? (
                    <Text style={styles.historyNote}>
                      Clinical Summary: "{counselorReview.counselor_notes}"
                    </Text>
                  ) : item.action_reason ? (
                    <Text style={styles.historyNote}>
                      Reason: "{item.action_reason}"
                    </Text>
                  ) : null}

                  {clientReview?.feedback_text && (
                    <Text
                      style={[
                        styles.historyNote,
                        { color: "#0369A1", marginTop: 4 },
                      ]}
                    >
                      Client Feedback: "{clientReview.feedback_text}"
                    </Text>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Action Modal */}
      <Modal
        visible={!!activeModal}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {activeModal === "cancel" && "Cancel Appointment"}
              {activeModal === "attended" && "Mark as Attended"}
              {activeModal === "transfer" && "Transfer Session"}
              {activeModal === "postpone" && "Postpone Session"}
            </Text>

            {activeModal === "postpone" && (
              <TextInput
                style={styles.modalInput}
                placeholder="Proposed Date/Time (e.g., Next Mon, 2 PM)"
                placeholderTextColor="#94A3B8"
                value={postponeDate}
                onChangeText={setPostponeDate}
              />
            )}

            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder={
                activeModal === "attended"
                  ? "Leave session notes/clinical summary..."
                  : "State reason..."
              }
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              value={modalInput}
              onChangeText={setModalInput}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={closeModal}
                disabled={actionLoading}
              >
                <Text style={styles.cancelBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleModalSubmit}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmBtnText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
