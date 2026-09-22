import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { decode } from "base64-arraybuffer";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../libs/supabase";
import { styles } from "../../styles/(counselor)/programs";

const LOCATION_TYPES = [
  {
    value: "physical",
    label: "Physical",
    icon: "location-outline",
    placeholder: "Venue / address",
  },
  {
    value: "virtual",
    label: "Virtual",
    icon: "videocam-outline",
    placeholder: "Meeting link (Google Meet, Zoom...)",
  },
  {
    value: "phone",
    label: "Via Phone",
    icon: "call-outline",
    placeholder: "Phone number or dial-in details",
  },
];

const MAX_MODERATORS = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emptyModerator = () => ({ name: "", email: "", phone: "" });

const defaultStart = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return d;
};

const formatDateTime = (value) =>
  new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// Convert a database row into the shape the screen uses
const mapProgram = (row) => ({
  id: row.id,
  createdBy: row.created_by,
  title: row.title,
  category: row.category,
  description: row.description || "",
  startsAt: row.starts_at,
  locationType: row.location_type,
  locationDetails: row.location_details,
  isPaid: row.is_paid,
  amount: row.amount,
  currency: row.currency || "KES",
  posterUrl: row.poster_url,
  posterPath: row.poster_path,
  status: new Date(row.starts_at) >= new Date() ? "Available" : "Past",
  moderators: (row.program_moderators || []).map((m) => ({
    id: m.id,
    name: m.full_name,
    email: m.email,
    phone: m.phone_no,
  })),
  participants: (row.program_participants || []).map((p) => {
    const c = Array.isArray(p.client) ? p.client[0] : p.client;
    return {
      id: p.id,
      name:
        c?.full_name ||
        [c?.first_name, c?.surname].filter(Boolean).join(" ") ||
        "Unknown client",
      email: c?.email || "Not provided",
      phone: c?.phone_no || "Not provided",
      county: c?.county || "Not provided",
      status: p.status === "participated" ? "Participated" : "Registered",
    };
  }),
});

