import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../../../styles/(client)/appointments/newAppointments";

const COUNSELING_TYPES = [
  "Individual",
  "Group",
  "Couple",
  "Family",
  "Student",
  "Teen",
];

const REASONS = [
  "Career",
  "Family",
  "Drug & Substance",
  "Relationships",
  "Financial",
  "Mental Health",
  "Campus Transition",
  "After Campus Transition",
  "Other",
];

const COUNSELORS = [
  {
    id: "lucy",
    name: "Counselor Lucy",
    specialty: "Mental Health & Relationships",
  },
  { id: "john", name: "Counselor John", specialty: "Career & Transitions" },
];

export default function NewAppointmentScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Form States
  const [counselingType, setCounselingType] = useState("");
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [otherReason, setOtherReason] = useState("");
  const [goals, setGoals] = useState("");
  const [hadTherapyBefore, setHadTherapyBefore] = useState(null);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [selectedCounselor, setSelectedCounselor] = useState("");

  // Date & Time Picker States
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // UI Modals
  const [showTermsModal, setShowTermsModal] = useState(false);

  const toggleReason = (item) => {
    if (selectedReasons.includes(item)) {
      setSelectedReasons((prev) => prev.filter((r) => r !== item));
    } else {
      setSelectedReasons((prev) => [...prev, item]);
    }
  };

  const validateWorkingHours = (date) => {
    const day = date.getDay();
    // 0 = Sunday, 6 = Saturday
    if (day === 0 || day === 6) {
      Alert.alert(
        "Invalid Selection",
        "Please select a weekday (Monday to Friday).",
      );
      return false;
    }

    const hours = date.getHours();
    const minutes = date.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    const startMinutes = 8 * 60;
    const lunchStart = 13 * 60;
    const lunchEnd = 14 * 60;
    const endMinutes = 17 * 60;

    if (
      totalMinutes < startMinutes ||
      totalMinutes >= endMinutes ||
      (totalMinutes >= lunchStart && totalMinutes < lunchEnd)
    ) {
      Alert.alert(
        "Invalid Time",
        "Working hours are 8:00 AM - 5:00 PM (excluding 1:00 PM - 2:00 PM lunch break).",
      );
      return false;
    }

    return true;
  };

  const handleDateChange = (event, date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (date) {
      const day = date.getDay();
      if (day === 0 || day === 6) {
        Alert.alert(
          "Weekend Selected",
          "Appointments can only be scheduled Monday to Friday.",
        );
        return;
      }
      const newDate = selectedDate ? new Date(selectedDate) : new Date();
      newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      setSelectedDate(newDate);
    }
  };

  const handleTimeChange = (event, time) => {
    if (Platform.OS === "android") setShowTimePicker(false);
    if (time) {
      const newDate = selectedDate ? new Date(selectedDate) : new Date();
      newDate.setHours(time.getHours(), time.getMinutes(), 0, 0);

      if (validateWorkingHours(newDate)) {
        setSelectedDate(newDate);
      }
    }
  };

  const handleNext = () => {
    if (step === 1 && !counselingType)
      return Alert.alert("Required", "Please select a counseling type.");
    if (step === 2 && selectedReasons.length === 0)
      return Alert.alert("Required", "Please select at least one reason.");
    if (step === 2 && selectedReasons.includes("Other") && !otherReason.trim())
      return Alert.alert("Required", "Please specify your reason.");
    if (step === 3 && !goals.trim())
      return Alert.alert("Required", "Please state what you hope to achieve.");
    if (step === 4 && hadTherapyBefore === null)
      return Alert.alert(
        "Required",
        "Please select whether you have had therapy before.",
      );
    if (step === 5 && !agreedTerms)
      return Alert.alert(
        "Required",
        "You must agree to the Terms and Conditions.",
      );
    if (step === 7 && !selectedCounselor)
      return Alert.alert("Required", "Please select a counselor.");
    if (step === 8 && !selectedDate)
      return Alert.alert("Required", "Please select a preferred date.");
    if (step === 9) {
      if (!selectedDate) {
        return Alert.alert("Required", "Please select a preferred time.");
      }
      if (!validateWorkingHours(selectedDate)) {
        return;
      }
    }

    setStep((prev) => Math.min(prev + 1, 11));
  };

  const handlePrev = () => setStep((prev) => Math.max(prev - 1, 1));

  const handlePayment = () => {
    setIsPaid(true);
    Alert.alert("Payment Successful", "Your transaction has been recorded.");
    setStep(7);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.maxContainer}>
        {/* Header Bar */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() =>
              step > 1 && step < 11 ? handlePrev() : router.back()
            }
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
            <Text style={styles.backText}>
              {step === 1 || step === 11 ? "Close" : "Back"}
            </Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Booking</Text>
        </View>

        {/* Step Indicator */}
        {step <= 10 && (
          <View style={styles.stepIndicatorContainer}>
            <Text style={styles.stepIndicatorText}>Step {step} of 10</Text>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${(step / 10) * 100}%` },
                ]}
              />
            </View>
          </View>
        )}

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* STEP 1: Counseling Type */}
          {step === 1 && (
            <View style={styles.card}>
              <Text style={styles.stepTitle}>Select Counseling Type</Text>
              <Text style={styles.stepSubtitle}>
                Choose the format that fits your current needs.
              </Text>
              <View style={styles.optionsGrid}>
                {COUNSELING_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.optionCard,
                      counselingType === type && styles.optionCardSelected,
                    ]}
                    onPress={() => setCounselingType(type)}
                  >
                    <Ionicons
                      name={
                        counselingType === type
                          ? "radio-button-on"
                          : "radio-button-off"
                      }
                      size={20}
                      color={counselingType === type ? "#936D9A" : "#94A3B8"}
                    />
                    <Text
                      style={[
                        styles.optionText,
                        counselingType === type && styles.optionTextSelected,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* STEP 2: Reasons (Multi-select) */}
          {step === 2 && (
            <View style={styles.card}>
              <Text style={styles.stepTitle}>Reasons for Seeking Guidance</Text>
              <Text style={styles.stepSubtitle}>
                Select all areas you would like to address.
              </Text>
              <View style={styles.optionsGrid}>
                {REASONS.map((item) => {
                  const isSelected = selectedReasons.includes(item);
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.optionCard,
                        isSelected && styles.optionCardSelected,
                      ]}
                      onPress={() => toggleReason(item)}
                    >
                      <Ionicons
                        name={isSelected ? "checkbox" : "square-outline"}
                        size={20}
                        color={isSelected ? "#936D9A" : "#94A3B8"}
                      />
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {selectedReasons.includes("Other") && (
                <View style={{ marginTop: 16 }}>
                  <Text style={styles.label}>Please specify:</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Describe your reason..."
                    multiline
                    value={otherReason}
                    onChangeText={setOtherReason}
                  />
                </View>
              )}
            </View>
          )}

          {/* STEP 3: Goals */}
          {step === 3 && (
            <View style={styles.card}>
              <Text style={styles.stepTitle}>Session Goals</Text>
              <Text style={styles.stepSubtitle}>
                What do you hope to achieve by the end of your sessions?
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Share your goals and expectations..."
                multiline
                numberOfLines={5}
                value={goals}
                onChangeText={setGoals}
              />
            </View>
          )}

          {/* STEP 4: Previous Therapy */}
          {step === 4 && (
            <View style={styles.card}>
              <Text style={styles.stepTitle}>Previous Therapy Experience</Text>
              <Text style={styles.stepSubtitle}>
                Have you been to counseling or therapy before?
              </Text>
              <View style={styles.optionsGrid}>
                <TouchableOpacity
                  style={[
                    styles.optionCard,
                    hadTherapyBefore === true && styles.optionCardSelected,
                  ]}
                  onPress={() => setHadTherapyBefore(true)}
                >
                  <Ionicons
                    name={
                      hadTherapyBefore === true
                        ? "radio-button-on"
                        : "radio-button-off"
                    }
                    size={20}
                    color={hadTherapyBefore === true ? "#936D9A" : "#94A3B8"}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      hadTherapyBefore === true && styles.optionTextSelected,
                    ]}
                  >
                    Yes
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.optionCard,
                    hadTherapyBefore === false && styles.optionCardSelected,
                  ]}
                  onPress={() => setHadTherapyBefore(false)}
                >
                  <Ionicons
                    name={
                      hadTherapyBefore === false
                        ? "radio-button-on"
                        : "radio-button-off"
                    }
                    size={20}
                    color={hadTherapyBefore === false ? "#936D9A" : "#94A3B8"}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      hadTherapyBefore === false && styles.optionTextSelected,
                    ]}
                  >
                    No
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 5: Terms & Conditions */}
          {step === 5 && (
            <View style={styles.card}>
              <Text style={styles.stepTitle}>Terms & Consent</Text>
              <Text style={styles.stepSubtitle}>
                Please review and accept our policy before proceeding.
              </Text>
              <TouchableOpacity
                style={styles.checkboxRow}
                activeOpacity={0.8}
                onPress={() => setAgreedTerms(!agreedTerms)}
              >
                <View
                  style={[
                    styles.checkbox,
                    agreedTerms && styles.checkboxActive,
                  ]}
                >
                  {agreedTerms && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </View>
                <Text style={styles.termsText}>
                  I agree to the{" "}
                  <Text
                    style={styles.linkText}
                    onPress={() => setShowTermsModal(true)}
                  >
                    Terms and Conditions
                  </Text>{" "}
                  and consent to receiving virtual counseling services.
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 6: Payment Screen */}
          {step === 6 && (
            <View style={styles.card}>
              <Text style={styles.stepTitle}>Session Payment</Text>
              <Text style={styles.stepSubtitle}>
                Complete payment to reserve your booking slot.
              </Text>

              <View style={styles.priceBadge}>
                <Text style={styles.priceText}>KES 2,000</Text>
                <Text style={styles.priceSub}>
                  Per standard 50-minute session
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.navBtn, styles.nextBtn, { marginTop: 12 }]}
                onPress={handlePayment}
              >
                <Text style={styles.nextBtnText}>
                  {isPaid ? "Payment Completed" : "Pay via M-Pesa"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 7: Counselor Selection */}
          {step === 7 && (
            <View style={styles.card}>
              <Text style={styles.stepTitle}>Select Counselor</Text>
              <Text style={styles.stepSubtitle}>
                Choose a specialist for your sessions.
              </Text>
              <View style={styles.optionsGrid}>
                {COUNSELORS.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.optionCard,
                      selectedCounselor === c.name && styles.optionCardSelected,
                    ]}
                    onPress={() => setSelectedCounselor(c.name)}
                  >
                    <Ionicons
                      name={
                        selectedCounselor === c.name
                          ? "radio-button-on"
                          : "radio-button-off"
                      }
                      size={20}
                      color={
                        selectedCounselor === c.name ? "#936D9A" : "#94A3B8"
                      }
                    />
                    <View>
                      <Text
                        style={[
                          styles.optionText,
                          selectedCounselor === c.name &&
                            styles.optionTextSelected,
                        ]}
                      >
                        {c.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: "#64748B" }}>
                        {c.specialty}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* STEP 8: Preferred Date */}
          {step === 8 && (
            <View style={styles.card}>
              <Text style={styles.stepTitle}>Preferred Date</Text>
              <Text style={styles.stepSubtitle}>
                Select a weekday (Monday–Friday).
              </Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{ color: selectedDate ? "#0F172A" : "#94A3B8" }}>
                  {selectedDate
                    ? selectedDate.toDateString()
                    : "Select Working Day"}
                </Text>
              </TouchableOpacity>

              {(showDatePicker || Platform.OS === "ios") && (
                <DateTimePicker
                  value={selectedDate || new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "inline" : "default"}
                  minimumDate={new Date()}
                  onChange={handleDateChange}
                />
              )}
            </View>
          )}

          {/* STEP 9: Preferred Time */}
          {step === 9 && (
            <View style={styles.card}>
              <Text style={styles.stepTitle}>Preferred Time</Text>
              <Text style={styles.stepSubtitle}>
                Working hours: 8:00 AM–5:00 PM (Lunch break: 1:00 PM–2:00 PM).
              </Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={{ color: selectedDate ? "#0F172A" : "#94A3B8" }}>
                  {selectedDate
                    ? selectedDate.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Select Working Time"}
                </Text>
              </TouchableOpacity>

              {(showTimePicker || Platform.OS === "ios") && (
                <DateTimePicker
                  value={selectedDate || new Date()}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleTimeChange}
                />
              )}
            </View>
          )}

          {/* STEP 10: Confirm Details Page */}
          {step === 10 && (
            <View style={styles.card}>
              <Text style={styles.stepTitle}>Confirm Booking Details</Text>
              <Text style={styles.stepSubtitle}>
                Verify your information before submitting.
              </Text>

              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Counseling Type</Text>
                <Text style={styles.reviewValue}>{counselingType}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Reasons</Text>
                <Text style={styles.reviewValue}>
                  {selectedReasons
                    .map((r) => (r === "Other" ? `Other: ${otherReason}` : r))
                    .join(", ")}
                </Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Counselor</Text>
                <Text style={styles.reviewValue}>{selectedCounselor}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Date & Time</Text>
                <Text style={styles.reviewValue}>
                  {selectedDate?.toDateString()} at{" "}
                  {selectedDate?.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Payment Status</Text>
                <Text
                  style={[
                    styles.reviewValue,
                    { color: isPaid ? "#16A34A" : "#DC2626" },
                  ]}
                >
                  {isPaid ? "Paid" : "Pending"}
                </Text>
              </View>
            </View>
          )}

          {/* STEP 11: Booking Status Page */}
          {step === 11 && (
            <View style={[styles.card, styles.statusContainer]}>
              <Ionicons
                name={isPaid ? "checkmark-circle" : "time-outline"}
                size={72}
                color={isPaid ? "#16A34A" : "#D97706"}
              />
              <Text style={styles.statusTitle}>
                {isPaid ? "Booking Confirmed!" : "Booking Under Review"}
              </Text>
              <Text style={styles.statusBody}>
                {isPaid
                  ? "Your session has been scheduled and paid for. Check your appointments tab for details."
                  : "Your appointment request has been logged. Pending payment confirmation."}
              </Text>

              <TouchableOpacity
                style={[styles.navBtn, styles.nextBtn, { width: "100%" }]}
                onPress={() => router.replace("/appointment")}
              >
                <Text style={styles.nextBtnText}>Return to Appointments</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step Navigation Buttons */}
          {step <= 10 && (
            <View style={styles.btnRow}>
              {step > 1 && (
                <TouchableOpacity
                  style={[styles.navBtn, styles.prevBtn]}
                  onPress={handlePrev}
                >
                  <Text style={styles.prevBtnText}>Previous</Text>
                </TouchableOpacity>
              )}
              {step !== 6 && (
                <TouchableOpacity
                  style={[styles.navBtn, styles.nextBtn]}
                  onPress={handleNext}
                >
                  <Text style={styles.nextBtnText}>
                    {step === 10 ? "Submit Booking" : "Next"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Terms & Conditions Modal */}
      <Modal visible={showTermsModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Terms & Conditions</Text>
            <ScrollView showsVerticalScrollIndicator>
              <Text style={styles.modalBody}>
                1. Nature of Services: Online virtual counseling and coaching
                services delivered via Zoom or Google Meet.{"\n\n"}
                2. Non-Emergency: Services do not provide medical or psychiatric
                emergency intervention.{"\n\n"}
                3. Confidentiality: Sessions are confidential except where there
                is risk of harm or legal compulsion under Kenyan Law.{"\n\n"}
                4. Data Protection: Handled in compliance with the Data
                Protection Act 2019 (Kenya).
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowTermsModal(false)}
            >
              <Text style={styles.modalCloseText}>I Understand</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
