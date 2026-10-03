import { StyleSheet } from "react-native";

const GREEN = "#16A34A";

// Additions on top of ./Profile.js (which keeps the shared card styles).
export const pui = StyleSheet.create({
  center: { justifyContent: "center", alignItems: "center" },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    alignItems: "center",
  },
  content: { width: "100%", maxWidth: 900 },

  // Header actions
  headerActions: { flexDirection: "row", alignItems: "center", gap: 6 },

  // Avatar
  avatarBusy: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 50,
    backgroundColor: "rgba(15,23,42,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Completion
  completion: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    marginBottom: 16,
  },
  completionTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  completionTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  completionPct: { fontSize: 14, fontWeight: "800", color: GREEN },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 4, backgroundColor: GREEN },
  completionHint: { fontSize: 12, color: "#64748B", marginTop: 8 },

  // Layout
  columns: { flexDirection: "row", gap: 16, alignItems: "flex-start" },
  column: { flex: 1 },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  cardIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A" },

  // Fields
  field: { marginBottom: 16 },
  inputBox: {
    borderWidth: 1.5,
    borderRadius: 10,
    marginTop: 2,
  },
  input: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  muted: { color: "#94A3B8", fontWeight: "500" },
  hint: { fontSize: 11, color: "#94A3B8", marginTop: 4 },

  // Chips
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  chipSelected: { backgroundColor: "#DCFCE7", borderColor: GREEN },
  chipText: { fontSize: 12, fontWeight: "600", color: "#64748B" },
  chipTextSelected: { color: "#15803D", fontWeight: "700" },
});
