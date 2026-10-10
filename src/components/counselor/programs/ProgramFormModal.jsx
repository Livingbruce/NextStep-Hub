import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  ZoomIn,
} from "react-native-reanimated";
import { cp } from "../../../styles/(counselor)/programsUi";
import PressableScale from "../../client/appointments/PressableScale";
import { LOCATION_TYPES } from "./CounselorProgramCard";

const MAX_MODERATORS = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const emptyModerator = () => ({ name: "", email: "", phone: "" });

const defaultStart = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return d;
};

const fmt = (v) =>
  new Date(v).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function Input({ style, ...props }) {
  const [focus, setFocus] = useState(false);
  return (
    <TextInput
      placeholderTextColor="#94A3B8"
      selectionColor="#1E3A8A"
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={[cp.input, focus && cp.inputFocus, style]}
      {...props}
    />
  );
}

function Segments({ options, value, onChange }) {
  return (
    <View style={cp.segRow}>
      {options.map((o) => {
        const on = value === o.value;
        return (
          <PressableScale
            key={String(o.value)}
            haptic
            scaleTo={0.95}
            containerStyle={{ flex: 1 }}
            style={[cp.seg, on && cp.segOn]}
            onPress={() => onChange(o.value)}
          >
            <Ionicons
              name={o.icon}
              size={16}
              color={on ? "#FFFFFF" : "#64748B"}
            />
            <Text style={[cp.segText, on && cp.segTextOn]}>{o.label}</Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

function Body({ program, saving, onClose, onSubmit }) {
  const editing = !!program;
  const [title, setTitle] = useState(program?.title || "");
  const [category, setCategory] = useState(program?.category || "");
  const [description, setDescription] = useState(program?.description || "");
  const [startsAt, setStartsAt] = useState(
    program ? new Date(program.startsAt) : defaultStart(),
  );
  const [locationType, setLocationType] = useState(
    program?.locationType || "physical",
  );
  const [locationDetails, setLocationDetails] = useState(
    program?.locationDetails || "",
  );
  const [isPaid, setIsPaid] = useState(program?.isPaid || false);
  const [amount, setAmount] = useState(
    program?.amount ? String(Math.round(Number(program.amount))) : "",
  );
  const [poster, setPoster] = useState(
    program?.posterUrl ? { uri: program.posterUrl, isNew: false } : null,
  );
  const [modCount, setModCount] = useState(
    String(program?.moderators.length || 0),
  );
  const [mods, setMods] = useState(
    program?.moderators.map((m) => ({
      name: m.name,
      email: m.email,
      phone: m.phone,
    })) || [],
  );

  const activeLoc = LOCATION_TYPES.find((l) => l.value === locationType);

  const changeCount = (text) => {
    const digits = text.replace(/[^0-9]/g, "");
    if (!digits) {
      setModCount("");
      setMods([]);
      return;
    }
    const n = Math.min(parseInt(digits, 10), MAX_MODERATORS);
    setModCount(String(n));
    setMods((prev) =>
      Array.from({ length: n }, (_, i) => prev[i] || emptyModerator()),
    );
  };

  const setMod = (i, f, v) =>
    setMods((prev) => prev.map((m, idx) => (idx === i ? { ...m, [f]: v } : m)));

  const openAndroid = () => {
    DateTimePickerAndroid.open({
      value: startsAt,
      mode: "date",
      minimumDate: editing ? undefined : new Date(),
      onChange: (e, date) => {
        if (e.type !== "set" || !date) return;
        DateTimePickerAndroid.open({
          value: date,
          mode: "time",
          onChange: (te, time) => {
            if (te.type !== "set" || !time) return;
            const c = new Date(date);
            c.setHours(time.getHours(), time.getMinutes(), 0, 0);
            setStartsAt(c);
          },
        });
      },
    });
  };

  const pickPoster = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Permission required",
          "Allow access to your photos to add a poster.",
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
      const a = result.assets[0];
      if (!a.base64) {
        Alert.alert("Upload failed", "Could not read the selected image.");
        return;
      }
      let ext = a.uri?.split(".").pop()?.toLowerCase() || "jpeg";
      if (ext === "jpg") ext = "jpeg";
      if (!["jpeg", "png", "webp"].includes(ext)) ext = "jpeg";
      setPoster({ uri: a.uri, base64: a.base64, ext, isNew: true });
    } catch (e) {
      Alert.alert("Error", e?.message || "Could not select the image.");
    }
  };

  const validate = () => {
    if (!title.trim()) return "Please enter the program title.";
    if (!editing && startsAt < new Date())
      return "Please choose a future date and time.";
    if (!locationDetails.trim())
      return "Please enter the venue, meeting link or phone details.";
    if (isPaid && !(parseFloat(amount) > 0))
      return "Please enter a valid amount for this paid program.";
    for (let i = 0; i < mods.length; i++) {
      const m = mods[i];
      const l = `Moderator ${i + 1}`;
      if (!m.name.trim()) return `${l}: name is required.`;
      if (!EMAIL_REGEX.test(m.email.trim()))
        return `${l}: enter a valid email address.`;
      if (m.phone.replace(/\D/g, "").length < 9)
        return `${l}: enter a valid phone number.`;
    }
    return null;
  };

  const submit = () => {
    const problem = validate();
    if (problem) return Alert.alert("Missing information", problem);
    onSubmit({
      title,
      category,
      description,
      startsAt,
      locationType,
      locationDetails,
      isPaid,
      amount,
      poster,
      moderators: mods,
    });
  };

  return (
    <Animated.View
      entering={ZoomIn.duration(240).springify().damping(16)}
      style={cp.sheet}
    >
      <Text style={cp.fTitle}>
        {editing ? "Edit program" : "Create new program"}
      </Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={{ flexGrow: 0 }}
      >
        <Text style={cp.label}>Program title *</Text>
        <Input
          placeholder="e.g. Campus Readiness Workshop"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={cp.label}>Category</Text>
        <Input
          placeholder="e.g. Pre-Campus Transition"
          value={category}
          onChangeText={setCategory}
        />

        <Text style={cp.label}>Date & time *</Text>
        {Platform.OS === "android" ? (
          <PressableScale style={cp.dateBtn} onPress={openAndroid}>
            <Ionicons name="calendar-outline" size={18} color="#1E3A8A" />
            <Text style={{ fontSize: 14, color: "#0F172A" }}>
              {fmt(startsAt)}
            </Text>
          </PressableScale>
        ) : (
          <View style={{ alignItems: "flex-start", marginBottom: 14 }}>
            <DateTimePicker
              value={startsAt}
              mode="datetime"
              display="compact"
              minimumDate={editing ? undefined : new Date()}
              onChange={(_, s) => s && setStartsAt(s)}
            />
          </View>
        )}

        <Text style={cp.label}>Location type *</Text>
        <Segments
          options={LOCATION_TYPES}
          value={locationType}
          onChange={(v) => {
            if (v !== locationType) {
              setLocationType(v);
              setLocationDetails("");
            }
          }}
        />
        <Input
          placeholder={activeLoc?.placeholder}
          value={locationDetails}
          onChangeText={setLocationDetails}
          autoCapitalize="none"
          keyboardType={
            locationType === "phone"
              ? "phone-pad"
              : locationType === "virtual"
                ? "url"
                : "default"
          }
        />

        <Text style={cp.label}>Attendance fee *</Text>
        <Segments
          options={[
            { label: "Free", value: false, icon: "gift-outline" },
            { label: "Paid", value: true, icon: "cash-outline" },
          ]}
          value={isPaid}
          onChange={(v) => {
            setIsPaid(v);
            if (!v) setAmount("");
          }}
        />
        {isPaid && (
          <Animated.View
            entering={FadeInDown.duration(220)}
            exiting={FadeOut.duration(120)}
            style={cp.amountRow}
          >
            <View style={cp.cur}>
              <Text style={cp.curText}>KES</Text>
            </View>
            <TextInput
              style={cp.amountInput}
              placeholder="Amount per participant"
              placeholderTextColor="#94A3B8"
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ""))}
              keyboardType="numeric"
              maxLength={7}
            />
          </Animated.View>
        )}

        <Text style={cp.label}>Description</Text>
        <Input
          style={cp.area}
          multiline
          placeholder="What will this program cover?"
          value={description}
          onChangeText={setDescription}
        />

        <Text style={cp.label}>Event poster (optional)</Text>
        {poster ? (
          <Animated.View
            entering={FadeIn.duration(220)}
            style={{ marginBottom: 14 }}
          >
            <Image
              source={{ uri: poster.uri }}
              style={cp.posterPreview}
              resizeMode="cover"
            />
            <View style={cp.posterBtns}>
              <PressableScale style={cp.posterBtn} onPress={pickPoster}>
                <Ionicons name="swap-horizontal" size={16} color="#FFF" />
              </PressableScale>
              <PressableScale
                style={cp.posterBtn}
                onPress={() => setPoster(null)}
              >
                <Ionicons name="close" size={16} color="#FFF" />
              </PressableScale>
            </View>
          </Animated.View>
        ) : (
          <PressableScale style={cp.posterPick} onPress={pickPoster}>
            <Ionicons name="image-outline" size={28} color="#94A3B8" />
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#64748B" }}>
              Add poster image
            </Text>
            <Text style={{ fontSize: 11, color: "#94A3B8" }}>
              JPG, PNG or WebP
            </Text>
          </PressableScale>
        )}

        <Text style={cp.label}>Number of invigilators / moderators</Text>
        <Input
          placeholder={`0 to ${MAX_MODERATORS}`}
          value={modCount}
          onChangeText={changeCount}
          keyboardType="number-pad"
          maxLength={2}
        />
        {mods.map((m, i) => (
          <Animated.View
            key={i}
            entering={FadeInDown.duration(220)}
            style={cp.modCard}
          >
            <Text style={cp.modTitle}>Moderator {i + 1}</Text>
            <Input
              placeholder="Full name"
              value={m.name}
              onChangeText={(t) => setMod(i, "name", t)}
            />
            <Input
              placeholder="Email address"
              value={m.email}
              onChangeText={(t) => setMod(i, "email", t)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              style={{ marginBottom: 0 }}
              placeholder="Phone number"
              value={m.phone}
              onChangeText={(t) => setMod(i, "phone", t)}
              keyboardType="phone-pad"
            />
          </Animated.View>
        ))}
      </ScrollView>

      <View style={cp.fActions}>
        <PressableScale
          containerStyle={{ flex: 1 }}
          style={[cp.fBtn, { backgroundColor: "#F1F5F9" }]}
          onPress={onClose}
          disabled={saving}
        >
          <Text style={{ fontWeight: "800", color: "#475569" }}>Cancel</Text>
        </PressableScale>
        <PressableScale
          haptic
          containerStyle={{ flex: 1.4 }}
          style={[cp.fBtn, { backgroundColor: "#16A34A" }]}
          onPress={submit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={{ fontWeight: "800", color: "#FFFFFF" }}>
              Save program
            </Text>
          )}
        </PressableScale>
      </View>
    </Animated.View>
  );
}

// `open` toggles the modal; `program` is null for create, or the program to edit.
export default function ProgramFormModal({
  open,
  program,
  saving,
  onClose,
  onSubmit,
}) {
  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      onRequestClose={() => !saving && onClose()}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Animated.View entering={FadeIn.duration(180)} style={cp.overlay}>
          {open && (
            <Body
              key={program?.id || "new"}
              program={program}
              saving={saving}
              onClose={onClose}
              onSubmit={onSubmit}
            />
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
