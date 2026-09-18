import { Dimensions, StyleSheet } from "react-native";

const { height } = Dimensions.get("window");

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressStepText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#E3562A",
  },
  progressTitleText: {
    fontSize: 12,
    color: "#64748B",
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#E3562A",
    borderRadius: 3,
  },
  formGroup: {
    gap: 16,
  },
  inputContainer: {
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  labelRowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },
  requiredStar: {
    color: "#DC2626",
    marginLeft: 4,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },

  /* --- ROLE SELECTION STYLES --- */
  roleSelectionGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 4,
  },
  roleCard: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  selectedRoleCard: {
    borderColor: "#E3562A",
    backgroundColor: "#FFF5F2",
  },
  roleCardText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 6,
    textAlign: "center",
  },
  selectedRoleCardText: {
    color: "#E3562A",
    fontWeight: "700",
  },

  /* --- INPUT STYLES --- */
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: "#FFFFFF",
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
  },

  /* --- SPECIALIZATIONS (Counselor, Step 2) --- */
  addSpecButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addSpecText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#E3562A",
  },
  specInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  removeSpecButton: {
    width: 40,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#FEF2F2",
  },

  /* --- CHIP / OPTIONS SELECTION (Gender, Relationship, Religion) --- */
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  selectedChip: {
    borderColor: "#E3562A",
    backgroundColor: "#FFF5F2",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  selectedChipText: {
    color: "#E3562A",
    fontWeight: "700",
  },

  /* --- BUTTON STYLES --- */
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  nextButton: {
    flex: 1,
    height: 50,
    backgroundColor: "#E3562A",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  fullWidthButton: {
    width: "100%",
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  backStepButton: {
    flex: 1,
    height: 50,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  backStepText: {
    color: "#475569",
    fontSize: 16,
    fontWeight: "600",
  },
});
