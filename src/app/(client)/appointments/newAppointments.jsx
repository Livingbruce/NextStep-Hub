import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInLeft,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  createNotification,
  NOTIFICATION_TYPES,
  notifyAdmins,
} from "../../../../libs/notifications";
import { supabase } from "../../../../libs/supabase";
import PressableScale from "../../../components/client/appointments/PressableScale";
import {
  CounselorStep,
  DoneStep,
  GoalsStep,
  ReasonsStep,
  ReviewStep,
  SessionStep,
  TimeStep,
  TypeStep,
} from "../../../components/client/booking/BookingSteps";
import {
  addMinutes,
  atMinutes,
  buildSlots,
  upcomingWeekdays,
  validateKenyanPhone,
} from "../../../components/client/booking/slots";
import { sendEmail } from "../../../services/emailServer";
import {
  clientBookingEmail,
  counselorBookingEmail,
} from "../../../services/emailTemplates";
import { b } from "../../../styles/(client)/appointments/booking";

const DRAFT_KEY = "@booking_draft_v2";
const TOTAL = 7;
const DONE = 8;

const META = {
  1: ["What kind of session?", "Choose the format that fits you."],
  2: ["What brings you here?", "Pick everything you'd like to talk about."],
  3: ["Your goals", "This helps your counselor prepare."],
  4: [
    "Session length and format",
    "Decide how long and how you'd like to connect.",
  ],
  5: ["Choose your counselor", "Pick someone who fits what you need."],
  6: [
    "Pick a date and time",
    "Mon to Fri, 8:00 AM to 5:00 PM. Lunch is 1:00 to 2:00 PM.",
  ],
  7: ["Review and pay", "Check the details, then confirm your booking."],
};

const INITIAL = {
  type: "",
  reasons: [],
  otherReason: "",
  goals: "",
  therapy: null,
  duration: 50,
  mode: "online",
  callPhone: "",
  counselorId: "",
  dateStr: "",
  slot: null, // start time as minutes from midnight
  agreed: false,
};

// Busy windows for a counselor on a day. Uses the RPC (works under RLS) and
// falls back to a direct read if the function hasn't been created yet.
async function loadBusy(counselorId, dateStr) {
  const from = atMinutes(dateStr, 0);
  const to = new Date(from.getTime() + 24 * 3600000);

  const rpc = await supabase.rpc("get_counselor_busy_times", {
    p_counselor_id: counselorId,
    p_from: from.toISOString(),
    p_to: to.toISOString(),
  });
  let rows = rpc.data;

  if (rpc.error) {
    const { data } = await supabase
      .from("appointments")
      .select("scheduled_start_time, scheduled_end_time")
      .eq("counselor_id", counselorId)
      .not(
        "status",
        "in",
        '("cancelled_by_client","cancelled_by_counselor","no_show")',
      )
      .lt("scheduled_start_time", to.toISOString())
      .gt("scheduled_end_time", from.toISOString());
    rows = (data || []).map((r) => ({
      start_time: r.scheduled_start_time,
      end_time: r.scheduled_end_time,
    }));
  }
  return (rows || []).map((r) => ({
    start: new Date(r.start_time),
    end: new Date(r.end_time),
  }));
}

