import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../../libs/supabase";
import { styles } from "../../../styles/(client)/programs/regPrograms";
import { useAuth } from "../../_layout";

export default function RejPrograms() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();

  const [program, setProgram] = useState(null);
  const [moderators, setModerators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredReference, setRegisteredReference] = useState(null);

  // M-Pesa Modal State
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [mpesaRef, setMpesaRef] = useState("");

  const programId = params.programId;

  useEffect(() => {
    if (programId) {
      fetchProgramDetails();
    }
  }, [programId]);

  const fetchProgramDetails = async () => {
    try {
      setLoading(true);

      // 1. Fetch Program Details
      const { data: progData, error: progError } = await supabase
        .from("programs")
        .select("*")
        .eq("id", programId)
        .single();

      if (progError) throw progError;
      setProgram(progData);

      // 2. Fetch Program Moderators
      const { data: modData } = await supabase
        .from("program_moderators")
        .select("*")
        .eq("program_id", programId);

      setModerators(modData || []);

      // 3. Check if Client is already registered & fetch saved reference
      if (user?.id) {
        const { data: partData } = await supabase
          .from("program_participants")
          .select("id, mpesa_reference")
          .eq("program_id", programId)
          .eq("client_id", user.id)
          .maybeSingle();

        if (partData) {
          setIsRegistered(true);
          setRegisteredReference(partData.mpesa_reference || null);
        }
      }
    } catch (err) {
      console.error("Error loading program details:", err);
      Alert.alert("Error", "Could not load program details.");
    } finally {
      setLoading(false);
    }
  };

  const handleFreeRegistration = async () => {
    try {
      setSubmitting(true);
      const { error } = await supabase.from("program_participants").insert([
        {
          program_id: program.id,
          client_id: user.id,
          status: "registered",
          mpesa_reference: null,
        },
      ]);

      if (error) {
        if (error.code === "23505") {
          Alert.alert("Notice", "You are already registered for this program.");
          setIsRegistered(true);
          return;
        }
        throw error;
      }

      setIsRegistered(true);
      Alert.alert(
        "Success 🎉",
        "You have successfully registered! Access to the meeting location/link is now unlocked below.",
      );
    } catch (err) {
      console.error("Registration failed:", err);
      Alert.alert("Registration Failed", err.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaidRegistrationSubmit = async () => {
    const formattedRef = mpesaRef.trim().toUpperCase();

    if (!formattedRef) {
      Alert.alert(
        "Validation",
        "Please enter your M-Pesa transaction reference.",
      );
      return;
    }

    try {
      setSubmitting(true);

      // Record participant registration along with M-Pesa reference
      const { error } = await supabase.from("program_participants").insert([
        {
          program_id: program.id,
          client_id: user.id,
          status: "registered",
          mpesa_reference: formattedRef,
        },
      ]);

      if (error && error.code !== "23505") {
        throw error;
      }

      setRegisteredReference(formattedRef);
      setPaymentModalVisible(false);
      setMpesaRef("");
      setIsRegistered(true);

      Alert.alert(
        "Payment Submitted 🎉",
        `Your registration and M-Pesa reference (${formattedRef}) have been recorded. You can now view the meeting details below.`,
      );
    } catch (err) {
      console.error("Payment Submission Error:", err);
      Alert.alert(
        "Submission Error",
        err.message || "Failed to process registration.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openMeetingLink = (url) => {
    if (!url) return;
    const formattedUrl = url.startsWith("http") ? url : `https://${url}`;
    Linking.openURL(formattedUrl).catch(() => {
      Alert.alert("Error", "Unable to open the link on your device.");
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={styles.loadingText}>Loading event details...</Text>
      </SafeAreaView>
    );
  }

  if (!program) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Program not found.</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header Bar */}
      <View style={styles.navHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconCircle}
        >
          <Ionicons name="arrow-back" size={20} color="#1E2B28" />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          Program Details
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner / Poster */}
        {program.poster_url ? (
          <Image
            source={{ uri: program.poster_url }}
            style={styles.posterImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.posterPlaceholder}>
            <Ionicons name="calendar-outline" size={48} color="#16A34A" />
            <Text style={styles.placeholderCategory}>{program.category}</Text>
          </View>
        )}

        {/* Content Details */}
        <View style={styles.card}>
          <View style={styles.badgeRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{program.category}</Text>
            </View>
            <View
              style={[
                styles.priceBadge,
                program.is_paid ? styles.paidBadge : styles.freeBadge,
              ]}
            >
              <Text
                style={[
                  styles.priceBadgeText,
                  program.is_paid ? styles.paidText : styles.freeText,
                ]}
              >
                {program.is_paid
                  ? `${program.currency} ${program.amount}`
                  : "FREE"}
              </Text>
            </View>
          </View>

          <Text style={styles.title}>{program.title}</Text>

          <View style={styles.divider} />

          {/* Time & Date */}
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color="#16A34A" />
            <Text style={styles.infoText}>
              {new Date(program.starts_at).toLocaleString("en-US", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>

          {/* Conditional Meeting Link / Location Handling */}
          <View style={styles.locationContainer}>
            <View style={styles.infoRow}>
              <Ionicons
                name={
                  program.location_type === "virtual"
                    ? "laptop-outline"
                    : program.location_type === "phone"
                      ? "call-outline"
                      : "location-outline"
                }
                size={18}
                color="#16A34A"
              />
              <Text style={styles.infoText}>
                Mode:{" "}
                <Text style={{ fontWeight: "700" }}>
                  {program.location_type?.toUpperCase()}
                </Text>
              </Text>
            </View>

            {/* UNLOCKED: Display link/location after registration or payment */}
            {isRegistered ? (
              <View style={styles.unlockedBox}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <Ionicons
                    name="lock-open-outline"
                    size={18}
                    color="#15803D"
                  />
                  <Text style={styles.unlockedTitle}>
                    Meeting Info & Link Unlocked
                  </Text>
                </View>

                {program.location_type === "virtual" ||
                program.location_details?.startsWith("http") ? (
                  <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => openMeetingLink(program.location_details)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="link-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.linkButtonText} numberOfLines={1}>
                      {program.location_details}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.unlockedDetailsText}>
                    {program.location_details}
                  </Text>
                )}

                {registeredReference && (
                  <View
                    style={{
                      marginTop: 10,
                      paddingTop: 8,
                      borderTopWidth: 1,
                      borderTopColor: "#DCFCE7",
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons
                      name="receipt-outline"
                      size={14}
                      color="#15803D"
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#166534",
                        marginLeft: 6,
                        fontWeight: "600",
                      }}
                    >
                      Ref: {registeredReference}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              /* LOCKED: Banner explaining link is hidden until registered/paid */
              <View style={styles.lockedBox}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#B45309"
                />
                <Text style={styles.lockedText}>
                  {program.is_paid
                    ? "Complete payment to unlock the meeting link & details."
                    : "Register for free to unlock the meeting link & details."}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Description */}
          <Text style={styles.sectionHeader}>About This Program</Text>
          <Text style={styles.description}>
            {program.description || "No description provided."}
          </Text>

          {/* Moderators */}
          {moderators.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionHeader}>Program Facilitators</Text>
              {moderators.map((mod) => (
                <View key={mod.id} style={styles.modCard}>
                  <Ionicons
                    name="person-circle-outline"
                    size={28}
                    color="#1E2B28"
                  />
                  <View style={styles.modInfo}>
                    <Text style={styles.modName}>{mod.full_name}</Text>
                    <Text style={styles.modContact}>{mod.email}</Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>

      {/* Action Footer */}
      <View style={styles.footerContainer}>
        {isRegistered ? (
          <View style={styles.registeredBanner}>
            <Ionicons name="checkmark-circle" size={20} color="#15803D" />
            <Text style={styles.registeredText}>
              You are registered for this event
            </Text>
          </View>
        ) : program.is_paid ? (
          <TouchableOpacity
            style={styles.payButton}
            activeOpacity={0.8}
            onPress={() => setPaymentModalVisible(true)}
            disabled={submitting}
          >
            <Ionicons name="card-outline" size={20} color="#FFFFFF" />
            <Text style={styles.payButtonText}>
              Pay {program.currency} {program.amount} via M-Pesa
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.registerButton}
            activeOpacity={0.8}
            onPress={handleFreeRegistration}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.registerButtonText}>
                  Register Now (Free)
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* M-Pesa Payment Modal */}
      <Modal
        visible={paymentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>M-Pesa Payment</Text>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1E2B28" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalSubText}>
                Scan the QR code using your M-Pesa App or use Paybill details
                below.
              </Text>

              {/* QR Code Container */}
              <View style={styles.qrContainer}>
                <Image
                  source={{
                    uri: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=PAYBILL:522522|ACC:1343210186|AMT:${program.amount}`,
                  }}
                  style={styles.qrImage}
                />
                <Text style={styles.qrCaption}>Scan with M-Pesa App</Text>
              </View>

              {/* Paybill Instructions */}
              <View style={styles.paybillBox}>
                <Text style={styles.paybillLabel}>
                  Paybill Number:{" "}
                  <Text style={styles.paybillValue}>522522</Text>
                </Text>
                <Text style={styles.paybillLabel}>
                  Account No:{" "}
                  <Text style={styles.paybillValue}>1343210186</Text>
                </Text>
                <Text style={styles.paybillLabel}>
                  Amount:{" "}
                  <Text style={styles.paybillValue}>
                    {program.currency} {program.amount}
                  </Text>
                </Text>
              </View>

              {/* Reference Input */}
              <Text style={styles.inputLabel}>
                M-Pesa Transaction Reference
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. QX789KL012"
                placeholderTextColor="#94A3B8"
                value={mpesaRef}
                onChangeText={setMpesaRef}
                autoCapitalize="characters"
              />

              <TouchableOpacity
                style={styles.confirmPayButton}
                activeOpacity={0.8}
                onPress={handlePaidRegistrationSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmPayText}>
                    Confirm Payment & Register
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
