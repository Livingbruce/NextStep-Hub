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

  // Progress Tracker
  progressContainer: {
    marginBottom: 28,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressStepText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#E3562A",
  },
  progressTitleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "#F1F5F9",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#E3562A",
    borderRadius: 3,
  },

  // Form Fields
  formGroup: {
    gap: 16,
  },
  inputContainer: {
    gap: 6,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },
  requiredStar: {
    fontSize: 14,
    fontWeight: "700",
    color: "#DC2626",
    marginLeft: 2,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
  },

  // Selectable Options (Gender, Relationship, Religion)
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  selectedChip: {
    backgroundColor: "#FEF2F2",
    borderColor: "#E3562A",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#475569",
  },
  selectedChipText: {
    color: "#E3562A",
    fontWeight: "700",
  },

  // Actions
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 32,
  },
  backStepButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  backStepText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#475569",
  },
  nextButton: {
    flex: 2,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E3562A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  fullWidthButton: {
    flex: 1,
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