export default function NewAppointmentScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(INITIAL);
  const [restored, setRestored] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState(null);

  const [counselors, setCounselors] = useState([]);
  const [fetchingCounselors, setFetchingCounselors] = useState(true);
  const [pricing, setPricing] = useState(null);
  const [busy, setBusy] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const dir = useRef(1);
  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));
  const buzz = (t) => Haptics.notificationAsync(t).catch(() => {});

  /* ------------------------------ initial data ------------------------------ */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select(
            "id, first_name, surname, email, specializations, about, years_of_experience, avatar_url, absent_days",
          )
          .eq("role", "Counselor")
          .eq("approved", true)
          .eq("suspended", false);
        setCounselors(data || []);
      } catch (err) {
        console.error("Error fetching counselors:", err);
        Alert.alert("Error", "Could not load counselors.");
      } finally {
        setFetchingCounselors(false);
      }
    })();

    supabase
      .from("system_settings")
      .select("value")
      .eq("key", "session_pricing")
      .single()
      .then(({ data }) => data?.value && setPricing(data.value));

    (async () => {
      try {
        const saved = await AsyncStorage.getItem(DRAFT_KEY);
        if (saved) {
          const { step: s, form: f } = JSON.parse(saved);
          if (f) setForm({ ...INITIAL, ...f });
          if (s && s < DONE) setStep(s);
        }
      } catch (err) {
        console.error("Failed to load draft:", err);
      }

      // Pre-fill the call number from the client's profile.
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: p } = await supabase
          .from("profiles")
          .select("phone_no")
          .eq("id", user.id)
          .maybeSingle();
        if (p?.phone_no) {
          setForm((prev) =>
            prev.callPhone ? prev : { ...prev, callPhone: p.phone_no },
          );
        }
      }
      setRestored(true);
    })();
  }, []);

  // Autosave the draft.
  useEffect(() => {
    if (!restored || step === DONE) return;
    AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ step, form })).catch(
      () => {},
    );
  }, [restored, step, form]);

  /* --------------------------------- slots --------------------------------- */
  useEffect(() => {
    if (!form.counselorId || !form.dateStr) {
      setBusy([]);
      return;
    }
    let alive = true;
    setLoadingSlots(true);
    loadBusy(form.counselorId, form.dateStr)
      .then((rows) => alive && setBusy(rows))
      .catch((e) => console.error("Busy times error:", e))
      .finally(() => alive && setLoadingSlots(false));
    return () => {
      alive = false;
    };
  }, [form.counselorId, form.dateStr]);

  const dates = useMemo(() => upcomingWeekdays(14), []);
  const counselor = counselors.find((c) => c.id === form.counselorId);
  const absentDays = Array.isArray(counselor?.absent_days)
    ? counselor.absent_days
    : [];
  const slots = useMemo(
    () => buildSlots(form.dateStr, form.duration, busy),
    [form.dateStr, form.duration, busy],
  );

  // If a chosen time stops being valid (new length, or just got taken), clear it.
  useEffect(() => {
    if (
      form.slot != null &&
      !slots.some((s) => s.start === form.slot && s.available)
    ) {
      if (!loadingSlots) update({ slot: null });
    }
  }, [slots, loadingSlots]);

  /* ------------------------------- navigation ------------------------------- */
  const goTo = (n) => {
    dir.current = n >= step ? 1 : -1;
    setStep(n);
  };

  const fail = (title, msg) => {
    buzz(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(title, msg);
  };

  const handleNext = async () => {
    if (submitting) return;

    if (step === 1 && !form.type)
      return fail("Choose a type", "Please select a counseling type.");
    if (step === 2) {
      if (!form.reasons.length)
        return fail("Choose a reason", "Select at least one reason.");
      if (form.reasons.includes("Other") && !form.otherReason.trim())
        return fail("Tell us more", "Please describe your reason.");
    }
    if (step === 3) {
      if (!form.goals.trim())
        return fail("Add your goals", "Tell us what you hope to achieve.");
      if (form.therapy === null)
        return fail(
          "One more thing",
          "Say whether you've had counseling before.",
        );
    }
    if (step === 4 && form.mode === "phone") {
      const err = validateKenyanPhone(form.callPhone);
      setPhoneError(err);
      if (err) return buzz(Haptics.NotificationFeedbackType.Warning);
    }
    if (step === 5 && !form.counselorId)
      return fail("Choose a counselor", "Please select a counselor.");
    if (step === 6 && (!form.dateStr || form.slot == null))
      return fail("Pick a time", "Choose a day and a start time.");
    if (step === 7) {
      if (!form.agreed)
        return fail(
          "Terms needed",
          "Please agree to the Terms and Conditions.",
        );
      return submit();
    }
    goTo(step + 1);
  };

  const handleBack = () => {
    if (step > 1 && step < DONE) goTo(step - 1);
    else router.back();
  };

  const resetAll = async () => {
    await AsyncStorage.removeItem(DRAFT_KEY).catch(() => {});
    setForm((prev) => ({ ...INITIAL, callPhone: prev.callPhone }));
    setPhoneError(null);
    dir.current = -1;
    setStep(1);
  };

  const confirmClear = () =>
    Alert.alert("Start over?", "This clears everything you've entered.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: resetAll },
    ]);

  /* -------------------------------- submit -------------------------------- */
  const submit = async () => {
    try {
      setSubmitting(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user)
        return fail("Sign in required", "Please sign in to book.");

      const start = atMinutes(form.dateStr, form.slot);
      const end = addMinutes(start, form.duration); // end = start + duration

      // Re-check right before saving: someone may have taken the slot meanwhile.
      const latest = await loadBusy(form.counselorId, form.dateStr);
      if (latest.some((x) => start < x.end && end > x.start)) {
        setBusy(latest);
        goTo(6);
        return fail(
          "Time just taken",
          "Someone booked that time. Please pick another.",
        );
      }

      // SIMULATED payment. Replace with a real M-Pesa STK push + confirmation.
      const mpesaRef = `MX${Math.floor(100000 + Math.random() * 900000)}`;

      const { error } = await supabase.from("appointments").insert([
        {
          client_id: user.id,
          counselor_id: form.counselorId,
          counseling_type: form.type,
          reasons: form.reasons,
          other_reason: form.reasons.includes("Other")
            ? form.otherReason.trim()
            : null,
          session_goals: form.goals.trim(),
          had_therapy_before: form.therapy,
          agreed_terms: form.agreed,
          payment_status: "completed",
          payment_amount: pricing?.amount ? Number(pricing.amount) : 0,
          currency: pricing?.currency || "KES",
          mpesa_transaction_reference: mpesaRef,
          scheduled_start_time: start.toISOString(),
          scheduled_end_time: end.toISOString(),
          duration_minutes: form.duration,
          session_mode: form.mode,
          client_call_phone:
            form.mode === "phone" ? form.callPhone.trim() : null,
          status: "scheduled",
        },
      ]);

      if (error) {
        // 23P01 = the database's no-overlap rule caught a race.
        if (error.code === "23P01") {
          goTo(6);
          return fail(
            "Time just taken",
            "Someone booked that time. Please pick another.",
          );
        }
        throw error;
      }

      const how = form.mode === "phone" ? "phone" : "online";
      await createNotification({
        recipientId: form.counselorId,
        type: NOTIFICATION_TYPES.NEW_APPOINTMENT,
        title: "New Appointment Booked",
        body: `A new ${form.duration}-minute ${form.type} ${how} session has been booked with you.`,
      });
      await notifyAdmins({
        type: NOTIFICATION_TYPES.NEW_APPOINTMENT_ADMIN,
        title: "New Appointment Created",
        body: `A new ${form.type} session was booked.`,
      });

      const { data: me } = await supabase
        .from("profiles")
        .select("first_name, surname")
        .eq("id", user.id)
        .maybeSingle();
      const clientName =
        [me?.first_name, me?.surname].filter(Boolean).join(" ") || "Client";
      const counselorName = counselor
        ? [counselor.first_name, counselor.surname].filter(Boolean).join(" ")
        : "your counselor";

      if (user.email) {
        sendEmail({
          to: user.email,
          ...clientBookingEmail({
            clientName: me?.first_name || "there",
            counselorName,
            counselingType: form.type,
            startTime: start.toISOString(),
            paid: true,
          }),
        });
      }
      if (counselor?.email) {
        sendEmail({
          to: counselor.email,
          ...counselorBookingEmail({
            counselorName: counselor.first_name || "there",
            clientName,
            counselingType: form.type,
            startTime: start.toISOString(),
          }),
        });
      }

      await AsyncStorage.removeItem(DRAFT_KEY).catch(() => {});
      buzz(Haptics.NotificationFeedbackType.Success);
      dir.current = 1;
      setStep(DONE);
    } catch (err) {
      console.error("Booking error:", err);
      buzz(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Couldn't book", err?.message || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* --------------------------------- render --------------------------------- */
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.set(withTiming(Math.min(step, TOTAL) / TOTAL, { duration: 350 }));
  }, [step, progress]);
  const fill = useAnimatedStyle(() => ({ width: `${progress.get() * 100}%` }));

  const price = pricing?.amount ?? null;
  const currency = pricing?.currency || "KES";
  const [title, subtitle] = META[step] || [];

  const body = () => {
    switch (step) {
      case 1:
        return <TypeStep form={form} update={update} />;
      case 2:
        return <ReasonsStep form={form} update={update} />;
      case 3:
        return <GoalsStep form={form} update={update} />;
      case 4:
        return (
          <SessionStep
            form={form}
            update={(p) => {
              if (p.callPhone !== undefined) setPhoneError(null);
              update(p);
            }}
            phoneError={phoneError}
          />
        );
      case 5:
        return (
          <CounselorStep
            counselors={counselors}
            fetching={fetchingCounselors}
            form={form}
            update={update}
          />
        );
      case 6:
        return (
          <TimeStep
            form={form}
            update={update}
            dates={dates}
            absentDays={absentDays}
            slots={slots}
            loadingSlots={loadingSlots}
          />
        );
      case 7:
        return (
          <ReviewStep
            form={form}
            update={update}
            counselor={counselor}
            price={price}
            currency={currency}
            onOpenTerms={() => setShowTerms(true)}
          />
        );
      default:
        return (
          <DoneStep
            form={form}
            onFinish={() => router.replace("/appointment")}
          />
        );
    }
  };

  return (
    <SafeAreaView style={b.root} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={b.max}>
          {/* Header */}
          <View style={b.header}>
            <PressableScale
              haptic
              style={b.roundBtn}
              onPress={handleBack}
              accessibilityLabel={
                step > 1 && step < DONE ? "Previous step" : "Close"
              }
            >
              <Ionicons
                name={step > 1 && step < DONE ? "arrow-back" : "close"}
                size={20}
                color="#0F172A"
              />
            </PressableScale>
            <View style={b.headerMid}>
              <Text style={b.headerTitle}>Book a session</Text>
              {step < DONE && (
                <Text style={b.headerSub}>
                  Step {step} of {TOTAL}
                </Text>
              )}
            </View>
            {step < DONE && (
              <PressableScale
                style={b.roundBtn}
                onPress={confirmClear}
                accessibilityLabel="Clear draft"
              >
                <Ionicons name="refresh" size={18} color="#DC2626" />
              </PressableScale>
            )}
          </View>

          {step < DONE && (
            <View style={b.track}>
              <Animated.View style={[b.fill, fill]} />
            </View>
          )}

          {/* Step content */}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={b.body}
          >
            <Animated.View
              key={step}
              entering={(dir.current > 0 ? FadeInRight : FadeInLeft).duration(
                260,
              )}
            >
              {step < DONE && (
                <>
                  <Text style={b.title}>{title}</Text>
                  <Text style={b.subtitle}>{subtitle}</Text>
                </>
              )}
              {body()}
            </Animated.View>
          </ScrollView>

          {/* Footer */}
          {step < DONE && (
            <View style={b.footer}>
              {step > 1 && (
                <PressableScale
                  containerStyle={{ flex: 0.7 }}
                  style={[b.btn, b.btnGhost, { flex: 0 }]}
                  onPress={handleBack}
                  disabled={submitting}
                >
                  <Text style={b.btnGhostText}>Back</Text>
                </PressableScale>
              )}
              <PressableScale
                containerStyle={{ flex: 1.4 }}
                haptic
                style={[
                  b.btn,
                  b.btnMain,
                  { flex: 0 },
                  submitting && { opacity: 0.8 },
                ]}
                onPress={handleNext}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={b.btnMainText}>
                    {step === TOTAL
                      ? `Pay ${currency} ${price != null ? Number(price).toLocaleString() : ""} and book`
                      : "Continue"}
                  </Text>
                )}
              </PressableScale>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Terms modal */}
      <Modal
        visible={showTerms}
        animationType="fade"
        transparent
        onRequestClose={() => setShowTerms(false)}
      >
        <View style={b.overlay}>
          <View style={b.modal}>
            <Text style={b.modalTitle}>Terms and Conditions</Text>
            <ScrollView>
              <Text style={b.modalBody}>
                1. Nature of services: Online or phone counseling and coaching,
                delivered via Zoom, Google Meet or a phone call.{"\n\n"}
                2. Not an emergency service: We do not provide medical or
                psychiatric emergency intervention.
                {"\n\n"}
                3. Confidentiality: Sessions are confidential except where there
                is a risk of harm or legal compulsion under Kenyan law.{"\n\n"}
                4. Data protection: Your information is handled under the Data
                Protection Act, 2019 (Kenya).
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={[b.btn, b.btnMain, { flex: 0, marginTop: 16 }]}
              onPress={() => setShowTerms(false)}
            >
              <Text style={b.btnMainText}>I understand</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
