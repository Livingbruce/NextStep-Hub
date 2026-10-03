import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { styles } from "../../../styles/(client)/appointments/index";
import { ui } from "../../../styles/(client)/appointments/ui";
import { relativeLabel } from "../home/time";
import PressableScale from "./PressableScale";

const HISTORY = [
  "completed",
  "cancelled_by_client",
  "cancelled_by_counselor",
  "cancelled",
  "not_attended",
  "missed",
  "no_show",
];
const CANCELLED = [
  "cancelled_by_client",
  "cancelled_by_counselor",
  "cancelled",
];
const MISSED = ["not_attended", "missed", "no_show"];

export const isHistoryAppointment = (app) => HISTORY.includes(app.status);

const formatStatus = (status, paymentStatus) => {
  switch (status) {
    case "completed":
      return { label: "Done", bg: "#E0F2FE", text: "#0369A1" };
    case "cancelled_by_client":
    case "cancelled_by_counselor":
    case "cancelled":
      return { label: "Cancelled", bg: "#FEE2E2", text: "#DC2626" };
    case "not_attended":
    case "missed":
    case "no_show":
      return { label: "Not attended", bg: "#FEF3C7", text: "#B45309" };
    case "scheduled":
      return { label: "Confirmed", bg: "#DCFCE7", text: "#15803D" };
    case "pending_payment":
      return paymentStatus === "completed"
        ? { label: "Confirmed", bg: "#DCFCE7", text: "#15803D" }
        : { label: "Pending payment", bg: "#FEF3C7", text: "#B45309" };
    default:
      return {
        label: (status || "pending").replace(/_/g, " "),
        bg: "#F1F5F9",
        text: "#475569",
      };
  }
};

