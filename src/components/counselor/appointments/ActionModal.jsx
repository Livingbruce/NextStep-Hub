import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";
import { ca } from "../../../styles/(counselor)/appointmentsUi";
import PressableScale from "../../client/appointments/PressableScale";

const CONFIG = {
  cancel: {
    title: "Cancel appointment",
    icon: "close-circle",
    color: "#DC2626",
    tint: "#FEE2E2",
    submit: "Cancel session",
    placeholder: "State reason...",
  },
  attended: {
    title: "Mark as attended",
    icon: "checkmark-circle",
    color: "#16A34A",
    tint: "#DCFCE7",
    submit: "Mark attended",
    placeholder: "Leave session notes / clinical summary...",
  },
  noshow: {
    title: "Mark as no show",
    icon: "eye-off",
    color: "#EA580C",
    tint: "#FFEDD5",
    submit: "Mark no show",
    placeholder: "Note any relevant details...",
  },
  transfer: {
    title: "Transfer session",
    icon: "swap-horizontal",
    color: "#0284C7",
    tint: "#E0F2FE",
    submit: "Transfer",
    placeholder: "State reason...",
  },
  postpone: {
    title: "Postpone session",
    icon: "time",
    color: "#D97706",
    tint: "#FEF3C7",
    submit: "Postpone",
    placeholder: "State reason...",
  },
};

function Body({ type, loading, onClose, onSubmit }) {
  const cfg = CONFIG[type];
  const [input, setInput] = useState("");
  const [postponeDate, setPostponeDate] = useState("");

  return (
    <Animated.View
      entering={ZoomIn.duration(240).springify().damping(16)}
      style={ca.sheet}
    >
      <View style={ca.mHead}>
        <View style={[ca.mIcon, { backgroundColor: cfg.tint }]}>
          <Ionicons name={cfg.icon} size={22} color={cfg.color} />
        </View>
        <Text style={ca.mTitle}>{cfg.title}</Text>
      </View>

      {type === "postpone" && (
        <TextInput
          style={ca.mInput}
          placeholder="Proposed date / time (e.g. Next Mon, 2 PM)"
          placeholderTextColor="#94A3B8"
          value={postponeDate}
          onChangeText={setPostponeDate}
          selectionColor={cfg.color}
        />
      )}

      <TextInput
        style={[ca.mInput, ca.mArea]}
        placeholder={cfg.placeholder}
        placeholderTextColor="#94A3B8"
        multiline
        value={input}
        onChangeText={setInput}
        selectionColor={cfg.color}
      />

      <View style={ca.mActions}>
        <PressableScale
          containerStyle={{ flex: 1 }}
          style={[ca.mBtn, { backgroundColor: "#F1F5F9" }]}
          onPress={onClose}
          disabled={loading}
        >
          <Text style={{ fontWeight: "800", color: "#475569" }}>Back</Text>
        </PressableScale>
        <PressableScale
          haptic
          containerStyle={{ flex: 1.4 }}
          style={[ca.mBtn, { backgroundColor: cfg.color }]}
          onPress={() => onSubmit({ input, postponeDate })}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={{ fontWeight: "800", color: "#FFFFFF" }}>
              {cfg.submit}
            </Text>
          )}
        </PressableScale>
      </View>
    </Animated.View>
  );
}

export default function ActionModal({ type, loading, onClose, onSubmit }) {
  return (
    <Modal
      visible={!!type}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <Animated.View entering={FadeIn.duration(180)} style={ca.overlay}>
          {!!type && (
            <Body
              key={type}
              type={type}
              loading={loading}
              onClose={onClose}
              onSubmit={onSubmit}
            />
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