export default function Programs() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Participants modal
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [expandedParticipantId, setExpandedParticipantId] = useState(null);

  // Create / edit modal
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStartsAt, setFormStartsAt] = useState(defaultStart());
  const [formLocationType, setFormLocationType] = useState("physical");
  const [formLocationDetails, setFormLocationDetails] = useState("");
  const [formIsPaid, setFormIsPaid] = useState(false);
  const [formAmount, setFormAmount] = useState("");
  const [formPoster, setFormPoster] = useState(null); // { uri, base64?, ext?, isNew }
  const [formModeratorCount, setFormModeratorCount] = useState("0");
  const [formModerators, setFormModerators] = useState([]);

  const selectedProgram = programs.find((p) => p.id === selectedProgramId);

  // ---------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------
  const fetchPrograms = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("programs")
        .select(
          `
          *,
          program_moderators ( id, full_name, email, phone_no ),
          program_participants (
            id,
            status,
            client:profiles!program_participants_client_id_fkey (
              id, full_name, first_name, surname, email, phone_no, county
            )
          )
        `,
        )
        .order("starts_at", { ascending: true });

      if (error) throw error;

      setPrograms((data || []).map(mapProgram));
    } catch (err) {
      console.error("Fetch programs error:", err);
      Alert.alert("Error", err?.message || "Could not load programs.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPrograms();
  };

  // ---------------------------------------------------------------
  // Form helpers
  // ---------------------------------------------------------------
  const handleOpenAddModal = () => {
    setEditingProgram(null);
    setFormTitle("");
    setFormCategory("");
    setFormDescription("");
    setFormStartsAt(defaultStart());
    setFormLocationType("physical");
    setFormLocationDetails("");
    setFormIsPaid(false);
    setFormAmount("");
    setFormPoster(null);
    setFormModeratorCount("0");
    setFormModerators([]);
    setIsProgramModalOpen(true);
  };

  const handleOpenEditModal = (prog) => {
    setEditingProgram(prog);
    setFormTitle(prog.title);
    setFormCategory(prog.category);
    setFormDescription(prog.description);
    setFormStartsAt(new Date(prog.startsAt));
    setFormLocationType(prog.locationType);
    setFormLocationDetails(prog.locationDetails);
    setFormIsPaid(prog.isPaid);
    setFormAmount(prog.amount ? String(Math.round(Number(prog.amount))) : "");
    setFormPoster(
      prog.posterUrl ? { uri: prog.posterUrl, isNew: false } : null,
    );
    setFormModeratorCount(String(prog.moderators.length));
    setFormModerators(
      prog.moderators.map((m) => ({
        name: m.name,
        email: m.email,
        phone: m.phone,
      })),
    );
    setIsProgramModalOpen(true);
  };

  const handleLocationTypeChange = (type) => {
    if (type === formLocationType) return;
    setFormLocationType(type);
    setFormLocationDetails("");
  };

  const handleModeratorCountChange = (text) => {
    const digits = text.replace(/[^0-9]/g, "");
    if (digits === "") {
      setFormModeratorCount("");
      setFormModerators([]);
      return;
    }
    const count = Math.min(parseInt(digits, 10), MAX_MODERATORS);
    setFormModeratorCount(String(count));
    setFormModerators((prev) =>
      Array.from({ length: count }, (_, i) => prev[i] || emptyModerator()),
    );
  };

  const updateModerator = (index, field, value) => {
    setFormModerators((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    );
  };

  // Android: pick the date, then the time
  const openAndroidDateTimePicker = () => {
    DateTimePickerAndroid.open({
      value: formStartsAt || defaultStart(),
      mode: "date",
      minimumDate: editingProgram ? undefined : new Date(),
      onChange: (event, date) => {
        if (event.type !== "set" || !date) return;

        DateTimePickerAndroid.open({
          value: date,
          mode: "time",
          onChange: (timeEvent, time) => {
            if (timeEvent.type !== "set" || !time) return;
            const combined = new Date(date);
            combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
            setFormStartsAt(combined);
          },
        });
      },
    });
  };

  const handlePickPoster = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Allow access to your photos to add an event poster.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];

      if (!asset.base64) {
        Alert.alert("Upload Failed", "Could not read the selected image.");
        return;
      }

      let ext = asset.uri?.split(".").pop()?.toLowerCase() || "jpeg";
      if (ext === "jpg") ext = "jpeg";
      if (!["jpeg", "png", "webp"].includes(ext)) ext = "jpeg";

      setFormPoster({
        uri: asset.uri,
        base64: asset.base64,
        ext,
        isNew: true,
      });
    } catch (err) {
      console.error("Poster picker error:", err);
      Alert.alert("Error", err?.message || "Could not select the image.");
    }
  };

  const validateForm = () => {
    if (!formTitle.trim()) return "Please enter the program title.";
    if (!formStartsAt) return "Please choose the date and time.";
    if (!editingProgram && formStartsAt < new Date()) {
      return "Please choose a date and time in the future.";
    }
    if (!formLocationDetails.trim()) {
      return "Please enter the venue, meeting link or phone details.";
    }
    if (formIsPaid) {
      const amount = parseFloat(formAmount);
      if (!amount || amount <= 0) {
        return "Please enter a valid amount for this paid program.";
      }
    }
    for (let i = 0; i < formModerators.length; i++) {
      const m = formModerators[i];
      const label = `Moderator ${i + 1}`;
      if (!m.name.trim()) return `${label}: name is required.`;
      if (!EMAIL_REGEX.test(m.email.trim())) {
        return `${label}: enter a valid email address.`;
      }
      if (m.phone.replace(/\D/g, "").length < 9) {
        return `${label}: enter a valid phone number.`;
      }
    }
    return null;
  };

  // ---------------------------------------------------------------
  // Save / delete program
  // ---------------------------------------------------------------
  const handleSaveProgram = async () => {
    const problem = validateForm();
    if (problem) {
      Alert.alert("Missing information", problem);
      return;
    }

    try {
      setSaving(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        Alert.alert(
          "Authentication Error",
          "Your session has expired. Please log in again.",
        );
        return;
      }

      // ---- Poster ----
      const oldPosterPath = editingProgram?.posterPath || null;
      let posterUrl = editingProgram?.posterUrl || null;
      let posterPath = oldPosterPath;
      let removeOldPoster = false;

      if (formPoster?.isNew) {
        const path = `${user.id}/${Date.now()}.${formPoster.ext}`;

        const { error: uploadError } = await supabase.storage
          .from("posters")
          .upload(path, decode(formPoster.base64), {
            contentType: `image/${formPoster.ext}`,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("posters").getPublicUrl(path);

        posterUrl = publicUrl;
        posterPath = path;
        removeOldPoster = !!oldPosterPath;
      } else if (!formPoster) {
        posterUrl = null;
        posterPath = null;
        removeOldPoster = !!oldPosterPath;
      }

      // ---- Program row ----
      const payload = {
        title: formTitle.trim(),
        category: formCategory.trim() || "General Mentorship",
        description: formDescription.trim() || null,
        starts_at: formStartsAt.toISOString(),
        location_type: formLocationType,
        location_details: formLocationDetails.trim(),
        is_paid: formIsPaid,
        amount: formIsPaid ? parseFloat(formAmount) : null,
        poster_url: posterUrl,
        poster_path: posterPath,
        moderator_count: formModerators.length,
      };

      let programId = editingProgram?.id;

      if (editingProgram) {
        const { data, error } = await supabase
          .from("programs")
          .update(payload)
          .eq("id", editingProgram.id)
          .select("id");

        if (error) throw error;
        if (!data?.length) {
          throw new Error("You do not have permission to edit this program.");
        }
      } else {
        const { data, error } = await supabase
          .from("programs")
          .insert({ ...payload, created_by: user.id })
          .select("id")
          .single();

        if (error) throw error;
        programId = data.id;
      }

      // ---- Moderators (replace the full list) ----
      if (editingProgram) {
        const { error: clearError } = await supabase
          .from("program_moderators")
          .delete()
          .eq("program_id", programId);

        if (clearError) throw clearError;
      }

      if (formModerators.length > 0) {
        const { error: moderatorError } = await supabase
          .from("program_moderators")
          .insert(
            formModerators.map((m) => ({
              program_id: programId,
              full_name: m.name.trim(),
              email: m.email.trim().toLowerCase(),
              phone_no: m.phone.trim(),
            })),
          );

        if (moderatorError) throw moderatorError;
      }

      // ---- Clean up the replaced poster (best effort) ----
      if (removeOldPoster && oldPosterPath) {
        await supabase.storage.from("posters").remove([oldPosterPath]);
      }

      if (!editingProgram) {
        await notifyAdmins({
          type: NOTIFICATION_TYPES.NEW_PROGRAM,
          title: "New Program Created",
          body: `"${formTitle.trim()}" was added by a counselor.`,
          data: { programId },
        });
      }

      setIsProgramModalOpen(false);
      await fetchPrograms();
    } catch (err) {
      console.error("Save program error:", err);
      Alert.alert("Save Failed", err?.message || "Could not save the program.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProgram = (prog) => {
    Alert.alert(
      "Delete Program",
      "Are you sure you want to delete this program? Its participants and moderators will be removed too.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { data, error } = await supabase
                .from("programs")
                .delete()
                .eq("id", prog.id)
                .select("id");

              if (error) throw error;
              if (!data?.length) {
                throw new Error(
                  "You do not have permission to delete this program.",
                );
              }

              if (prog.posterPath) {
                await supabase.storage
                  .from("posters")
                  .remove([prog.posterPath]);
              }

              fetchPrograms();
            } catch (err) {
              Alert.alert("Delete Failed", err?.message || "Please try again.");
            }
          },
        },
      ],
    );
  };

  // ---------------------------------------------------------------
  // Participants
  // ---------------------------------------------------------------
  const handleOpenParticipants = (prog) => {
    setSelectedProgramId(prog.id);
    setIsParticipantsModalOpen(true);
    setExpandedParticipantId(null);
  };

  const toggleExpandParticipant = (id) => {
    setExpandedParticipantId((prev) => (prev === id ? null : id));
  };

  const handleMarkParticipated = async (participantId) => {
    try {
      const { data, error } = await supabase
        .from("program_participants")
        .update({ status: "participated" })
        .eq("id", participantId)
        .select("id");

      if (error) throw error;
      if (!data?.length) throw new Error("Could not update this participant.");

      fetchPrograms();
    } catch (err) {
      Alert.alert("Update Failed", err?.message || "Please try again.");
    }
  };

  const handleRemoveParticipant = (participantId) => {
    Alert.alert(
      "Remove Participant",
      "Remove this client from the registered list?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const { data, error } = await supabase
                .from("program_participants")
                .delete()
                .eq("id", participantId)
                .select("id");

              if (error) throw error;
              if (!data?.length) {
                throw new Error("Could not remove this participant.");
              }

              fetchPrograms();
            } catch (err) {
              Alert.alert("Remove Failed", err?.message || "Please try again.");
            }
          },
        },
      ],
    );
  };

  // ---------------------------------------------------------------
  // Derived lists
  // ---------------------------------------------------------------
  const availablePrograms = programs.filter((p) => p.status === "Available");
  const pastPrograms = programs
    .filter((p) => p.status === "Past")
    .sort((a, b) => new Date(b.startsAt) - new Date(a.startsAt));

  const activeLocation = LOCATION_TYPES.find(
    (l) => l.value === formLocationType,
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header Bar */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Mentorship Programs</Text>
        <TouchableOpacity style={styles.addBtn} onPress={handleOpenAddModal}>
          <Ionicons name="add-outline" size={20} color="#FFFFFF" />
          <Text style={styles.addBtnText}>New Program</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#1E3A8A"
            style={styles.loader}
          />
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Available Programs</Text>
              {availablePrograms.length === 0 ? (
                <Text style={styles.emptyText}>
                  No active programs available.
                </Text>
              ) : (
                availablePrograms.map((prog) => (
                  <ProgramCard
                    key={prog.id}
                    program={prog}
                    onEdit={() => handleOpenEditModal(prog)}
                    onDelete={() => handleDeleteProgram(prog)}
                    onViewParticipants={() => handleOpenParticipants(prog)}
                  />
                ))
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Past Programs</Text>
              {pastPrograms.length === 0 ? (
                <Text style={styles.emptyText}>No past programs recorded.</Text>
              ) : (
                pastPrograms.map((prog) => (
                  <ProgramCard
                    key={prog.id}
                    program={prog}
                    onEdit={() => handleOpenEditModal(prog)}
                    onDelete={() => handleDeleteProgram(prog)}
                    onViewParticipants={() => handleOpenParticipants(prog)}
                  />
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* FULL SCREEN PARTICIPANTS MODAL */}
      <Modal
        visible={isParticipantsModalOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsParticipantsModalOpen(false)}
      >
        <SafeAreaView style={styles.fullModalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setIsParticipantsModalOpen(false)}
              style={styles.closeBtn}
            >
              <Ionicons name="close-outline" size={24} color="#0F172A" />
            </TouchableOpacity>
            <View style={styles.headerTitleGroup}>
              <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                {selectedProgram?.title}
              </Text>
              <Text style={styles.modalHeaderSub}>Registered Participants</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.participantsList}>
            {!selectedProgram || selectedProgram.participants.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="people-outline" size={40} color="#94A3B8" />
                <Text style={styles.emptyText}>
                  No clients registered for this program yet.
                </Text>
              </View>
            ) : (
              selectedProgram.participants.map((client) => {
                const isExpanded = expandedParticipantId === client.id;
                const isAttended = client.status === "Participated";

                return (
                  <View key={client.id} style={styles.participantCard}>
                    <TouchableOpacity
                      style={styles.participantHeader}
                      onPress={() => toggleExpandParticipant(client.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.clientMainInfo}>
                        <Text style={styles.participantName}>
                          {client.name}
                        </Text>
                        <Text
                          style={[
                            styles.statusTag,
                            isAttended && styles.statusTagAttended,
                          ]}
                        >
                          {client.status}
                        </Text>
                      </View>
                      <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={20}
                        color="#64748B"
                      />
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.participantDetails}>
                        <View style={styles.detailRow}>
                          <Ionicons
                            name="mail-outline"
                            size={16}
                            color="#64748B"
                          />
                          <Text style={styles.detailText}>{client.email}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Ionicons
                            name="call-outline"
                            size={16}
                            color="#64748B"
                          />
                          <Text style={styles.detailText}>{client.phone}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Ionicons
                            name="location-outline"
                            size={16}
                            color="#64748B"
                          />
                          <Text style={styles.detailText}>
                            County: {client.county}
                          </Text>
                        </View>
                      </View>
                    )}

                    <View style={styles.participantActions}>
                      <TouchableOpacity
                        style={[
                          styles.partActionBtn,
                          styles.participatedBtn,
                          isAttended && styles.disabledBtn,
                        ]}
                        disabled={isAttended}
                        onPress={() => handleMarkParticipated(client.id)}
                      >
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={16}
                          color={isAttended ? "#94A3B8" : "#15803D"}
                        />
                        <Text
                          style={[
                            styles.participatedBtnText,
                            isAttended && styles.disabledBtnText,
                          ]}
                        >
                          {isAttended ? "Attended" : "Participated"}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.partActionBtn, styles.removeBtn]}
                        onPress={() => handleRemoveParticipant(client.id)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color="#B91C1C"
                        />
                        <Text style={styles.removeBtnText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* CREATE / EDIT PROGRAM MODAL */}
      <Modal
        visible={isProgramModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => !saving && setIsProgramModalOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.formModalCard}>
            <Text style={styles.formModalTitle}>
              {editingProgram ? "Edit Program" : "Create New Program"}
            </Text>

            <ScrollView
              style={styles.formScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Basics */}
              <Text style={styles.fieldLabel}>Program Title *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Campus Readiness Workshop"
                placeholderTextColor="#94A3B8"
                value={formTitle}
                onChangeText={setFormTitle}
              />

              <Text style={styles.fieldLabel}>Category</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Pre-Campus Transition"
                placeholderTextColor="#94A3B8"
                value={formCategory}
                onChangeText={setFormCategory}
              />

              {/* Date & time */}
              <Text style={styles.fieldLabel}>Date & Time *</Text>
              {Platform.OS === "android" ? (
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={openAndroidDateTimePicker}
                  activeOpacity={0.8}
                >
                  <Ionicons name="calendar-outline" size={18} color="#1E3A8A" />
                  <Text style={styles.dateButtonText}>
                    {formatDateTime(formStartsAt)}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.iosPickerRow}>
                  <DateTimePicker
                    value={formStartsAt}
                    mode="datetime"
                    display="compact"
                    minimumDate={editingProgram ? undefined : new Date()}
                    onChange={(_, selected) => {
                      if (selected) setFormStartsAt(selected);
                    }}
                  />
                </View>
              )}

              {/* Location */}
              <Text style={styles.fieldLabel}>Location Type *</Text>
              <View style={styles.optionRow}>
                {LOCATION_TYPES.map((type) => {
                  const active = formLocationType === type.value;
                  return (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.optionChip,
                        active && styles.optionChipActive,
                      ]}
                      onPress={() => handleLocationTypeChange(type.value)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={type.icon}
                        size={16}
                        color={active ? "#FFFFFF" : "#64748B"}
                      />
                      <Text
                        style={[
                          styles.optionChipText,
                          active && styles.optionChipTextActive,
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TextInput
                style={styles.formInput}
                placeholder={activeLocation?.placeholder}
                placeholderTextColor="#94A3B8"
                value={formLocationDetails}
                onChangeText={setFormLocationDetails}
                autoCapitalize="none"
                keyboardType={
                  formLocationType === "phone"
                    ? "phone-pad"
                    : formLocationType === "virtual"
                      ? "url"
                      : "default"
                }
              />

              {/* Payment */}
              <Text style={styles.fieldLabel}>Attendance Fee *</Text>
              <View style={styles.optionRow}>
                {[
                  { label: "Free", value: false, icon: "gift-outline" },
                  { label: "Paid", value: true, icon: "cash-outline" },
                ].map((option) => {
                  const active = formIsPaid === option.value;
                  return (
                    <TouchableOpacity
                      key={option.label}
                      style={[
                        styles.optionChip,
                        active && styles.optionChipActive,
                      ]}
                      onPress={() => {
                        setFormIsPaid(option.value);
                        if (!option.value) setFormAmount("");
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={option.icon}
                        size={16}
                        color={active ? "#FFFFFF" : "#64748B"}
                      />
                      <Text
                        style={[
                          styles.optionChipText,
                          active && styles.optionChipTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {formIsPaid && (
                <View style={styles.amountRow}>
                  <View style={styles.currencyBadge}>
                    <Text style={styles.currencyText}>KES</Text>
                  </View>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="Amount per participant"
                    placeholderTextColor="#94A3B8"
                    value={formAmount}
                    onChangeText={(text) =>
                      setFormAmount(text.replace(/[^0-9]/g, ""))
                    }
                    keyboardType="numeric"
                    maxLength={7}
                  />
                </View>
              )}

              {/* Description */}
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                placeholder="What will this program cover?"
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                value={formDescription}
                onChangeText={setFormDescription}
              />

              {/* Poster */}
              <Text style={styles.fieldLabel}>Event Poster (optional)</Text>
              {formPoster ? (
                <View style={styles.posterPreviewWrap}>
                  <Image
                    source={{ uri: formPoster.uri }}
                    style={styles.posterPreview}
                    resizeMode="cover"
                  />
                  <View style={styles.posterActions}>
                    <TouchableOpacity
                      style={styles.posterActionBtn}
                      onPress={handlePickPoster}
                    >
                      <Ionicons name="swap-horizontal" size={16} color="#FFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.posterActionBtn}
                      onPress={() => setFormPoster(null)}
                    >
                      <Ionicons name="close" size={16} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.posterPicker}
                  onPress={handlePickPoster}
                  activeOpacity={0.8}
                >
                  <Ionicons name="image-outline" size={28} color="#94A3B8" />
                  <Text style={styles.posterPickerText}>Add poster image</Text>
                  <Text style={styles.posterHint}>
                    JPG, PNG or WebP · max 5MB
                  </Text>
                </TouchableOpacity>
              )}

              {/* Moderators */}
              <Text style={styles.fieldLabel}>
                Number of Invigilators / Moderators
              </Text>
              <TextInput
                style={styles.formInput}
                placeholder={`0 to ${MAX_MODERATORS}`}
                placeholderTextColor="#94A3B8"
                value={formModeratorCount}
                onChangeText={handleModeratorCountChange}
                keyboardType="number-pad"
                maxLength={2}
              />

              {formModerators.map((moderator, index) => (
                <View key={index} style={styles.moderatorCard}>
                  <Text style={styles.moderatorTitle}>
                    Moderator {index + 1}
                  </Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Full name"
                    placeholderTextColor="#94A3B8"
                    value={moderator.name}
                    onChangeText={(text) =>
                      updateModerator(index, "name", text)
                    }
                  />
                  <TextInput
                    style={styles.formInput}
                    placeholder="Email address"
                    placeholderTextColor="#94A3B8"
                    value={moderator.email}
                    onChangeText={(text) =>
                      updateModerator(index, "email", text)
                    }
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <TextInput
                    style={[styles.formInput, styles.lastInput]}
                    placeholder="Phone number"
                    placeholderTextColor="#94A3B8"
                    value={moderator.phone}
                    onChangeText={(text) =>
                      updateModerator(index, "phone", text)
                    }
                    keyboardType="phone-pad"
                  />
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsProgramModalOpen(false)}
                disabled={saving}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSaveProgram}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Program</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// Sub-component for Program Cards
function ProgramCard({ program, onEdit, onDelete, onViewParticipants }) {
  const location = LOCATION_TYPES.find((l) => l.value === program.locationType);

  return (
    <View style={styles.programCard}>
      {program.posterUrl ? (
        <Image
          source={{ uri: program.posterUrl }}
          style={styles.posterThumb}
          resizeMode="cover"
        />
      ) : null}

      <View style={styles.cardTop}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{program.category}</Text>
        </View>
        <Text style={styles.dateText}>{formatDateTime(program.startsAt)}</Text>
      </View>

      <Text style={styles.programTitle}>{program.title}</Text>

      <View style={styles.metaRow}>
        <Ionicons name={location?.icon} size={15} color="#475569" />
        <Text style={styles.locationText} numberOfLines={1}>
          {location?.label}: {program.locationDetails}
        </Text>
      </View>

      <View style={styles.tagRow}>
        <View
          style={[styles.tag, program.isPaid ? styles.paidTag : styles.freeTag]}
        >
          <Ionicons
            name={program.isPaid ? "cash-outline" : "gift-outline"}
            size={12}
            color={program.isPaid ? "#B45309" : "#15803D"}
          />
          <Text
            style={[
              styles.tagText,
              program.isPaid ? styles.paidTagText : styles.freeTagText,
            ]}
          >
            {program.isPaid
              ? `${program.currency} ${Number(program.amount).toLocaleString()}`
              : "Free"}
          </Text>
        </View>

        {program.moderators.length > 0 && (
          <View style={[styles.tag, styles.infoTag]}>
            <Ionicons
              name="shield-checkmark-outline"
              size={12}
              color="#475569"
            />
            <Text style={[styles.tagText, styles.infoTagText]}>
              {program.moderators.length}{" "}
              {program.moderators.length === 1 ? "moderator" : "moderators"}
            </Text>
          </View>
        )}
      </View>

      {program.description ? (
        <Text style={styles.descriptionText} numberOfLines={2}>
          {program.description}
        </Text>
      ) : (
        <View style={{ height: 8 }} />
      )}

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.viewParticipantsBtn}
          onPress={onViewParticipants}
        >
          <Ionicons name="people-outline" size={16} color="#FFFFFF" />
          <Text style={styles.viewParticipantsText}>
            View Participants ({program.participants.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconActionBtn} onPress={onEdit}>
          <Ionicons name="pencil-outline" size={18} color="#0284C7" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconActionBtn} onPress={onDelete}>
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
