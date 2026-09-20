import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F1E4", // Warm background palette
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F6F1E4",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    marginVertical: 12,
  },
  backButton: {
    backgroundColor: "#16A34A",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  // Navigation
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFDF7",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  navTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E2B28",
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },

  // Poster
  posterImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  posterPlaceholder: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  placeholderCategory: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#15803D",
  },

  // Card Content
  card: {
    backgroundColor: "#FFFDF7",
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "600",
  },
  priceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  freeBadge: {
    backgroundColor: "#DCFCE7",
  },
  paidBadge: {
    backgroundColor: "#FEF3C7",
  },
  priceBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  freeText: {
    color: "#15803D",
  },
  paidText: {
    color: "#B45309",
  },

  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E2B28",
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#334155",
    fontWeight: "500",
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E2B28",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 22,
  },

  // Facilitators
  modCard: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 8,
  },
  modInfo: {
    marginLeft: 10,
  },
  modName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E2B28",
  },
  modContact: {
    fontSize: 12,
    color: "#64748B",
  },

  // Footer Buttons
  footerContainer: {
    padding: 16,
    backgroundColor: "#FFFDF7",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  registerButton: {
    backgroundColor: "#16A34A",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 10,
  },
  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginRight: 8,
  },
  payButton: {
    backgroundColor: "#0284C7",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 10,
  },
  payButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  registeredBanner: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingVertical: 12,
    borderRadius: 10,
  },
  registeredText: {
    color: "#15803D",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 8,
  },

  // Modal Styling
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFDF7",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1E2B28",
  },
  modalSubText: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 16,
  },
  qrContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  qrImage: {
    width: 180,
    height: 180,
  },
  qrCaption: {
    marginTop: 8,
    fontSize: 12,
    color: "#64748B",
  },
  paybillBox: {
    backgroundColor: "#F1F5F9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  paybillLabel: {
    fontSize: 13,
    color: "#475569",
    marginVertical: 2,
  },
  paybillValue: {
    fontWeight: "700",
    color: "#1E2B28",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E2B28",
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#1E2B28",
    marginBottom: 16,
  },
  confirmPayButton: {
    backgroundColor: "#16A34A",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  confirmPayText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  // Location & Conditional Meeting Box
  locationContainer: {
    marginTop: 8,
  },
  lockedBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  lockedText: {
    fontSize: 13,
    color: "#92400E",
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
  unlockedBox: {
    backgroundColor: "#F0FDF4",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  unlockedTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#15803D",
    marginLeft: 6,
  },
  unlockedDetailsText: {
    fontSize: 14,
    color: "#1E2B28",
    fontWeight: "600",
    marginTop: 4,
  },
  linkButton: {
    backgroundColor: "#16A34A",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 6,
  },
  linkButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
    flex: 1,
  },
});
