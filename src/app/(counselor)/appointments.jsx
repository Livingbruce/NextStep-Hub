import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../../styles/(counselor)/appointment";

const INITIAL_SESSIONS = [
  {
    id: "s1",
    clientName: "Brian Kiprop",
    category: "Pre-Campus Transition",
    date: "Today, 2:30 PM",
    timestamp: 1,
    meetLink: "https://meet.google.com/abc-defg-hij",
    phone: "0712345678",
    county: "Meru",
    status: "Upcoming",
  },
  {
    id: "s2",
    clientName: "Wanjiru Kamau",
    category: "Post-Campus Career Pitching",
    date: "Tomorrow, 10:00 AM",
    timestamp: 2,
    meetLink: "",
    phone: "0798765432",
    county: "Nairobi",
    status: "Scheduled",
  },
];

const INITIAL_HISTORY = [
  {
    id: "h1",
    clientName: "Mercy Chebet",
    category: "High School to Uni Transition",
    completedAt: "Yesterday, 4:00 PM",
    status: "Attended",
    note: "Great progress on course selections.",
  },
];

export default function AppointmentsScreen() {
  const [sessions, setSessions] = useState(INITIAL_SESSIONS);
  const [history, setHistory] = useState(INITIAL_HISTORY);
  const [blockedDates, setBlockedDates] = useState({});
  const [editingLinks, setEditingLinks] = useState({});

  // Modal State
  const [activeModal, setActiveModal] = useState(null); // 'cancel' | 'attended' | 'transfer' | 'postpone'
  const [selectedSession, setSelectedSession] = useState(null);
  const [modalInput, setModalInput] = useState("");
  const [postponeDate, setPostponeDate] = useState("");

  // Disabled weekend marking generator
  const calendarMarkedDates = useMemo(() => {
    const marks = { ...blockedDates };
    // Example: Disable weekends for current/next month visually if needed or merge with explicitly blocked dates
    return marks;
  }, [blockedDates]);

  // Handle Date Selection (Blackout Dates)
  const handleDayPress = (day) => {
    const dateStr = day.dateString;
    const dateObj = new Date(day.timestamp);
    const dayOfWeek = dateObj.getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      Alert.alert("Weekend", "Weekends are non-working days by default.");
      return;
    }

    setBlockedDates((prev) => {
      const copy = { ...prev };
      if (copy[dateStr]) {
        delete copy[dateStr]; // Toggle off
      } else {
        copy[dateStr] = {
          selected: true,
          selectedColor: "#EF4444",
          disableTouchEvent: false,
        };
      }
      return copy;
    });
  };

  // Virtual Room Link Handlers
  const handleLinkChange = (id, text) => {
    setEditingLinks((prev) => ({ ...prev, [id]: text }));
  };

  const handleSaveLink = (id) => {
    const linkToSave = editingLinks[id];
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, meetLink: linkToSave } : s)),
    );
    Alert.alert("Success", "Virtual meeting link updated!");
  };

  const handleJoinCall = (url) => {
    if (!url) {
      Alert.alert("No Link", "Please add a Google Meet or Zoom link first.");
      return;
    }
    Linking.openURL(url).catch(() => Alert.alert("Error", "Cannot open URL."));
  };

  // Action Modal Handlers
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

  const handleModalSubmit = () => {
    if (!selectedSession) return;

    if (activeModal === "cancel") {
      setSessions((prev) => prev.filter((s) => s.id !== selectedSession.id));
      setHistory((prev) => [
        {
          id: `h_${Date.now()}`,
          clientName: selectedSession.clientName,
          category: selectedSession.category,
          completedAt: "Just now",
          status: "Cancelled",
          note: modalInput || "No reason provided",
        },
        ...prev,
      ]);
    } else if (activeModal === "attended") {
      setSessions((prev) => prev.filter((s) => s.id !== selectedSession.id));
      setHistory((prev) => [
        {
          id: `h_${Date.now()}`,
          clientName: selectedSession.clientName,
          category: selectedSession.category,
          completedAt: "Just now",
          status: "Attended",
          note: modalInput || "Session completed successfully",
        },
        ...prev,
      ]);
    } else if (activeModal === "transfer") {
      Alert.alert("Transferred", `Session transferred. Reason: ${modalInput}`);
      setSessions((prev) => prev.filter((s) => s.id !== selectedSession.id));
    } else if (activeModal === "postpone") {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === selectedSession.id
            ? { ...s, date: postponeDate || "Postponed Date" }
            : s,
        ),
      );
      Alert.alert("Postponed", `Session moved to ${postponeDate}.`);
    }

    closeModal();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Appointments & Schedule</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Calendar Blackout Section */}
        <View style={styles.calendarCard}>
          <Text style={styles.sectionTitle}>Set Unavailable Dates</Text>
          <Text style={styles.sectionSub}>
            Tap a weekday to block/unblock. Weekends are automatically
            non-working.
          </Text>
          <Calendar
            onDayPress={handleDayPress}
            markedDates={calendarMarkedDates}
            theme={{
              todayTextColor: "#16A34A",
              arrowColor: "#16A34A",
              textDisabledColor: "#CBD5E1", // Greyed out non-working days
            }}
          />
        </View>

        {/* Current Appointments */}
        <View style={styles.sessionsSection}>
          <Text style={styles.sectionTitle}>
            Current Appointments ({sessions.length})
          </Text>

          {sessions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons
                name="calendar-clear-outline"
                size={36}
                color="#94A3B8"
              />
              <Text style={styles.emptyText}>
                There are no appointments at the moment.
              </Text>
            </View>
          ) : (
            sessions
              .sort((a, b) => a.timestamp - b.timestamp)
              .map((session) => (
                <View key={session.id} style={styles.sessionCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{session.category}</Text>
                    </View>
                    <Text style={styles.timeText}>{session.date}</Text>
                  </View>

                  <Text style={styles.clientName}>{session.clientName}</Text>
                  <Text style={styles.clientMeta}>
                    Location: {session.county} County • Contact: {session.phone}
                  </Text>

                  {/* Virtual Room Input & Save */}
                  <View style={styles.linkContainer}>
                    <TextInput
                      style={styles.linkInput}
                      placeholder="Add Google Meet or Zoom link..."
                      placeholderTextColor="#94A3B8"
                      value={
                        editingLinks[session.id] !== undefined
                          ? editingLinks[session.id]
                          : session.meetLink
                      }
                      onChangeText={(text) =>
                        handleLinkChange(session.id, text)
                      }
                    />
                    <TouchableOpacity
                      style={styles.saveLinkBtn}
                      onPress={() => handleSaveLink(session.id)}
                    >
                      <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>

                  {/* Join Room CTA */}
                  <TouchableOpacity
                    style={styles.joinBtn}
                    onPress={() => handleJoinCall(session.meetLink)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="videocam-outline"
                      size={18}
                      color="#FFFFFF"
                    />
                    <Text style={styles.joinBtnText}>Join Virtual Room</Text>
                  </TouchableOpacity>

                  {/* Prompt Action Buttons */}
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
              ))
          )}
        </View>

        {/* History Section */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>History</Text>
          {history.map((item) => (
            <View key={item.id} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyClient}>{item.clientName}</Text>
                <Text
                  style={[
                    styles.historyStatus,
                    item.status === "Cancelled" && styles.statusCancelled,
                  ]}
                >
                  {item.status}
                </Text>
              </View>
              <Text style={styles.historyMeta}>
                {item.category} • {item.completedAt}
              </Text>
              {item.note ? (
                <Text style={styles.historyNote}>"{item.note}"</Text>
              ) : null}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Reusable Action Prompt Modal */}
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
                placeholder="New Date & Time (e.g. Next Mon, 3 PM)"
                placeholderTextColor="#94A3B8"
                value={postponeDate}
                onChangeText={setPostponeDate}
              />
            )}

            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder={
                activeModal === "attended"
                  ? "Leave session notes/comments..."
                  : "State reason..."
              }
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              value={modalInput}
              onChangeText={setModalInput}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                <Text style={styles.cancelBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleModalSubmit}
              >
                <Text style={styles.confirmBtnText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
