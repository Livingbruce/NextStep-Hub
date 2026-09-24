import { StyleSheet } from "react-native";

export const ACCENT = "#F05A2B";
export const INK = "#0F172A";

export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ACCENT },

  /* ---------- Header ---------- */
  header: { overflow: "hidden" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: INK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  backSpacer: { width: 40, height: 40 },
  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: INK,
    letterSpacing: -0.4,
  },
  stepPill: {
    minWidth: 40,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: "rgba(15,23,42,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepPillText: { fontSize: 12, fontWeight: "800", color: INK },

  /* ---------- Step indicator ---------- */
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 30,
    marginTop: 16,
  },
  stepNodeWrap: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNode: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNodeText: { fontSize: 13, fontWeight: "900" },
  stepLabel: {
    position: "absolute",
    top: 36,
    left: -30,
    width: 90,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(15,23,42,0.6)",
  },
  stepLabelActive: { color: INK, fontWeight: "900" },
  stepLine: {
    flex: 1,
    height: 3,
    marginHorizontal: 8,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
    overflow: "hidden",
  },
  stepLineFill: { height: "100%", backgroundColor: "#FFFFFF" },

  /* ---------- Sheet ---------- */
  sheet: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    overflow: "hidden",
  },
  sheetContent: { flexGrow: 1, alignItems: "center", paddingTop: 26 },
  column: { width: "100%", maxWidth: 480 },

  stepTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: INK,
    letterSpacing: -0.5,
  },
  stepSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
  },

  rolePill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: "#FFF3EE",
    borderWidth: 1,
    borderColor: "#FFD9CB",
  },
  rolePillText: { fontSize: 12, fontWeight: "800", color: "#9A3412" },

  form: { gap: 16, marginTop: 20 },

  /* ---------- Fields ---------- */
  fieldError: {
    marginTop: 6,
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "#DC2626",
  },
  eye: { padding: 4 },
  matchIcon: { marginRight: 6 },

  groupLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  groupLabel: { fontSize: 14, fontWeight: "800", color: "#334155" },
  requiredStar: { color: "#DC2626", fontWeight: "800" },

  /* ---------- Chips ---------- */
  chipsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipText: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  chipTextSelected: { color: ACCENT, fontWeight: "800" },

  /* ---------- Password strength ---------- */
  strengthWrap: { marginTop: 10, marginHorizontal: 2 },
  strengthRow: { flexDirection: "row", gap: 6 },
  strengthSegment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },
  strengthFill: { flex: 1, borderRadius: 3 },
  strengthLabel: { marginTop: 6, fontSize: 12, fontWeight: "700" },

  /* ---------- Specializations ---------- */
  specRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  specRemove: {
    width: 44,
    height: 60,
    borderRadius: 16,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  addSpecButton: { flexDirection: "row", alignItems: "center", gap: 4 },
  addSpecText: { fontSize: 13, fontWeight: "800", color: ACCENT },

  /* ---------- Messages ---------- */
  errorBanner: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    marginTop: 16,
    borderRadius: 14,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#991B1B",
    fontWeight: "500",
  },
  errorAction: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "800",
    color: "#DC2626",
  },

  noteRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18, color: "#64748B" },

  linkRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
    paddingTop: 4,
  },
  linkText: { fontSize: 14, color: "#64748B" },
  linkAccent: { fontSize: 14, fontWeight: "800", color: ACCENT },

  /* ---------- Sticky footer ---------- */
  footer: {
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    backgroundColor: "#FFFFFF",
  },
  footerInner: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    maxWidth: 480,
  },
  footerBack: { flex: 0.8 },
  footerNext: { flex: 1.4 },

  /* ---------- Success ---------- */
  successWrap: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 14,
  },
  successBadgeBox: {
    width: 110,
    height: 110,
    alignItems: "center",
    justifyContent: "center",
  },
  successBadge: {
    width: 92,
    height: 92,
    borderRadius: 46,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: INK,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  successBody: {
    fontSize: 14,
    lineHeight: 21,
    color: "#64748B",
    textAlign: "center",
    paddingHorizontal: 8,
  },
  successNotice: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  successNoticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: "#92400E",
  },
  confettiPiece: { position: "absolute" },
});
