import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown, ZoomIn } from "react-native-reanimated";
import { b, MAUVE } from "../../../styles/(client)/appointments/booking";
import PressableScale from "../appointments/PressableScale";
import {
  addMinutes,
  atMinutes,
  DURATIONS,
  fmtTime,
  MODES,
  toDateStr,
} from "./slots";

export const COUNSELING_TYPES = [
  {
    value: "Individual",
    icon: "person-outline",
    text: "One-on-one, just you and your counselor.",
  },
  {
    value: "Group",
    icon: "people-outline",
    text: "A guided session with others.",
  },
  { value: "Couple", icon: "heart-outline", text: "For you and your partner." },
  {
    value: "Family",
    icon: "home-outline",
    text: "Bring family members into the conversation.",
  },
  {
    value: "Student",
    icon: "school-outline",
    text: "Study, course and campus life support.",
  },
  {
    value: "Teen",
    icon: "happy-outline",
    text: "A space designed for teenagers.",
  },
];

export const REASONS = [
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

/* ------------------------------ building blocks ------------------------------ */

function Tick({ on, square }) {
  return (
    <View style={[b.tick, square && { borderRadius: 7 }, on && b.tickOn]}>
      {on && (
        <Animated.View entering={ZoomIn.duration(160)}>
          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
        </Animated.View>
      )}
    </View>
  );
}

export function OptionCard({
  icon,
  title,
  subtitle,
  selected,
  onPress,
  square,
  children,
  right,
}) {
  return (
    <PressableScale
      scaleTo={0.985}
      haptic
      onPress={onPress}
      accessibilityState={{ selected }}
      style={[b.option, selected && b.optionOn]}
    >
      {!!icon && (
        <View style={[b.optionIcon, selected && b.optionIconOn]}>
          <Ionicons
            name={icon}
            size={20}
            color={selected ? MAUVE : "#64748B"}
          />
        </View>
      )}
      <View style={b.optionText}>
        <Text style={b.optionTitle}>{title}</Text>
        {!!subtitle && <Text style={b.optionSub}>{subtitle}</Text>}
        {children}
      </View>
      {right}
      <Tick on={selected} square={square} />
    </PressableScale>
  );
}

function Chip({ label, on, onPress }) {
  return (
    <PressableScale
      scaleTo={0.94}
      haptic
      onPress={onPress}
      style={[b.chip, on && b.chipOn]}
    >
      <Text style={[b.chipText, on && b.chipTextOn]}>{label}</Text>
    </PressableScale>
  );
}

function Field({ error, style, ...props }) {
  const [focus, setFocus] = useState(false);
  return (
    <View>
      <TextInput
        placeholderTextColor="#94A3B8"
        selectionColor={MAUVE}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={[
          b.input,
          focus && b.inputFocus,
          !!error && { borderColor: "#DC2626" },
          style,
        ]}
        {...props}
      />
      {!!error && <Text style={b.error}>{error}</Text>}
    </View>
  );
}

/* ----------------------------------- steps ----------------------------------- */

export function TypeStep({ form, update }) {
  return (
    <View style={b.stack}>
      {COUNSELING_TYPES.map((t) => (
        <OptionCard
          key={t.value}
          icon={t.icon}
          title={t.value}
          subtitle={t.text}
          selected={form.type === t.value}
          onPress={() => update({ type: t.value })}
        />
      ))}
    </View>
  );
}

export function ReasonsStep({ form, update }) {
  const toggle = (r) =>
    update({
      reasons: form.reasons.includes(r)
        ? form.reasons.filter((x) => x !== r)
        : [...form.reasons, r],
    });
  return (
    <View>
      <View style={b.chips}>
        {REASONS.map((r) => (
          <Chip
            key={r}
            label={r}
            on={form.reasons.includes(r)}
            onPress={() => toggle(r)}
          />
        ))}
      </View>
      {form.reasons.includes("Other") && (
        <Animated.View
          entering={FadeInDown.duration(250)}
          style={{ marginTop: 18 }}
        >
          <Text style={b.groupLabel}>Tell us more</Text>
          <Field
            multiline
            style={b.textArea}
            placeholder="Describe your reason..."
            value={form.otherReason}
            onChangeText={(otherReason) => update({ otherReason })}
          />
        </Animated.View>
      )}
    </View>
  );
}

export function GoalsStep({ form, update }) {
  return (
    <View>
      <Text style={b.groupLabel}>What do you hope to achieve?</Text>
      <Field
        multiline
        style={b.textArea}
        placeholder="Share your goals and expectations..."
        value={form.goals}
        onChangeText={(goals) => update({ goals })}
      />
      <View style={b.gap} />
      <Text style={b.groupLabel}>
        Have you had counseling or therapy before?
      </Text>
      <View style={b.chips}>
        <Chip
          label="Yes"
          on={form.therapy === true}
          onPress={() => update({ therapy: true })}
        />
        <Chip
          label="No"
          on={form.therapy === false}
          onPress={() => update({ therapy: false })}
        />
      </View>
    </View>
  );
}

export function SessionStep({ form, update, phoneError }) {
  return (
    <View>
      <Text style={b.groupLabel}>Session length</Text>
      <View style={b.tiles}>
        {DURATIONS.map((d) => {
          const on = form.duration === d.min;
          return (
            <PressableScale
              key={d.min}
              containerStyle={{ flexGrow: 1, flexBasis: "47%" }}
              scaleTo={0.96}
              haptic
              onPress={() => update({ duration: d.min })}
              accessibilityState={{ selected: on }}
              style={[b.tile, on && b.tileOn]}
            >
              <Text style={[b.tileNum, on && b.tileNumOn]}>{d.min}</Text>
              <Text style={b.tileUnit}>minutes</Text>
              <Text style={b.tileCap}>{d.caption}</Text>
            </PressableScale>
          );
        })}
      </View>

      <View style={b.gap} />
      <Text style={b.groupLabel}>How should we meet?</Text>
      <View style={b.stack}>
        {MODES.map((m) => (
          <OptionCard
            key={m.value}
            icon={m.icon}
            title={m.title}
            subtitle={m.text}
            selected={form.mode === m.value}
            onPress={() => update({ mode: m.value })}
          />
        ))}
      </View>

      {form.mode === "phone" && (
        <Animated.View
          entering={FadeInDown.duration(260)}
          style={{ marginTop: 16 }}
        >
          <Text style={b.groupLabel}>Number your counselor should call</Text>
          <Field
            keyboardType="phone-pad"
            placeholder="07XX XXX XXX"
            maxLength={16}
            value={form.callPhone}
            onChangeText={(t) =>
              update({ callPhone: t.replace(/[^0-9+\s\-()]/g, "") })
            }
            error={phoneError}
          />
          {!phoneError && (
            <Text style={b.hint}>
              Keep your phone nearby and on at your session time.
            </Text>
          )}
        </Animated.View>
      )}
    </View>
  );
}

export function CounselorStep({ counselors, fetching, form, update }) {
  if (fetching)
    return (
      <ActivityIndicator
        size="large"
        color={MAUVE}
        style={{ marginVertical: 30 }}
      />
    );
  if (!counselors.length) {
    return (
      <Text style={b.hint}>
        No counselors are available right now. Please check back later.
      </Text>
    );
  }
  return (
    <View style={b.stack}>
      {counselors.map((c) => {
        const name =
          `Counselor ${c.first_name || ""} ${c.surname || ""}`.trim();
        const specs = c.specializations?.length
          ? c.specializations.join(" • ")
          : "General counseling";
        return (
          <OptionCard
            key={c.id}
            title={name}
            subtitle={specs}
            selected={form.counselorId === c.id}
            onPress={() =>
              update({ counselorId: c.id, dateStr: "", slot: null })
            }
            right={
              c.avatar_url ? (
                <Image source={{ uri: c.avatar_url }} style={b.avatar} />
              ) : (
                <View style={[b.avatar, b.avatarFallback]}>
                  <Ionicons name="person" size={22} color={MAUVE} />
                </View>
              )
            }
          >
            {c.years_of_experience != null && (
              <Text style={b.exp}>
                {c.years_of_experience}{" "}
                {c.years_of_experience === 1 ? "year" : "years"} of experience
              </Text>
            )}
            {!!c.about && (
              <Text style={[b.optionSub, { marginTop: 4 }]} numberOfLines={2}>
                {c.about}
              </Text>
            )}
          </OptionCard>
        );
      })}
    </View>
  );
}

export function TimeStep({
  form,
  update,
  dates,
  absentDays,
  slots,
  loadingSlots,
}) {
  const { width } = useWindowDimensions();
  const cols = width >= 520 ? 4 : 3;
  const usable = Math.min(width, 640) - 40;
  const slotW = (usable - 8 * (cols - 1)) / cols;
  const anyFree = slots.some((s) => s.available);

  return (
    <View>
      <Text style={b.groupLabel}>Pick a day</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={b.dateStrip}
      >
        {dates.map((d) => {
          const str = toDateStr(d);
          const off = absentDays.includes(str);
          const on = form.dateStr === str;
          return (
            <PressableScale
              key={str}
              scaleTo={0.94}
              haptic
              disabled={off}
              onPress={() => update({ dateStr: str, slot: null })}
              accessibilityLabel={`${d.toDateString()}${off ? ", counselor unavailable" : ""}`}
              style={[b.date, on && b.dateOn, off && b.dateOff]}
            >
              <Text style={[b.dateDow, on && b.dateTextOn]}>
                {d.toLocaleDateString("en-US", { weekday: "short" })}
              </Text>
              <Text style={[b.dateNum, on && b.dateTextOn]}>{d.getDate()}</Text>
              <Text style={[b.dateMon, on && b.dateTextOn]}>
                {d.toLocaleDateString("en-US", { month: "short" })}
              </Text>
            </PressableScale>
          );
        })}
      </ScrollView>

      <View style={b.gap} />
      <Text style={b.groupLabel}>Pick a start time</Text>
      {!form.dateStr ? (
        <Text style={b.hint}>Choose a day to see open times.</Text>
      ) : loadingSlots ? (
        <ActivityIndicator color={MAUVE} style={{ marginVertical: 20 }} />
      ) : !anyFree ? (
        <Text style={b.hint}>
          No {form.duration}-minute times left on this day. Try another day.
        </Text>
      ) : (
        <Animated.View
          key={form.dateStr}
          entering={FadeIn.duration(250)}
          style={b.slots}
        >
          {slots.map((s) => {
            const on = form.slot === s.start;
            return (
              <PressableScale
                key={s.start}
                containerStyle={{ width: slotW }}
                scaleTo={0.95}
                haptic
                disabled={!s.available}
                onPress={() => update({ slot: s.start })}
                style={[b.slot, on && b.slotOn, !s.available && b.slotOff]}
              >
                <Text
                  style={[
                    b.slotText,
                    on && b.slotTextOn,
                    !s.available && b.slotTextOff,
                  ]}
                >
                  {s.label}
                </Text>
              </PressableScale>
            );
          })}
        </Animated.View>
      )}

      {form.slot != null && (
        <Animated.Text entering={FadeIn} style={b.endsAt}>
          {fmtTime(form.slot)} to {fmtTime(form.slot + form.duration)} (
          {form.duration} min)
        </Animated.Text>
      )}
    </View>
  );
}

export function ReviewStep({
  form,
  update,
  counselor,
  price,
  currency,
  onOpenTerms,
}) {
  const start =
    form.dateStr && form.slot != null
      ? atMinutes(form.dateStr, form.slot)
      : null;
  const end = start ? addMinutes(start, form.duration) : null;
  const rows = [
    ["Counseling", `${form.type} session`],
    [
      "Reasons",
      form.reasons
        .map((r) => (r === "Other" ? `Other: ${form.otherReason}` : r))
        .join(", "),
    ],
    [
      "Counselor",
      counselor
        ? `${counselor.first_name} ${counselor.surname}`
        : "Not selected",
    ],
    [
      "Date",
      start
        ? start.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })
        : "",
    ],
    [
      "Time",
      start
        ? `${fmtTime(form.slot)} to ${fmtTime(form.slot + form.duration)}`
        : "",
    ],
    ["Length", `${form.duration} minutes`],
    [
      "How",
      form.mode === "phone"
        ? `Phone call on ${form.callPhone.trim()}`
        : "Online (link added later)",
    ],
  ];

  return (
    <View>
      <View style={b.summary}>
        {rows.map(([label, value], i) => (
          <View key={label} style={[b.row, i === rows.length - 1 && b.rowLast]}>
            <Text style={b.rowLabel}>{label}</Text>
            <Text style={b.rowValue}>{value}</Text>
          </View>
        ))}
      </View>

      <View style={b.price}>
        <Text style={b.priceLabel}>Session fee</Text>
        <Text style={b.priceValue}>
          {currency} {price != null ? Number(price).toLocaleString() : "..."}
        </Text>
      </View>

      <PressableScale
        scaleTo={0.99}
        style={b.terms}
        onPress={() => update({ agreed: !form.agreed })}
      >
        <Tick on={form.agreed} square />
        <Text style={b.termsText}>
          I agree to the{" "}
          <Text style={b.link} onPress={onOpenTerms}>
            Terms and Conditions
          </Text>{" "}
          and consent to virtual counseling services.
        </Text>
      </PressableScale>
    </View>
  );
}

export function DoneStep({ form, onFinish }) {
  const phone = form.mode === "phone";
  return (
    <View style={b.done}>
      <Animated.View
        entering={ZoomIn.duration(450).springify().damping(10)}
        style={[b.doneCircle, { backgroundColor: "#DCFCE7" }]}
      >
        <Ionicons name="checkmark" size={52} color="#16A34A" />
      </Animated.View>
      <Animated.Text entering={FadeInDown.delay(200)} style={b.doneTitle}>
        You're booked
      </Animated.Text>
      <Animated.Text entering={FadeInDown.delay(280)} style={b.doneText}>
        {phone
          ? `Your counselor will call you on ${form.callPhone.trim()} at your session time.`
          : "Your counselor will add the meeting link before your session. You'll get a notification when it's ready."}
      </Animated.Text>
      <Animated.View entering={FadeInDown.delay(360)} style={{ width: "100%" }}>
        <PressableScale
          haptic
          style={[b.btn, b.btnMain, { flex: 0 }]}
          onPress={onFinish}
        >
          <Text style={b.btnMainText}>View my appointments</Text>
        </PressableScale>
      </Animated.View>
    </View>
  );
}
