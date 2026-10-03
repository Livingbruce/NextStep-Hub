import { StyleSheet } from "react-native";

const MAUVE = "#936D9A";

export const ui = StyleSheet.create({
  // Screen
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    alignItems: "center",
  },
  content: {
    width: "100%",
    maxWidth: 1100,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  title: { fontSize: 24, fontWeight: "800", color: "#0F172A" },
  subtitle: { fontSize: 13, color: "#64748B", marginTop: 2 },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: MAUVE,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    shadowColor: MAUVE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  newBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start" },

  // Tabs
  tabIndicator: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabHit: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
  },
  tabCount: {
    minWidth: 20,
    paddingHorizontal: 6,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  tabCountActive: { backgroundColor: MAUVE },
  tabCountText: { fontSize: 11, fontWeight: "700", color: "#475569" },
  tabCountTextActive: { color: "#FFFFFF" },

  // Card
  cardClip: { overflow: "hidden" },
  accent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  footerRight: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  whenChip: {
    backgroundColor: "#F5EEF7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  whenText: { fontSize: 11, fontWeight: "700", color: MAUVE },
  actions: { marginTop: 8 },

  // Empty state
  empty: {
    alignItems: "center",
    paddingVertical: 56,
    paddingHorizontal: 24,
    width: "100%",
  },
  emptyCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F5EEF7",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 20,
    maxWidth: 320,
  },
});