const formatDateTime = (iso) => {
  if (!iso) return { dateStr: "N/A", timeStr: "N/A" };
  const d = new Date(iso);
  return {
    dateStr: d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    timeStr: d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};

const initialsOf = (first = "", last = "") =>
  `${first.trim().charAt(0)}${last.trim().charAt(0)}`.toUpperCase() || "C";

function Detail({ title, children }) {
  return (
    <View style={styles.detailBlock}>
      <Text style={styles.detailTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function AppointmentCard({
  item,
  index = 0,
  expanded,
  onToggle,
  onCancel,
  onReview,
  onDelete,
  busy,
  style,
}) {
  const [cancelReason, setCancelReason] = useState("");
  const [reviewText, setReviewText] = useState("");

  const rotation = useSharedValue(0);
  useEffect(() => {
    rotation.set(withTiming(expanded ? 1 : 0, { duration: 220 }));
  }, [expanded, rotation]);
  const chevron = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.get() * 180}deg` }],
  }));

  const meta = formatStatus(item.status, item.payment_status);
  const { dateStr, timeStr } = formatDateTime(item.scheduled_start_time);

  const isDone = item.status === "completed";
  const isCancelled = CANCELLED.includes(item.status);
  const isMissed = MISSED.includes(item.status);
  const isActive = !isHistoryAppointment(item);

  const first = item.counselor?.first_name || "";
  const last = item.counselor?.surname || "";
  const counselorName = item.counselor
    ? `Counselor ${first} ${last}`.trim()
    : "Unassigned counselor";

  const counselorReview = item.reviews?.find(
    (r) => r.reviewer_role === "counselor",
  );
  const clientReview = item.reviews?.find((r) => r.reviewer_role === "client");

  const when = isActive
    ? relativeLabel(item.scheduled_start_time, Date.now())
    : "";

  const openLink = async (url) => {
    try {
      await Linking.openURL(url);
    } catch {
      /* ignore: the link is shown so it can be copied */
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 6) * 60)
        .duration(380)
        .springify()
        .damping(18)}
      exiting={FadeOut.duration(180)}
      layout={LinearTransition.duration(260)}
      style={[styles.card, ui.cardClip, style]}
    >
      {/* Status accent: colour doubles as a quick status read */}
      <View style={[ui.accent, { backgroundColor: meta.text }]} />

      <PressableScale
        scaleTo={0.985}
        haptic
        onPress={onToggle}
        accessibilityLabel={`${counselorName}, ${item.counseling_type} session, ${meta.label}`}
        accessibilityState={{ expanded }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.counselorInfo}>
            {item.counselor?.avatar_url ? (
              <Image
                source={{ uri: item.counselor.avatar_url }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>{initialsOf(first, last)}</Text>
              </View>
            )}
            <View style={styles.counselorTextWrapper}>
              <Text style={styles.counselorName} numberOfLines={1}>
                {counselorName}
              </Text>
              <Text style={styles.typeText}>
                {item.counseling_type} session
              </Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
            <Text style={[styles.statusText, { color: meta.text }]}>
              {meta.label}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={16} color="#64748B" />
            <Text style={styles.metaText}>{dateStr}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={16} color="#64748B" />
            <Text style={styles.metaText}>{timeStr}</Text>
          </View>
          <View style={ui.footerRight}>
            {!!when && (
              <View style={ui.whenChip}>
                <Text style={ui.whenText}>{when}</Text>
              </View>
            )}
            <Animated.View style={chevron}>
              <Ionicons name="chevron-down" size={18} color="#94A3B8" />
            </Animated.View>
          </View>
        </View>
      </PressableScale>

      {expanded && (
        <Animated.View
          entering={FadeIn.duration(240)}
          exiting={FadeOut.duration(120)}
          style={styles.expandedContent}
        >
          {item.session_link && isActive && (
            <Detail title="Session meeting link">
              <TouchableOpacity onPress={() => openLink(item.session_link)}>
                <Text style={styles.linkText} numberOfLines={1}>
                  {item.session_link}
                </Text>
              </TouchableOpacity>
            </Detail>
          )}

          {item.reasons?.length > 0 && (
            <Detail title="Reasons for session">
              <Text style={styles.detailText}>
                {item.reasons.join(", ")}
                {item.other_reason ? ` (${item.other_reason})` : ""}
              </Text>
            </Detail>
          )}

          {!!item.session_goals && (
            <Detail title="Session goals">
              <Text style={styles.detailText}>{item.session_goals}</Text>
            </Detail>
          )}

          <Detail title="Prior therapy experience">
            <Text style={styles.detailText}>
              {item.had_therapy_before ? "Yes" : "No"}
            </Text>
          </Detail>

          {!!item.notes && (
            <Detail title="Counselor session notes">
              <Text style={styles.detailText}>{item.notes}</Text>
            </Detail>
          )}

          {!!counselorReview?.counselor_notes && (
            <Detail title="Counselor review notes">
              <Text style={styles.detailText}>
                {counselorReview.counselor_notes}
              </Text>
            </Detail>
          )}

          {!!clientReview?.feedback_text && (
            <Detail title="Your feedback">
              <Text style={styles.detailText}>
                {clientReview.feedback_text}
              </Text>
            </Detail>
          )}

          {/* ---- Actions ---- */}
          {isDone ? (
            <View style={ui.actions}>
              {!clientReview && (
                <>
                  <Text style={styles.actionLabel}>Leave a review</Text>
                  <TextInput
                    style={styles.actionInput}
                    placeholder="Share feedback on your session..."
                    placeholderTextColor="#94A3B8"
                    value={reviewText}
                    onChangeText={setReviewText}
                    multiline
                  />
                </>
              )}
              <View style={styles.actionButtonRow}>
                <PressableScale
                  containerStyle={{ flex: 1 }}
                  style={[styles.actionBtn, styles.deleteBtn]}
                  onPress={() => onDelete(item.id)}
                  disabled={busy}
                >
                  <Ionicons name="trash-outline" size={16} color="#DC2626" />
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </PressableScale>

                {!clientReview && (
                  <PressableScale
                    containerStyle={{ flex: 2 }}
                    style={[styles.actionBtn, styles.submitBtn, { flex: 0 }]}
                    haptic
                    onPress={() => onReview(item.id, reviewText)}
                    disabled={busy}
                  >
                    {busy ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.submitBtnText}>Submit review</Text>
                    )}
                  </PressableScale>
                )}
              </View>
            </View>
          ) : isCancelled || isMissed ? (
            <View style={ui.actions}>
              <Text style={styles.cancelledNotice}>
                {isCancelled
                  ? "This appointment was cancelled."
                  : "This session was marked as not attended."}
                {isCancelled && item.action_reason
                  ? `\nReason: "${item.action_reason}"`
                  : ""}
              </Text>
              <PressableScale
                style={[styles.actionBtn, styles.deleteBtn, { marginTop: 10 }]}
                onPress={() => onDelete(item.id)}
                disabled={busy}
              >
                <Ionicons name="trash-outline" size={16} color="#DC2626" />
                <Text style={styles.deleteBtnText}>Delete record</Text>
              </PressableScale>
            </View>
          ) : (
            <View style={ui.actions}>
              <Text style={styles.actionLabel}>Reason for cancellation</Text>
              <TextInput
                style={styles.actionInput}
                placeholder="Tell us why you are cancelling..."
                placeholderTextColor="#94A3B8"
                value={cancelReason}
                onChangeText={setCancelReason}
                multiline
              />
              <PressableScale
                style={[styles.actionBtn, styles.cancelBtn]}
                onPress={() => onCancel(item.id, cancelReason)}
                disabled={busy}
              >
                {busy ? (
                  <ActivityIndicator size="small" color="#DC2626" />
                ) : (
                  <Text style={styles.cancelBtnText}>Cancel appointment</Text>
                )}
              </PressableScale>
            </View>
          )}
        </Animated.View>
      )}
    </Animated.View>
  );
}
