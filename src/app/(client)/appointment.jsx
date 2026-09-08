import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  FlatList,
  LayoutAnimation,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../../styles/(client)/appointments/index";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function AppointmentScreen() {
  const router = useRouter();

  const [expandedId, setExpandedId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [reviewText, setReviewText] = useState("");

  const [appointments, setAppointments] = useState([
    {
      id: "1",
      counselor: "Counselor Lucy",
      type: "Individual",
      date: "Mon, Sep 14, 2026",
      time: "10:00 AM",
      status: "Confirmed",
      isPaid: true,
    },
    {
      id: "2",
      counselor: "Counselor John",
      type: "Career",
      date: "Wed, Sep 16, 2026",
      time: "02:00 PM",
      status: "Pending Payment",
      isPaid: false,
    },
    {
      id: "3",
      counselor: "Counselor Lucy",
      type: "Mental Health",
      date: "Fri, Sep 04, 2026",
      time: "11:00 AM",
      status: "Done",
      isPaid: true,
    },
  ]);

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((prev) => (prev === id ? null : id));
    setCancelReason("");
    setReviewText("");
  };

  const handleCancelAppointment = (id) => {
    if (!cancelReason.trim()) {
      return Alert.alert(
        "Required",
        "Please provide a reason for cancellation.",
      );
    }

    setAppointments((prev) =>
      prev.map((app) =>
        app.id === id ? { ...app, status: "Cancelled" } : app,
      ),
    );
    setCancelReason("");
    setExpandedId(null);
    Alert.alert("Cancelled", "Your appointment has been cancelled.");
  };

  const handleSaveReview = (id) => {
    if (!reviewText.trim()) {
      return Alert.alert(
        "Required",
        "Please enter a review before submitting.",
      );
    }

    Alert.alert("Thank You", "Your review has been submitted.");
    setReviewText("");
    setExpandedId(null);
  };

  const handleDeleteAppointment = (id) => {
    Alert.alert(
      "Delete Appointment",
      "Are you sure you want to remove this record?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setAppointments((prev) => prev.filter((app) => app.id !== id));
            setExpandedId(null);
          },
        },
      ],
    );
  };

  const renderAppointmentCard = ({ item }) => {
    const isExpanded = expandedId === item.id;
    const isDone = item.status === "Done";
    const isCancelled = item.status === "Cancelled";

    return (
      <View style={styles.card}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => toggleExpand(item.id)}
        >
          <View style={styles.cardHeader}>
            <View style={styles.counselorInfo}>
              <Ionicons
                name="person-circle-outline"
                size={32}
                color="#936D9A"
              />
              <View>
                <Text style={styles.counselorName}>{item.counselor}</Text>
                <Text style={styles.typeText}>{item.type} Session</Text>
              </View>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isDone
                    ? "#E0F2FE"
                    : isCancelled
                      ? "#FEE2E2"
                      : item.isPaid
                        ? "#DCFCE7"
                        : "#FEF3C7",
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color: isDone
                      ? "#0369A1"
                      : isCancelled
                        ? "#DC2626"
                        : item.isPaid
                          ? "#15803D"
                          : "#B45309",
                  },
                ]}
              >
                {item.status}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.cardFooter}>
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={16} color="#64748B" />
              <Text style={styles.metaText}>{item.date}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={16} color="#64748B" />
              <Text style={styles.metaText}>{item.time}</Text>
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
            {isDone ? (
              /* Review & Delete for Completed Appointments */
              <View>
                <Text style={styles.actionLabel}>Leave a Review</Text>
                <TextInput
                  style={styles.actionInput}
                  placeholder="Share feedback on your session..."
                  placeholderTextColor="#94A3B8"
                  value={reviewText}
                  onChangeText={setReviewText}
                  multiline
                />
                <View style={styles.actionButtonRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDeleteAppointment(item.id)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#DC2626" />
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.submitBtn]}
                    onPress={() => handleSaveReview(item.id)}
                  >
                    <Text style={styles.submitBtnText}>Submit Review</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : !isCancelled ? (
              /* Cancel & Reason Input for Active Appointments */
              <View>
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
                >
                  <Text style={styles.cancelBtnText}>Confirm Cancellation</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Cancelled State Notice */
              <Text style={styles.cancelledNotice}>
                This appointment was cancelled.
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.maxContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Your Appointment(s)</Text>
          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.7}
            onPress={() => router.push("/appointments/newAppointments")}
          >
            <Ionicons name="add" size={24} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {appointments.length > 0 ? (
          <FlatList
            data={appointments}
            keyExtractor={(item) => item.id}
            renderItem={renderAppointmentCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.sectionContainer}>
            <Ionicons name="calendar-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptySubtitle}>
              You have no appointments scheduled at the moment.
            </Text>
            <TouchableOpacity
              style={styles.bookButton}
              activeOpacity={0.8}
              onPress={() => router.push("/appointments/newAppointments")}
            >
              <Text style={styles.bookButtonText}>Book Appointment</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
