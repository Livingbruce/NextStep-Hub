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
  Switch,
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
import { getSlots } from "./schedule";

const MAX_MODERATORS = 10;
const MAX_DAYS = 90;
const DAY_PRESETS = [
  { label: "1 day", n: 1 },
  { label: "3 days", n: 3 },
  { label: "5 days", n: 5 },
  { label: "1 week", n: 7 },
  { label: "2 weeks", n: 14 },
  { label: "1 month", n: 30 },
];
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

const fmtT = (v) =>
  new Date(v).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

// Put the hours/minutes of `t` onto the calendar day of `day`.
const dayEnd = (day, t) => {
  const d = new Date(day);
  d.setHours(t.getHours(), t.getMinutes(), 0, 0);
  return d;
};

// The i-th session day after `start` (optionally skipping Sat/Sun).
const nthDay = (start, i, skipWeekends) => {
  const d = new Date(start);
  let count = 0;
  while (count < i) {
    d.setDate(d.getDate() + 1);
    if (!skipWeekends || (d.getDay() !== 0 && d.getDay() !== 6)) count++;
  }
  return d;
};

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

// Responsive tiles: 4 across when the sheet is wide, otherwise 2 across.
function Segments({ options, value, onChange }) {
  const [w, setW] = useState(0);
  const cols = w >= 460 ? Math.min(options.length, 4) : 2;
  const basis = `${Math.floor(100 / cols) - 2}%`;

  return (
    <View style={cp.segGrid} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {options.map((o) => {
        const on = value === o.value;
        return (
          <PressableScale
            key={String(o.value)}
            haptic
            scaleTo={0.95}
            containerStyle={{ flexBasis: basis, flexGrow: 1, minWidth: 100 }}
            style={[cp.segTile, on && cp.segOn]}
            onPress={() => onChange(o.value)}
          >
            <Ionicons
              name={o.icon}
              size={20}
              color={on ? "#FFFFFF" : "#64748B"}
            />
            <Text
              style={[cp.segTileText, on && cp.segTileTextOn]}
              numberOfLines={2}
            >
              {o.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

// mode: "datetime" | "time"
function PickerField({ label, value, mode, onChange, minimumDate }) {
  const icon = mode === "time" ? "time-outline" : "calendar-outline";

  const openAndroid = () => {
    if (mode === "time") {
      DateTimePickerAndroid.open({
        value,
        mode: "time",
        onChange: (e, t) => e.type === "set" && t && onChange(t),
      });
      return;
    }
    DateTimePickerAndroid.open({
      value,
      mode: "date",
      minimumDate,
      onChange: (e, date) => {
        if (e.type !== "set" || !date) return;
        DateTimePickerAndroid.open({
          value: date,
          mode: "time",
          onChange: (te, time) => {
            if (te.type !== "set" || !time) return;
            const c = new Date(date);
            c.setHours(time.getHours(), time.getMinutes(), 0, 0);
            onChange(c);
          },
        });
      },
    });
  };

  return (
    <View style={cp.pickerCol}>
      <Text style={cp.subLabel}>{label}</Text>
      {Platform.OS === "android" ? (
        <PressableScale style={cp.pickerBtn} onPress={openAndroid}>
          <Ionicons name={icon} size={18} color="#1E3A8A" />
          <Text style={cp.pickerText} numberOfLines={1}>
            {mode === "time" ? fmtT(value) : fmt(value)}
          </Text>
        </PressableScale>
      ) : (
        <View style={{ alignItems: "flex-start" }}>
          <DateTimePicker
            value={value}
            mode={mode}
            display="compact"
            minimumDate={minimumDate}
            onChange={(_, s) => s && onChange(s)}
          />
        </View>
      )}
    </View>
  );
}

function Body({ program, saving, onClose, onSubmit }) {
  const editing = !!program;

  // Seed schedule when editing
  const seedSlots = program ? getSlots(program) : null;
  const seedStart = seedSlots ? seedSlots[0].start : defaultStart();
  const seedEnd = seedSlots
    ? seedSlots[0].end
    : new Date(seedStart.getTime() + 2 * 3600000);
  const seedCustom =
    !!seedSlots &&
    seedSlots.length > 1 &&
    seedSlots.some(
      (s) => fmtT(s.start) !== fmtT(seedStart) || fmtT(s.end) !== fmtT(seedEnd),
    );

  const [title, setTitle] = useState(program?.title || "");
  const [category, setCategory] = useState(program?.category || "");
  const [description, setDescription] = useState(program?.description || "");

  const [startsAt, setStartsAt] = useState(seedStart);
  const [endTime, setEndTime] = useState(seedEnd);
  const [days, setDays] = useState(String(seedSlots?.length || 1));
  const [skipWeekends, setSkipWeekends] = useState(false);
  const [custom, setCustom] = useState(seedCustom);
  // Days 2..n when customising: [{ start: Date, endTime: Date }]
  const [rows, setRows] = useState(
    seedCustom
      ? seedSlots.slice(1).map((s) => ({ start: s.start, endTime: s.end }))
      : [],
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

  const n = Math.max(1, Math.min(parseInt(days || "1", 10) || 1, MAX_DAYS));

  const generatedRow = (
    i,
    base = startsAt,
    t = endTime,
    skip = skipWeekends,
  ) => {
    const start = nthDay(base, i, skip);
    return { start, endTime: dayEnd(start, t) };
  };

  // Final schedule (Date objects)
  const schedule = [
    { start: startsAt, end: dayEnd(startsAt, endTime) },
    ...Array.from({ length: n - 1 }, (_, k) => {
      const r = custom && rows[k] ? rows[k] : generatedRow(k + 1);
      return { start: r.start, end: dayEnd(r.start, r.endTime) };
    }),
  ];

  const changeDays = (text) => {
    const digits = text.replace(/[^0-9]/g, "");
    const clamped = digits
      ? String(Math.min(parseInt(digits, 10), MAX_DAYS))
      : "";
    setDays(clamped);
    const next = Math.max(1, parseInt(clamped || "1", 10));
    if (custom) {
      setRows((prev) =>
        Array.from(
          { length: next - 1 },
          (_, k) => prev[k] || generatedRow(k + 1),
        ),
      );
    }
  };

  const toggleCustom = (on) => {
    setCustom(on);
    if (on) {
      setRows(Array.from({ length: n - 1 }, (_, k) => generatedRow(k + 1)));
    }
  };

  const setRow = (k, patch) =>
    setRows((prev) =>
      prev.map((r, idx) => (idx === k ? { ...r, ...patch } : r)),
    );

  const activeLoc = LOCATION_TYPES.find((l) => l.value === locationType);

  const changeCount = (text) => {
    const digits = text.replace(/[^0-9]/g, "");
    if (!digits) {
      setModCount("");
      setMods([]);
      return;
    }
    const c = Math.min(parseInt(digits, 10), MAX_MODERATORS);
    setModCount(String(c));
    setMods((prev) =>
      Array.from({ length: c }, (_, i) => prev[i] || emptyModerator()),
    );
  };

  const setMod = (i, f, v) =>
    setMods((prev) => prev.map((m, idx) => (idx === i ? { ...m, [f]: v } : m)));

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
        allowsEditing: false,
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

    if (!editing && startsAt < new Date()) {
      return "Please choose a future date and time.";
    }

    for (let i = 0; i < schedule.length; i++) {
      const s = schedule[i];
      const l = `Day ${i + 1}`;
      if (s.end <= s.start) return `${l}: end time must be after start time.`;
      if (i > 0 && s.start < schedule[i - 1].end) {
        return `${l} must start after day ${i} ends.`;
      }
    }

    if (locationType === "physical" && !locationDetails.trim()) {
      return "Please enter the physical venue or address.";
    }

    if (locationType === "virtual") {
      if (!locationDetails.trim()) {
        return "Please enter the external meeting link.";
      }
      const link = locationDetails.trim();
      if (!/^https?:\/\/|^[\w-]+(\.[\w-]+)+/.test(link)) {
        return "Enter a valid meeting link.";
      }
    }

    if (isPaid && !(parseFloat(amount) > 0)) {
      return "Please enter a valid amount for this paid program.";
    }

    for (let i = 0; i < mods.length; i++) {
      const m = mods[i];
      const l = `Moderator ${i + 1}`;
      if (!m.name.trim()) return `${l}: name is required.`;
      if (!EMAIL_REGEX.test(m.email.trim())) {
        return `${l}: enter a valid email address.`;
      }
      if (m.phone.replace(/\D/g, "").length < 9) {
        return `${l}: enter a valid phone number.`;
      }
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
      startsAt: schedule[0].start,
      endsAt: schedule[schedule.length - 1].end,
      days: n,
      schedule,
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

        {/* ---------------- Duration ---------------- */}
        <Text style={cp.label}>Number of days *</Text>
        <Text style={cp.helper}>
          Running over several days, weeks or months? Enter the total number of
          session days, then set the timetable.
        </Text>
        <View style={cp.chipRow}>
          {DAY_PRESETS.map((p) => {
            const on = n === p.n;
            return (
              <PressableScale
                key={p.n}
                scaleTo={0.94}
                haptic
                style={[cp.dayChip, on && cp.dayChipOn]}
                onPress={() => changeDays(String(p.n))}
              >
                <Text style={[cp.dayChipText, on && cp.dayChipTextOn]}>
                  {p.label}
                </Text>
              </PressableScale>
            );
          })}
        </View>
        <Input
          placeholder={`1 to ${MAX_DAYS}`}
          value={days}
          onChangeText={changeDays}
          keyboardType="number-pad"
          maxLength={2}
        />

        {/* ---------------- Timetable ---------------- */}
        <Text style={cp.label}>
          {n > 1 ? "Day 1 timetable *" : "Date & time *"}
        </Text>
        <View style={cp.timeRow}>
          <PickerField
            label="Starts"
            mode="datetime"
            value={startsAt}
            minimumDate={editing ? undefined : new Date()}
            onChange={setStartsAt}
          />
          <PickerField
            label="Ends at"
            mode="time"
            value={endTime}
            onChange={setEndTime}
          />
        </View>

        {n > 1 && (
          <Animated.View entering={FadeInDown.duration(220)}>
            <View style={cp.switchRow}>
              <Text style={cp.switchLabel}>Skip weekends</Text>
              <Switch
                value={skipWeekends}
                onValueChange={setSkipWeekends}
                disabled={custom}
                trackColor={{ false: "#E2E8F0", true: "#93C5FD" }}
                thumbColor={skipWeekends ? "#1E3A8A" : "#94A3B8"}
              />
            </View>
            <View style={cp.switchRow}>
              <Text style={cp.switchLabel}>
                Set different times for each day
              </Text>
              <Switch
                value={custom}
                onValueChange={toggleCustom}
                trackColor={{ false: "#E2E8F0", true: "#93C5FD" }}
                thumbColor={custom ? "#1E3A8A" : "#94A3B8"}
              />
            </View>

            {custom ? (
              rows.slice(0, n - 1).map((r, k) => (
                <Animated.View
                  key={k}
                  entering={FadeInDown.duration(200)}
                  style={cp.dayCard}
                >
                  <Text style={cp.dayCardTitle}>Day {k + 2}</Text>
                  <View style={[cp.timeRow, { marginBottom: 0 }]}>
                    <PickerField
                      label="Starts"
                      mode="datetime"
                      value={r.start}
                      onChange={(v) => setRow(k, { start: v })}
                    />
                    <PickerField
                      label="Ends at"
                      mode="time"
                      value={r.endTime}
                      onChange={(v) => setRow(k, { endTime: v })}
                    />
                  </View>
                </Animated.View>
              ))
            ) : (
              <Text style={cp.helper}>
                Every day runs {fmtT(startsAt)} – {fmtT(endTime)}. Last day:{" "}
                {new Date(schedule[n - 1].start).toLocaleDateString("en-US", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                .
              </Text>
            )}
          </Animated.View>
        )}

        {/* ---------------- Delivery ---------------- */}
        <Text style={cp.label}>Program delivery method *</Text>
        <Segments
          options={LOCATION_TYPES}
          value={locationType}
          onChange={(v) => {
            setLocationType(v);
            setLocationDetails("");
          }}
        />

        {(locationType === "physical" || locationType === "virtual") && (
          <Input
            placeholder={activeLoc?.placeholder}
            value={locationDetails}
            onChangeText={setLocationDetails}
            autoCapitalize="none"
            keyboardType={locationType === "virtual" ? "url" : "default"}
          />
        )}

        {locationType === "in_app_video" && (
          <Text style={cp.helper}>
            Clients join a video session inside the app. They can join late
            while you're live, until you end the room or the day's end time
            passes.
          </Text>
        )}
        {locationType === "in_app_audio" && (
          <Text style={cp.helper}>
            Clients join an audio-only session inside the app. They can join
            late while you're live, until you end the room or the day's end time
            passes.
          </Text>
        )}

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
