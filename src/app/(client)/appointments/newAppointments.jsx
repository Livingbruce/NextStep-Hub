import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  createNotification,
  NOTIFICATION_TYPES,
  notifyAdmins,
} from "../../../../libs/notifications";
import { supabase } from "../../../../libs/supabase";
import { styles } from "../../../styles/(client)/appointments/newAppointments";

const STORAGE_KEY = "@booking_draft_v1";

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

export default function NewAppointmentScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetchingCounselors, setFetchingCounselors] = useState(true);
  const [isDraftRestored, setIsDraftRestored] = useState(false);

  // Dynamic Counselor Data from Database
  const [counselors, setCounselors] = useState([]);

  // Form States
  const [counselingType, setCounselingType] = useState("");
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [otherReason, setOtherReason] = useState("");
  const [goals, setGoals] = useState("");
  const [hadTherapyBefore, setHadTherapyBefore] = useState(null);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [selectedCounselorId, setSelectedCounselorId] = useState("");
  const [mpesaRef, setMpesaRef] = useState("");

  // Date & Time Picker States
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // UI Modals
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    fetchCounselors();
    fetchSystemSettings();
    loadDraft();
  }, []);

  useEffect(() => {
    if (!isDraftRestored) return;
    if (step === 11) return;
    saveDraft();
  }, [
    step,
    counselingType,
    selectedReasons,
    otherReason,
    goals,
    hadTherapyBefore,
    agreedTerms,
    isPaid,
    selectedCounselorId,
    mpesaRef,
    selectedDate,
    isDraftRestored,
  ]);

  const fetchSystemSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "session_pricing")
        .single();

      if (error) throw error;

      if (data?.value) {
        setSession(data.value);
      }
    } catch (err) {
      console.error("Error fetching system settings:", err);
    }
  };

  // Fetch Counselors matching role='counselor' AND approved=true AND suspended=false
  const fetchCounselors = async () => {
    try {
      setFetchingCounselors(true);
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, first_name, surname, specializations, about, years_of_experience, avatar_url, role, absent_days",
        )
        .eq("role", "Counselor")
        .eq("approved", true)
        .eq("suspended", false);

      if (error) throw error;
      setCounselors(data || []);
    } catch (err) {
      console.error("Error fetching counselors:", err);
      Alert.alert("Error", "Could not load counselors list.");
    } finally {
      setFetchingCounselors(false);
    }
  };

  const loadDraft = async () => {
    try {
      const savedDraft = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.step && parsed.step < 11) setStep(parsed.step);
        if (parsed.counselingType) setCounselingType(parsed.counselingType);
        if (parsed.selectedReasons) setSelectedReasons(parsed.selectedReasons);
        if (parsed.otherReason) setOtherReason(parsed.otherReason);
        if (parsed.goals) setGoals(parsed.goals);
        if (parsed.hadTherapyBefore !== undefined)
          setHadTherapyBefore(parsed.hadTherapyBefore);
        if (parsed.agreedTerms !== undefined)
          setAgreedTerms(parsed.agreedTerms);
        if (parsed.isPaid !== undefined) setIsPaid(parsed.isPaid);
        if (parsed.selectedCounselorId)
          setSelectedCounselorId(parsed.selectedCounselorId);
        if (parsed.mpesaRef) setMpesaRef(parsed.mpesaRef);
        if (parsed.selectedDate) setSelectedDate(new Date(parsed.selectedDate));
      }
    } catch (err) {
      console.error("Failed to load booking draft:", err);
    } finally {
      setIsDraftRestored(true);
    }
  };

  const saveDraft = async () => {
    try {
      const draftData = {
        step,
        counselingType,
        selectedReasons,
        otherReason,
        goals,
        hadTherapyBefore,
        agreedTerms,
        isPaid,
        selectedCounselorId,
        mpesaRef,
        selectedDate: selectedDate ? selectedDate.toISOString() : null,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(draftData));
    } catch (err) {
      console.error("Failed to save booking draft:", err);
    }
  };

  const clearDraft = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setStep(1);
      setCounselingType("");
      setSelectedReasons([]);
      setOtherReason("");
      setGoals("");
      setHadTherapyBefore(null);
      setAgreedTerms(false);
      setIsPaid(false);
      setSelectedCounselorId("");
      setMpesaRef("");
      setSelectedDate(null);
    } catch (err) {
      console.error("Failed to clear booking draft:", err);
    }
  };

  const handleClearDraftClick = () => {
    Alert.alert(
      "Clear Draft",
      "Are you sure you want to reset all entered information and start over?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset Form", style: "destructive", onPress: clearDraft },
      ],
    );
  };

  const toggleReason = (item) => {
    if (selectedReasons.includes(item)) {
      setSelectedReasons((prev) => prev.filter((r) => r !== item));
    } else {
      setSelectedReasons((prev) => [...prev, item]);
    }
  };

  // Helper to format Date to YYYY-MM-DD
  const formatDateToISO = (date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Check counselor absent list
  const isCounselorAbsent = (date, counselorId) => {
    if (!date || !counselorId) return false;
    const counselor = counselors.find((c) => c.id === counselorId);
    if (!counselor || !Array.isArray(counselor.absent_days)) return false;

    const dateString = formatDateToISO(date);
    return counselor.absent_days.includes(dateString);
  };

  const validateWorkingHours = (date) => {
    const day = date.getDay();
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

  const handleDateValueChange = (event, selectedValue) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (!selectedValue) return;

    const day = selectedValue.getDay();
    if (day === 0 || day === 6) {
      Alert.alert(
        "Weekend Selected",
        "Appointments can only be scheduled Monday to Friday.",
      );
      return;
    }

    if (isCounselorAbsent(selectedValue, selectedCounselorId)) {
      Alert.alert(
        "Counselor Unavailable",
        "The selected counselor is marked as absent on this date. Please pick another date.",
      );
      return;
    }

    const baseDate = selectedDate ? new Date(selectedDate) : new Date();
    baseDate.setFullYear(
      selectedValue.getFullYear(),
      selectedValue.getMonth(),
      selectedValue.getDate(),
    );
    setSelectedDate(baseDate);
  };

  const handleTimeValueChange = (event, selectedValue) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }

    if (!selectedValue) return;

    const baseDate = selectedDate ? new Date(selectedDate) : new Date();
    baseDate.setHours(
      selectedValue.getHours(),
      selectedValue.getMinutes(),
      0,
      0,
    );

    if (validateWorkingHours(baseDate)) {
      setSelectedDate(baseDate);
    }
  };

  const handlePickerDismiss = () => {
    setShowDatePicker(false);
    setShowTimePicker(false);
  };

  const handleSubmitBooking = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        Alert.alert(
          "Authentication Error",
          "Please sign in to make a booking.",
        );
        setLoading(false);
        return;
      }

      const startTime = new Date(selectedDate);
      const endTime = new Date(startTime.getTime() + 50 * 60000);

      const payload = {
        client_id: user.id,
        counselor_id: selectedCounselorId,
        counseling_type: counselingType,
        reasons: selectedReasons,
        other_reason: selectedReasons.includes("Other") ? otherReason : null,
        session_goals: goals,
        had_therapy_before: hadTherapyBefore,
        agreed_terms: agreedTerms,
        payment_status: isPaid ? "completed" : "pending",
        payment_amount: session?.amount ? Number(session.amount) : 0,
        currency: session?.currency || "KES",
        mpesa_transaction_reference: mpesaRef || null,
        scheduled_start_time: startTime.toISOString(),
        scheduled_end_time: endTime.toISOString(),
        status: isPaid ? "scheduled" : "pending_payment",
      };

      const { error } = await supabase.from("appointments").insert([payload]);

      if (error) throw error;

      await createNotification({
        recipientId: selectedCounselorId,
        type: NOTIFICATION_TYPES.NEW_APPOINTMENT,
        title: "New Appointment Booked",
        body: `A new ${counselingType} session has been booked with you.`,
      });

      await notifyAdmins({
        type: NOTIFICATION_TYPES.NEW_APPOINTMENT_ADMIN,
        title: "New Appointment Created",
        body: `A new ${counselingType} session was booked.`,
      });

      await AsyncStorage.removeItem(STORAGE_KEY);
      setStep(11);
    } catch (err) {
      console.error("Booking Error:", err);
      Alert.alert(
        "Submission Error",
        err.message || "Failed to create appointment.",
      );
    } finally {
      setLoading(false);
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
    if (step === 7 && !selectedCounselorId)
      return Alert.alert("Required", "Please select a counselor.");
    if (step === 8) {
      if (!selectedDate) {
        return Alert.alert("Required", "Please select a preferred date.");
      }
      if (isCounselorAbsent(selectedDate, selectedCounselorId)) {
        return Alert.alert(
          "Counselor Unavailable",
          "The counselor will not be available on this date. Please pick another date.",
        );
      }
    }
    if (step === 9) {
      if (!selectedDate) {
        return Alert.alert("Required", "Please select a preferred time.");
      }
      if (!validateWorkingHours(selectedDate)) {
        return;
      }
    }
    if (step === 10) {
      return handleSubmitBooking();
    }

    setStep((prev) => Math.min(prev + 1, 11));
  };

  const handlePrev = () => setStep((prev) => Math.max(prev - 1, 1));

  const handlePayment = () => {
    const mockRef = `MX${Math.floor(100000 + Math.random() * 900000)}`;
    setMpesaRef(mockRef);
    setIsPaid(true);
    Alert.alert("Payment Received", `Transaction Ref: ${mockRef}`);
    setStep(7);
  };

  const handleExitOrClose = async () => {
    if (step === 11) {
      await clearDraft();
    }
    router.back();
  };

  const selectedCounselorObj = counselors.find(
    (c) => c.id === selectedCounselorId,
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.maxContainer}>
        {/* Header Bar */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() =>
              step > 1 && step < 11 ? handlePrev() : handleExitOrClose()
            }
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
            <Text style={styles.backText}>
              {step === 1 || step === 11 ? "Close" : "Back"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>New Booking</Text>

          {step <= 10 ? (
            <TouchableOpacity
              onPress={handleClearDraftClick}
              activeOpacity={0.7}
            >
              <Text
                style={{ color: "#DC2626", fontWeight: "600", fontSize: 13 }}
              >
                Clear Draft
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 60 }} />
          )}
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
                <Text style={styles.priceText}>
                  {session?.currency || "KES"}{" "}
                  {session?.amount ? session.amount.toLocaleString() : "..."}
                </Text>
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

              {fetchingCounselors ? (
                <ActivityIndicator
                  size="large"
                  color="#936D9A"
                  style={{ marginVertical: 20 }}
                />
              ) : counselors.length === 0 ? (
                <Text style={{ color: "#64748B", marginVertical: 20 }}>
                  No available counselors found. Please check back later.
                </Text>
              ) : (
                <View style={styles.optionsGrid}>
                  {counselors.map((c) => {
                    const isSelected = selectedCounselorId === c.id;
                    const fullName =
                      `Counselor ${c.first_name || ""} ${c.surname || ""}`.trim();

                    const formattedSpecs =
                      Array.isArray(c.specializations) &&
                      c.specializations.length > 0
                        ? c.specializations.join(" • ")
                        : "General Counseling";

                    return (
                      <TouchableOpacity
                        key={c.id}
                        style={[
                          styles.counselorCard,
                          isSelected && styles.optionCardSelected,
                        ]}
                        onPress={() => setSelectedCounselorId(c.id)}
                        activeOpacity={0.85}
                      >
                        <Ionicons
                          name={
                            isSelected ? "radio-button-on" : "radio-button-off"
                          }
                          size={22}
                          color={isSelected ? "#936D9A" : "#94A3B8"}
                          style={{ marginTop: 2 }}
                        />

                        <View style={styles.counselorInfoContainer}>
                          <Text
                            style={[
                              styles.counselorName,
                              isSelected && styles.optionTextSelected,
                            ]}
                          >
                            {fullName}
                          </Text>

                          {c.years_of_experience != null && (
                            <Text style={styles.counselorExp}>
                              {c.years_of_experience}{" "}
                              {c.years_of_experience === 1 ? "year" : "years"}{" "}
                              of experience
                            </Text>
                          )}

                          <Text style={styles.counselorSpec} numberOfLines={2}>
                            {formattedSpecs}
                          </Text>

                          {c.about ? (
                            <Text
                              style={styles.counselorAbout}
                              numberOfLines={2}
                            >
                              {c.about}
                            </Text>
                          ) : null}
                        </View>

                        <View style={styles.avatarWrapper}>
                          {c.avatar_url ? (
                            <Image
                              source={{ uri: c.avatar_url }}
                              style={styles.counselorAvatar}
                            />
                          ) : (
                            <View
                              style={[
                                styles.counselorAvatar,
                                styles.avatarFallback,
                              ]}
                            >
                              <Ionicons
                                name="person"
                                size={24}
                                color="#936D9A"
                              />
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
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

              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate || new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onValueChange={handleDateValueChange}
                  onDismiss={handlePickerDismiss}
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

              {showTimePicker && (
                <DateTimePicker
                  value={selectedDate || new Date()}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onValueChange={handleTimeValueChange}
                  onDismiss={handlePickerDismiss}
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
                <Text style={styles.reviewValue}>
                  {selectedCounselorObj
                    ? `${selectedCounselorObj.first_name} ${selectedCounselorObj.surname}`
                    : "Not Selected"}
                </Text>
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
                  {isPaid ? `Paid (${mpesaRef})` : "Pending"}
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
                {isPaid ? "Booking Confirmed!" : "Booking Pending"}
              </Text>
              <Text style={styles.statusBody}>
                {isPaid
                  ? "Your session has been scheduled and paid for. Check your appointments tab for details."
                  : "Your appointment request has been logged into the database. Pending payment confirmation."}
              </Text>

              <TouchableOpacity
                style={[styles.navBtn, styles.nextBtn, { width: "100%" }]}
                onPress={async () => {
                  await clearDraft();
                  router.replace("/appointment");
                }}
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
                  disabled={loading}
                >
                  <Text style={styles.prevBtnText}>Previous</Text>
                </TouchableOpacity>
              )}
              {step !== 6 && (
                <TouchableOpacity
                  style={[styles.navBtn, styles.nextBtn]}
                  onPress={handleNext}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.nextBtnText}>
                      {step === 10 ? "Submit Booking" : "Next"}
                    </Text>
                  )}
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
